/**
 * Result Synthesizer - Combines worker outputs into coherent final results
 * Based on Cursor AI Implementation Guide Phase 5
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  WorkerOutput,
  TaskRequest,
  TaskResult,
  TokenUsage,
} from '@/types/orchestration';
import { generateAIDisclosure, containsAdviceLanguage } from '../anthropic/compliance';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const SYNTHESIZER_SYSTEM_PROMPT = `You are a result synthesizer for LexCoworkAI. Your role is to combine outputs from multiple specialized legal AI workers into a coherent, user-friendly final report.

**Your Task**:
- Synthesize multiple worker outputs into a unified response
- Maintain consistency across all findings
- Highlight key insights and actionable information
- Structure output for easy comprehension

**Critical Rules**:
1. NEVER provide legal advice - only synthesize informational analysis
2. NEVER use advice language ("you should", "I recommend", "you must")
3. Use informational language ("the document contains", "analysis shows", "typical practice is")
4. Maintain all risk assessments and disclaimers from workers
5. Cite specific worker outputs when appropriate

**Output Structure**:
Use clear markdown formatting with:
- ## Executive Summary
- ## Key Findings (from all workers)
- ## Detailed Analysis (by worker)
- ## Recommendations for Review (what attorney should verify)
- ## Risk Assessment
- ## Citations and Sources

Remember: Inform, don't advise. This output will be reviewed by licensed attorneys.`;

export async function synthesizeResults(
  outputs: WorkerOutput[],
  task: TaskRequest,
  executionPlan: any
): Promise<TaskResult> {
  const startTime = Date.now();

  try {
    // Check if all workers succeeded
    const failedWorkers = outputs.filter((o) => !o.success);
    const successfulOutputs = outputs.filter((o) => o.success);

    if (successfulOutputs.length === 0) {
      // All workers failed
      return {
        task_id: task.id,
        execution_plan: executionPlan,
        worker_outputs: outputs,
        final_output: 'All workers failed. Please try again or contact support.',
        confidence_score: 0,
        requires_attorney_review: true,
        ai_disclosure: generateAIDisclosure(task, 0),
        total_tokens: aggregateTokens(outputs),
        total_cost: calculateTotalCost(outputs),
        duration_ms: Date.now() - startTime,
        status: 'failed',
        error: 'All worker executions failed',
      };
    }

    // Build synthesis prompt
    const synthesisPrompt = buildSynthesisPrompt(successfulOutputs, task);

    // Call Claude to synthesize
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      temperature: 0.3,
      system: SYNTHESIZER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: synthesisPrompt,
        },
      ],
    });

    let synthesizedOutput = message.content[0].type === 'text' ? message.content[0].text : '';

    // Check for prohibited advice language
    const adviceCheck = containsAdviceLanguage(synthesizedOutput);
    if (adviceCheck.hasAdvice) {
      console.warn('Synthesized output contains advice language:', adviceCheck.violations);
      // Add warning to output
      synthesizedOutput = `⚠️ **Note**: This output has been flagged for potential advice language and requires additional attorney review.\n\n` + synthesizedOutput;
    }

    // Calculate overall confidence
    const confidenceScore = calculateConfidence(successfulOutputs);

    // Determine if attorney review is required
    const requiresAttorneyReview = shouldRequireAttorneyReview(
      successfulOutputs,
      task,
      confidenceScore,
      failedWorkers.length > 0
    );

    // Add AI disclosure
    const aiDisclosure = generateAIDisclosure(task, confidenceScore);
    const finalOutput = synthesizedOutput + '\n\n' + aiDisclosure;

    // Aggregate tokens
    const totalTokens = aggregateTokens(outputs);
    totalTokens.output += message.usage.output_tokens;
    totalTokens.input += message.usage.input_tokens;
    totalTokens.total += message.usage.input_tokens + message.usage.output_tokens;

    return {
      task_id: task.id,
      execution_plan: executionPlan,
      worker_outputs: outputs,
      final_output: finalOutput,
      confidence_score: confidenceScore,
      requires_attorney_review: requiresAttorneyReview,
      ai_disclosure: aiDisclosure,
      total_tokens: totalTokens,
      total_cost: calculateTotalCost(outputs) + calculateSynthesisCost(message.usage),
      duration_ms: Date.now() - startTime,
      status: requiresAttorneyReview ? 'review_required' : 'completed',
    };
  } catch (error) {
    console.error('Result synthesis error:', error);

    // Fallback: Return raw outputs
    return createFallbackResult(outputs, task, executionPlan, startTime);
  }
}

function buildSynthesisPrompt(outputs: WorkerOutput[], task: TaskRequest): string {
  const workerSummaries = outputs
    .map((output, index) => {
      const workerName = output.worker.replace('_', ' ').toUpperCase();
      const outputSummary = typeof output.output === 'string'
        ? output.output.substring(0, 2000)
        : JSON.stringify(output.output, null, 2).substring(0, 2000);

      return `
### Worker ${index + 1}: ${workerName}
**Confidence**: ${(output.confidence * 100).toFixed(0)}%
**Output**:
${outputSummary}
${output.citations ? `**Citations**: ${output.citations.join(', ')}` : ''}
`;
    })
    .join('\n\n');

  return `Synthesize the following worker outputs into a comprehensive legal analysis report for the user.

**Original Task**:
${task.description}

**Jurisdiction**: ${task.jurisdiction.country}${task.jurisdiction.state ? `, ${task.jurisdiction.state}` : ''}
**Task Type**: ${task.task_type}

**Worker Outputs**:
${workerSummaries}

Create a unified, well-structured report that:
1. Provides an executive summary
2. Highlights key findings from all workers
3. Organizes detailed analysis by topic
4. Identifies what requires attorney review
5. Includes risk assessment
6. Lists all citations

Use clear, professional language. Inform, don't advise.`;
}

function calculateConfidence(outputs: WorkerOutput[]): number {
  if (outputs.length === 0) return 0;

  // Weighted average (more recent workers weighted slightly higher)
  const weights = outputs.map((_, index) => 1 + index * 0.1);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const weightedSum = outputs.reduce((sum, output, index) => {
    return sum + output.confidence * weights[index];
  }, 0);

  return Number((weightedSum / totalWeight).toFixed(2));
}

function shouldRequireAttorneyReview(
  outputs: WorkerOutput[],
  task: TaskRequest,
  confidenceScore: number,
  hadFailures: boolean
): boolean {
  // Always require review if any worker failed
  if (hadFailures) return true;

  // Require review if overall confidence is low
  if (confidenceScore < 0.85) return true;

  // Require review for high-stakes matters
  const description = task.description.toLowerCase();
  const highStakesKeywords = [
    'merger',
    'acquisition',
    'm&a',
    'litigation',
    'court',
    'lawsuit',
    'ipo',
    'public offering',
    'criminal',
    'regulatory investigation',
  ];

  for (const keyword of highStakesKeywords) {
    if (description.includes(keyword)) {
      return true;
    }
  }

  // Check for high-value contracts
  const valueMatch = description.match(/\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:million|m)?/i);
  if (valueMatch) {
    const value = parseFloat(valueMatch[1].replace(/,/g, ''));
    const isMillions = description.toLowerCase().includes('million');
    const actualValue = isMillions ? value * 1_000_000 : value;

    if (actualValue > 100_000) {
      return true;
    }
  }

  // High priority tasks should be reviewed
  if (task.priority === 'high') {
    return true;
  }

  return false;
}

function aggregateTokens(outputs: WorkerOutput[]): TokenUsage {
  return outputs.reduce(
    (total, output) => ({
      input: total.input + output.token_usage.input,
      output: total.output + output.token_usage.output,
      total: total.total + output.token_usage.total,
      cached: (total.cached || 0) + (output.token_usage.cached || 0),
    }),
    { input: 0, output: 0, total: 0, cached: 0 }
  );
}

function calculateTotalCost(outputs: WorkerOutput[]): number {
  const tokens = aggregateTokens(outputs);
  
  // Claude Sonnet 4.5 pricing:
  // Input: $3 per million tokens
  // Output: $15 per million tokens
  const inputCost = (tokens.input / 1_000_000) * 3;
  const outputCost = (tokens.output / 1_000_000) * 15;
  
  return Number((inputCost + outputCost).toFixed(4));
}

function calculateSynthesisCost(usage: { input_tokens: number; output_tokens: number }): number {
  const inputCost = (usage.input_tokens / 1_000_000) * 3;
  const outputCost = (usage.output_tokens / 1_000_000) * 15;
  
  return Number((inputCost + outputCost).toFixed(4));
}

function createFallbackResult(
  outputs: WorkerOutput[],
  task: TaskRequest,
  executionPlan: any,
  startTime: number
): TaskResult {
  // Combine raw outputs
  const combinedOutput = outputs
    .filter((o) => o.success)
    .map((o, index) => {
      const workerName = o.worker.replace('_', ' ').toUpperCase();
      return `## ${workerName} Output\n\n${typeof o.output === 'string' ? o.output : JSON.stringify(o.output, null, 2)}`;
    })
    .join('\n\n---\n\n');

  const finalOutput = combinedOutput || 'No outputs available.';
  const confidence = calculateConfidence(outputs.filter((o) => o.success));

  return {
    task_id: task.id,
    execution_plan: executionPlan,
    worker_outputs: outputs,
    final_output: finalOutput + '\n\n' + generateAIDisclosure(task, confidence),
    confidence_score: confidence,
    requires_attorney_review: true,
    ai_disclosure: generateAIDisclosure(task, confidence),
    total_tokens: aggregateTokens(outputs),
    total_cost: calculateTotalCost(outputs),
    duration_ms: Date.now() - startTime,
    status: 'review_required',
  };
}
