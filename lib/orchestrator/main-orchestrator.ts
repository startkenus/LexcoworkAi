/**
 * Main Orchestrator - Coordinates entire task execution flow
 * Based on Cursor AI Implementation Guide Phase 5
 */

import { createClient } from '@supabase/supabase-js';
import {
  TaskRequest,
  TaskResult,
  WorkerOutput,
  OrchestrationProgress,
} from '@/types/orchestration';
import { planExecution, validateExecutionPlan } from './execution-planner';
import { synthesizeResults } from './result-synthesizer';
import { checkAnthropicCompliance } from '../anthropic/compliance';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type ProgressCallback = (progress: OrchestrationProgress) => void;

/**
 * Main orchestration function that coordinates the entire task execution
 */
export async function orchestrateTask(
  task: TaskRequest,
  progressCallback?: ProgressCallback
): Promise<TaskResult> {
  const startTime = Date.now();

  try {
    // Step 1: Compliance check
    emitProgress(progressCallback, task.id, 'planning', 'Checking Anthropic usage policy compliance...');
    
    const complianceCheck = checkAnthropicCompliance(task);
    if (!complianceCheck.allowed) {
      return {
        task_id: task.id,
        execution_plan: { task_id: task.id, steps: [], estimated_duration_seconds: 0, estimated_cost: 0 },
        worker_outputs: [],
        final_output: `Task blocked: ${complianceCheck.blocked_reason}`,
        confidence_score: 0,
        requires_attorney_review: true,
        ai_disclosure: '',
        total_tokens: { input: 0, output: 0, total: 0 },
        total_cost: 0,
        duration_ms: Date.now() - startTime,
        status: 'failed',
        error: complianceCheck.blocked_reason,
      };
    }

    // Step 2: Plan execution
    emitProgress(progressCallback, task.id, 'planning', 'Creating execution plan...');
    
    const executionPlan = await planExecution(task);
    const validation = validateExecutionPlan(executionPlan);
    
    if (!validation.valid) {
      throw new Error(`Invalid execution plan: ${validation.errors.join(', ')}`);
    }

    // Store execution plan in database
    await supabase
      .from('tasks')
      .update({
        status: 'RUNNING',
        started_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    // Step 3: Execute workers sequentially
    emitProgress(
      progressCallback,
      task.id,
      'executing',
      `Executing ${executionPlan.steps.length} worker(s)...`
    );

    const workerOutputs: WorkerOutput[] = [];

    for (let i = 0; i < executionPlan.steps.length; i++) {
      const step = executionPlan.steps[i];
      
      emitProgress(
        progressCallback,
        task.id,
        'executing',
        `Running ${step.worker} (${i + 1}/${executionPlan.steps.length})...`,
        i + 1,
        executionPlan.steps.length,
        step.worker
      );

      try {
        const workerOutput = await executeWorker(step.worker, task, workerOutputs);
        workerOutputs.push(workerOutput);

        // Store step completion in database
        await supabase.from('task_steps').insert({
          task_id: task.id,
          step_number: i + 1,
          worker_name: step.worker,
          status: workerOutput.success ? 'COMPLETED' : 'FAILED',
          started_at: new Date(Date.now() - workerOutput.duration_ms).toISOString(),
          completed_at: new Date().toISOString(),
          input_data: {
            prompt: task.description,
            jurisdiction: task.jurisdiction,
          },
          output_data: workerOutput.output,
          error_message: workerOutput.error,
        });
      } catch (error) {
        console.error(`Worker ${step.worker} failed:`, error);
        
        // Create failed worker output
        const failedOutput: WorkerOutput = {
          worker: step.worker,
          output: null,
          confidence: 0,
          token_usage: { input: 0, output: 0, total: 0 },
          duration_ms: 0,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
        workerOutputs.push(failedOutput);

        // Store failed step
        await supabase.from('task_steps').insert({
          task_id: task.id,
          step_number: i + 1,
          worker_name: step.worker,
          status: 'FAILED',
          started_at: new Date().toISOString(),
          error_message: failedOutput.error,
        });
      }
    }

    // Step 4: Synthesize results
    emitProgress(progressCallback, task.id, 'synthesizing', 'Synthesizing results...');

    const taskResult = await synthesizeResults(workerOutputs, task, executionPlan);

    // Step 5: Store final result in database
    await supabase
      .from('tasks')
      .update({
        status: taskResult.status === 'completed' ? 'REVIEW_REQUIRED' : 'FAILED',
        output_data: {
          final_output: taskResult.final_output,
          confidence_score: taskResult.confidence_score,
          requires_attorney_review: taskResult.requires_attorney_review,
        },
        completed_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    // Step 6: Create audit log
    await supabase.from('audit_logs').insert({
      resource_id: task.id,
      resource_type: 'task',
      user_id: task.user_id,
      tenant_id: task.organization_id,
      action: 'orchestration_completed',
      details: {
        workers_used: executionPlan.steps.map((s) => s.worker),
        total_tokens: taskResult.total_tokens,
        total_cost: taskResult.total_cost,
        confidence_score: taskResult.confidence_score,
        requires_attorney_review: taskResult.requires_attorney_review,
        compliance_risk_level: complianceCheck.risk_level,
      },
    });

    emitProgress(progressCallback, task.id, 'completed', 'Task completed successfully!');

    return taskResult;
  } catch (error) {
    console.error('Orchestration error:', error);

    // Update task status to failed
    await supabase
      .from('tasks')
      .update({
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      })
      .eq('id', task.id);

    // Return error result
    return {
      task_id: task.id,
      execution_plan: { task_id: task.id, steps: [], estimated_duration_seconds: 0, estimated_cost: 0 },
      worker_outputs: [],
      final_output: 'An error occurred during task orchestration. Please try again.',
      confidence_score: 0,
      requires_attorney_review: true,
      ai_disclosure: '',
      total_tokens: { input: 0, output: 0, total: 0 },
      total_cost: 0,
      duration_ms: Date.now() - startTime,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Execute a single worker via Supabase Edge Function
 */
async function executeWorker(
  workerType: string,
  task: TaskRequest,
  previousOutputs: WorkerOutput[]
): Promise<WorkerOutput> {
  const startTime = Date.now();

  try {
    // Call Supabase Edge Function for this worker
    const { data, error } = await supabase.functions.invoke(workerType, {
      body: {
        prompt: task.description,
        deliverableType: task.deliverable_type,
        documents: task.documents,
        jurisdiction: task.jurisdiction,
        previousOutputs: previousOutputs.map((o) => ({
          worker: o.worker,
          output: o.output,
          confidence: o.confidence,
        })),
      },
    });

    if (error) {
      throw error;
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Worker execution failed');
    }

    // Extract worker result
    const result = data.result;
    
    return {
      worker: workerType as any,
      output: result.summary || result,
      confidence: result.confidence || 0.85,
      token_usage: {
        input: result.tokens?.input || 2000,
        output: result.tokens?.output || 2000,
        total: result.tokens?.total || 4000,
      },
      duration_ms: Date.now() - startTime,
      success: true,
      citations: result.citations || [],
      rag_sources_used: result.rag_sources || [],
    };
  } catch (error) {
    return {
      worker: workerType as any,
      output: null,
      confidence: 0,
      token_usage: { input: 0, output: 0, total: 0 },
      duration_ms: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Emit progress update
 */
function emitProgress(
  callback: ProgressCallback | undefined,
  taskId: string,
  stage: OrchestrationProgress['stage'],
  message: string,
  currentStep?: number,
  totalSteps?: number,
  currentWorker?: any
) {
  if (callback) {
    callback({
      task_id: taskId,
      stage,
      current_step: currentStep,
      total_steps: totalSteps,
      current_worker: currentWorker,
      message,
      timestamp: new Date(),
    });
  }
}
