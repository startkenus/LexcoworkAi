/**
 * Execution Planner - Analyzes tasks and creates execution plans
 * Based on Cursor AI Implementation Guide Phase 5
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  TaskRequest,
  ExecutionPlan,
  ExecutionStep,
  WorkerType,
} from '@/types/orchestration';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
});

const ORCHESTRATOR_SYSTEM_PROMPT = `You are an AI orchestration planner for LexCoworkAI, a legal productivity platform.

**Your Role**: Analyze legal task requests and create execution plans by routing to appropriate specialized workers.

**Available Workers**:
1. **contract_review** - Analyzes contracts, identifies risks, extracts key terms, suggests redlines
2. **compliance_check** - Verifies regulatory compliance (GDPR, CCPA, SOC2, etc.)
3. **legal_research** - Researches case law, statutes, and legal precedents
4. **policy_drafting** - Drafts legal policies and documents
5. **intake_triage** - Categorizes and triages incoming legal requests
6. **risk_assessment** - Evaluates legal risks and provides scoring
7. **vendor_intelligence** - Analyzes vendor relationships and agreements
8. **briefing** - Prepares meeting briefs and summaries

**Decision Rules**:
- "Review contract" → contract_review
- "Check compliance" → compliance_check
- "Research legal precedent" → legal_research
- "Draft policy" → policy_drafting
- "Assess risk" → risk_assessment
- "Analyze vendor" → vendor_intelligence
- "Prepare briefing" → briefing

For complex requests, you may chain workers:
- "Review contract for GDPR compliance" → contract_review + compliance_check
- "Draft policy based on research" → legal_research + policy_drafting

**Critical Rules**:
1. NEVER provide legal advice - only route to workers
2. Keep execution plans simple (1-3 workers max)
3. Estimate tokens conservatively (3000-5000 per worker)
4. Flag high-risk tasks (>$100K contracts, court filings)

**Output Format** (JSON only):
{
  "steps": [
    {
      "worker": "contract_review",
      "purpose": "Analyze contract terms and identify risks",
      "estimated_tokens": 4000,
      "deliverable_type": "full_analysis"
    }
  ],
  "reasoning": "Brief explanation of plan",
  "estimated_cost": 0.05,
  "high_risk": false
}`;

interface PlannerResponse {
  steps: Array<{
    worker: WorkerType;
    purpose: string;
    estimated_tokens: number;
    deliverable_type?: string;
  }>;
  reasoning?: string;
  estimated_cost?: number;
  high_risk?: boolean;
}

export async function planExecution(task: TaskRequest): Promise<ExecutionPlan> {
  try {
    const prompt = `Analyze this legal task and create an execution plan:

**Task Type**: ${task.task_type}
**Description**: ${task.description}
**Jurisdiction**: ${task.jurisdiction.country}${task.jurisdiction.state ? `, ${task.jurisdiction.state}` : ''}
${task.deliverable_type ? `**Deliverable Type**: ${task.deliverable_type}` : ''}
${task.doc_type ? `**Document Type**: ${task.doc_type}` : ''}
${task.document_text ? `**Has Document**: Yes (${task.document_text.length} characters)` : ''}

Create an execution plan. Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0.3,
      system: ORCHESTRATOR_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const plannerResponse: PlannerResponse = JSON.parse(jsonText);

    // Validate and create execution plan
    const steps: ExecutionStep[] = plannerResponse.steps.map((step, index) => ({
      worker: step.worker,
      purpose: step.purpose,
      estimated_tokens: step.estimated_tokens || 4000,
      deliverable_type: step.deliverable_type || task.deliverable_type,
      depends_on: index > 0 ? [index - 1] : undefined, // Sequential execution
    }));

    // Calculate estimates
    const totalTokens = steps.reduce((sum, step) => sum + step.estimated_tokens, 0);
    const estimatedCost = calculateCost(totalTokens);
    const estimatedDuration = steps.length * 30; // 30 seconds per worker estimate

    return {
      task_id: task.id,
      steps,
      estimated_duration_seconds: estimatedDuration,
      estimated_cost: estimatedCost,
      reasoning: plannerResponse.reasoning,
    };
  } catch (error) {
    console.error('Execution planning error:', error);
    
    // Fallback: Create simple plan based on task type
    return createFallbackPlan(task);
  }
}

function createFallbackPlan(task: TaskRequest): ExecutionPlan {
  const step: ExecutionStep = {
    worker: task.task_type,
    purpose: `Process ${task.task_type} request`,
    estimated_tokens: 4000,
    deliverable_type: task.deliverable_type,
  };

  return {
    task_id: task.id,
    steps: [step],
    estimated_duration_seconds: 30,
    estimated_cost: calculateCost(4000),
    reasoning: 'Fallback plan: Single worker execution',
  };
}

/**
 * Calculate cost based on Claude Sonnet 4.5 pricing
 * Input: $3 per million tokens
 * Output: $15 per million tokens
 * Assuming 50/50 split for estimate
 */
function calculateCost(tokens: number): number {
  const inputTokens = tokens * 0.6; // Assume 60% input
  const outputTokens = tokens * 0.4; // Assume 40% output
  
  const inputCost = (inputTokens / 1_000_000) * 3;
  const outputCost = (outputTokens / 1_000_000) * 15;
  
  return Number((inputCost + outputCost).toFixed(4));
}

/**
 * Validate execution plan
 */
export function validateExecutionPlan(plan: ExecutionPlan): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!plan.steps || plan.steps.length === 0) {
    errors.push('Execution plan must have at least one step');
  }

  if (plan.steps.length > 5) {
    errors.push('Execution plan cannot have more than 5 steps');
  }

  plan.steps.forEach((step, index) => {
    if (!step.worker) {
      errors.push(`Step ${index + 1} missing worker type`);
    }
    if (!step.purpose) {
      errors.push(`Step ${index + 1} missing purpose`);
    }
    if (step.estimated_tokens < 1000 || step.estimated_tokens > 20000) {
      errors.push(`Step ${index + 1} has invalid token estimate`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
