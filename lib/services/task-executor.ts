import { detectJurisdiction, JurisdictionInfo } from '../jurisdiction/validator';
import { policyGate, outputGate, addMandatoryFooter } from '../guardrails/gates';
import { retrieveRelevantChunks } from '../rag/retrieval';
import { supabase } from '../supabase/client';

export interface TaskExecutionRequest {
  title: string;
  description: string;
  taskType: 'contract_review' | 'policy_drafting' | 'compliance_check' | 'legal_research' | 'intake' | 'risk_assessment' | 'vendor_intelligence' | 'briefing';
  deliverableType?: string;
  documents?: Array<{ name: string; content: string }>;
  jurisdiction?: JurisdictionInfo;
  tenantId: string;
  userId: string;
}

export interface TaskExecutionResult {
  taskId: string;
  status: 'queued' | 'running' | 'review_required' | 'failed';
  message: string;
  error?: string;
}

export async function createTask(request: TaskExecutionRequest): Promise<TaskExecutionResult> {
  try {
    // Check authentication first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      return {
        taskId: '',
        status: 'failed',
        message: 'Authentication required',
        error: 'Please log in to create tasks. Your session may have expired.',
      };
    }

    const policyCheck = policyGate(request.description);
    if (!policyCheck.allowed) {
      return {
        taskId: '',
        status: 'failed',
        message: 'Task blocked by policy gate',
        error: policyCheck.reason,
      };
    }

    const jurisdiction = request.jurisdiction || detectJurisdiction(request.description);

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: request.title,
        description: request.description,
        task_type: request.taskType,
        deliverable_type: request.deliverableType,
        status: 'QUEUED',
        jurisdiction_country: jurisdiction.country,
        jurisdiction_state: jurisdiction.state,
        input_data: {
          documents: request.documents,
          prompt: request.description,
        },
        tenant_id: request.tenantId,
        created_by: request.userId,
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Try to log audit (non-blocking)
    try {
      await supabase.from('audit_logs').insert({
        resource_id: task.id,
        user_id: request.userId,
        action: 'task_created',
        resource_type: 'task',
        details: {
          task_type: request.taskType,
          deliverable_type: request.deliverableType,
          jurisdiction,
        },
        tenant_id: request.tenantId,
      });
    } catch (auditError) {
      console.warn('Audit log failed (non-critical):', auditError);
    }

    // Execute task with session token
    try {
      await executeTask(task.id, session.access_token);
    } catch (execError) {
      console.error('Auto-execution failed, task remains queued:', execError);
    }

    return {
      taskId: task.id,
      status: 'queued',
      message: 'Task created and automatically started for processing',
    };
  } catch (error) {
    console.error('Task creation error:', error);
    return {
      taskId: '',
      status: 'failed',
      message: 'Failed to create task',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function executeTask(taskId: string, accessToken?: string): Promise<TaskExecutionResult> {
  try {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    await supabase
      .from('tasks')
      .update({ status: 'QUEUED' })
      .eq('id', taskId);

    // Use provided token or get from session
    let token = accessToken;
    if (!token) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('No valid user session found. Please log in again.');
      }
      token = session.access_token;
    }

    const orchestratorUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/orchestrator`;

    console.log('Calling orchestrator with token:', token ? 'Token present' : 'No token');

    const response = await fetch(orchestratorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({
        taskId: task.id,
        taskType: task.task_type,
        deliverableType: task.deliverable_type,
        prompt: task.description,
        documents: task.input_data?.documents,
        jurisdiction: {
          country: task.jurisdiction_country,
          state: task.jurisdiction_state,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Orchestrator error response:', errorText);
      throw new Error(`Orchestrator failed: ${errorText}`);
    }

    const result = await response.json();

    return {
      taskId: task.id,
      status: result.status,
      message: 'Task execution started',
    };
  } catch (error) {
    console.error('Task execution error:', error);

    await supabase
      .from('tasks')
      .update({
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      })
      .eq('id', taskId);

    return {
      taskId,
      status: 'failed',
      message: 'Task execution failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function approveTask(
  taskId: string,
  userId: string,
  tenantId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await supabase
      .from('tasks')
      .update({
        status: 'COMPLETED',
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    await supabase.from('audit_logs').insert({
      resource_id: taskId,
      user_id: userId,
      action: 'task_approved',
      resource_type: 'task',
      details: { approved_at: new Date().toISOString() },
      tenant_id: tenantId,
    });

    return {
      success: true,
      message: 'Task approved successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function rejectTask(
  taskId: string,
  userId: string,
  reason: string,
  tenantId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await supabase
      .from('tasks')
      .update({
        status: 'DRAFT',
      })
      .eq('id', taskId);

    await supabase.from('audit_logs').insert({
      resource_id: taskId,
      user_id: userId,
      action: 'task_rejected',
      resource_type: 'task',
      details: {
        reason,
        rejected_at: new Date().toISOString(),
      },
      tenant_id: tenantId,
    });

    return {
      success: true,
      message: 'Task rejected and returned to draft',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getTaskStatus(taskId: string): Promise<any> {
  const { data: task } = await supabase
    .from('tasks')
    .select('*, task_steps(*)')
    .eq('id', taskId)
    .single();

  return task;
}
