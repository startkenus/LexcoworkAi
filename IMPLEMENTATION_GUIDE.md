## LexCoworkAI Enhancement Implementation Guide

### Quick Start: Integrating the New Orchestration System

## Step 1: Update the Orchestrator Supabase Function

Replace your existing `supabase/functions/orchestrator/index.ts` with the enhanced version:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import Anthropic from "npm:@anthropic-ai/sdk@0.73.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Import the new orchestration logic
// Note: This is a simplified version for Deno environment
// The full lib/orchestrator code runs in Next.js environment

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData = await req.json();
    const { taskId, taskType, deliverableType, prompt, documents, jurisdiction } = requestData;

    // Step 1: Compliance Check (simplified for Deno)
    const complianceCheck = checkCompliance(prompt);
    if (!complianceCheck.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: complianceCheck.blocked_reason }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Create Execution Plan
    const executionPlan = await createExecutionPlan(taskType, prompt, jurisdiction);

    // Step 3: Update task status
    await supabase
      .from("tasks")
      .update({ status: "RUNNING", started_at: new Date().toISOString() })
      .eq("id", taskId);

    // Step 4: Execute workers
    const workerOutputs = [];
    for (const step of executionPlan.steps) {
      const workerResult = await executeWorker(
        supabase,
        step.worker,
        { prompt, deliverableType, documents, jurisdiction },
        workerOutputs
      );
      workerOutputs.push(workerResult);
    }

    // Step 5: Synthesize results
    const finalResult = await synthesizeResults(workerOutputs, prompt);

    // Step 6: Update task with result
    await supabase
      .from("tasks")
      .update({
        status: finalResult.requires_review ? "REVIEW_REQUIRED" : "COMPLETED",
        output_data: finalResult,
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    // Step 7: Record token usage
    await supabase.from("token_usage_logs").insert({
      task_id: taskId,
      organization_id: requestData.organizationId,
      user_id: requestData.userId,
      total_tokens: finalResult.total_tokens,
      cost: finalResult.total_cost,
      worker: "orchestrator",
    });

    return new Response(
      JSON.stringify({
        success: true,
        result: finalResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Orchestrator error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper functions (simplified versions)
function checkCompliance(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  const prohibited = ["tax evasion", "hide assets", "fraudulent", "should i sue"];
  
  for (const pattern of prohibited) {
    if (lowerPrompt.includes(pattern)) {
      return {
        allowed: false,
        blocked_reason: `Request blocked: contains prohibited pattern "${pattern}"`,
      };
    }
  }
  
  return { allowed: true };
}

async function createExecutionPlan(taskType: string, prompt: string, jurisdiction: any) {
  // For now, simple 1:1 mapping
  // In production, use Claude to analyze and create multi-worker plans
  return {
    steps: [{ worker: taskType, purpose: `Execute ${taskType}`, estimated_tokens: 4000 }],
  };
}

async function executeWorker(supabase: any, workerName: string, input: any, previousOutputs: any[]) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/${workerName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabase.supabaseKey}`,
        },
        body: JSON.stringify({ ...input, previousOutputs }),
      }
    );

    const result = await response.json();

    return {
      worker: workerName,
      output: result.result,
      confidence: result.result?.confidence || 0.85,
      duration_ms: Date.now() - startTime,
      success: true,
    };
  } catch (error) {
    return {
      worker: workerName,
      output: null,
      confidence: 0,
      duration_ms: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function synthesizeResults(outputs: any[], prompt: string) {
  const successfulOutputs = outputs.filter((o) => o.success);
  
  if (successfulOutputs.length === 0) {
    return {
      final_output: "All workers failed",
      confidence_score: 0,
      requires_review: true,
      total_tokens: 0,
      total_cost: 0,
    };
  }

  const combined = successfulOutputs
    .map((o) => typeof o.output === "string" ? o.output : JSON.stringify(o.output))
    .join("\n\n");

  const avgConfidence =
    successfulOutputs.reduce((sum, o) => sum + o.confidence, 0) / successfulOutputs.length;

  const aiDisclosure = generateAIDisclosure(avgConfidence);

  return {
    final_output: combined + "\n\n" + aiDisclosure,
    confidence_score: avgConfidence,
    requires_review: avgConfidence < 0.85,
    total_tokens: 5000, // Estimate
    total_cost: 0.05, // Estimate
  };
}

function generateAIDisclosure(confidence: number) {
  return `
---

⚠️ **AI-Generated Content Disclosure**

This output was generated with assistance from Claude AI (Anthropic PBC).

**Important Disclaimers:**
1. Not Legal Advice: This is informational only
2. No Attorney-Client Relationship: Consult licensed counsel
3. Verification Required: May contain errors
4. Human Review Required: Must be reviewed by licensed attorney

**Confidence Score**: ${(confidence * 100).toFixed(0)}%

For legal advice, consult a licensed attorney.`;
}
```

## Step 2: Add Token Usage Tracking Table

Create a migration in Supabase:

```sql
-- Create token_usage_logs table
CREATE TABLE IF NOT EXISTS token_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES tasks(id),
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL,
  cost DECIMAL(10, 4) NOT NULL DEFAULT 0,
  worker TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_token_usage_org ON token_usage_logs(organization_id);
CREATE INDEX idx_token_usage_user ON token_usage_logs(user_id);
CREATE INDEX idx_token_usage_task ON token_usage_logs(task_id);
CREATE INDEX idx_token_usage_created ON token_usage_logs(created_at);

-- Add RLS policies
ALTER TABLE token_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's token usage"
  ON token_usage_logs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
    )
  );
```

## Step 3: Update Task Creator to Check Limits

Update `lib/services/task-executor.ts`:

```typescript
import { checkUsageLimits } from '@/lib/monitoring/token-tracker';

export async function createTask(params: CreateTaskParams) {
  // Check token limits before creating task
  const limitCheck = await checkUsageLimits(
    params.tenantId,
    params.userId,
    5000 // Estimated tokens
  );

  if (!limitCheck.allowed) {
    return {
      status: 'failed' as const,
      error: limitCheck.reason,
    };
  }

  // Continue with existing task creation logic...
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title: params.title,
      description: params.description,
      task_type: params.taskType,
      deliverable_type: params.deliverableType,
      // ... rest of fields
    })
    .select()
    .single();

  if (error || !task) {
    return {
      status: 'failed' as const,
      error: error?.message || 'Failed to create task',
    };
  }

  // Call orchestrator function
  const { data, error: orchError } = await supabase.functions.invoke('orchestrator', {
    body: {
      taskId: task.id,
      taskType: params.taskType,
      deliverableType: params.deliverableType,
      prompt: params.description,
      documents: params.documents,
      jurisdiction: params.jurisdiction,
      organizationId: params.tenantId,
      userId: params.userId,
    },
  });

  if (orchError) {
    return {
      status: 'failed' as const,
      error: orchError.message,
    };
  }

  return {
    status: 'success' as const,
    taskId: task.id,
  };
}
```

## Step 4: Create Usage Dashboard Component

Create `components/admin/token-usage-dashboard.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUsageStats, predictMonthlyUsage } from '@/lib/monitoring/token-tracker';
import { useAuth } from '@/lib/auth/auth-context';

export function TokenUsageDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    if (!profile?.tenant_id) return;

    async function loadStats() {
      const [statsData, predictionData] = await Promise.all([
        getUsageStats(profile.tenant_id, 'month'),
        predictMonthlyUsage(profile.tenant_id),
      ]);

      setStats(statsData);
      setPrediction(predictionData);
    }

    loadStats();
  }, [profile]);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Tokens (Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_tokens.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Cost (Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.total_cost.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_tasks}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Predicted Monthly Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${prediction?.predicted_cost.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Based on {prediction?.days_remaining} days remaining
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Step 5: Testing the Enhancements

### Test 1: Simple Task

```bash
curl -X POST https://your-project.supabase.co/functions/v1/orchestrator \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "test-123",
    "taskType": "contract_review",
    "prompt": "Review this standard NDA",
    "jurisdiction": {"country": "US", "state": "CA"}
  }'
```

### Test 2: Check Token Usage

```typescript
import { getUsageStats } from '@/lib/monitoring/token-tracker';

const stats = await getUsageStats('org-123', 'day');
console.log(stats);
```

### Test 3: Compliance Check

```typescript
import { checkAnthropicCompliance } from '@/lib/anthropic/compliance';

const task = {
  description: 'Help me evade taxes',
  // ... other fields
};

const check = checkAnthropicCompliance(task as any);
console.log(check.allowed); // false
console.log(check.blocked_reason);
```

## Step 6: Deployment Checklist

- [ ] Environment variables configured (ANTHROPIC_API_KEY)
- [ ] Token usage table created in Supabase
- [ ] Orchestrator function updated
- [ ] Task executor updated with limit checks
- [ ] Usage dashboard added to admin panel
- [ ] Tested with sample tasks
- [ ] Monitored token usage and costs
- [ ] Verified AI disclosures on outputs
- [ ] Confirmed attorney review flagging works

## Next Steps

1. **Seed Knowledge Base**: Add templates, clauses, and precedents
2. **Implement Base Worker Class**: Refactor workers to use common base
3. **Add Real-time Progress**: WebSocket or SSE for live updates
4. **Create Analytics Dashboard**: Visualize usage trends
5. **Write Tests**: Comprehensive test coverage
6. **Performance Optimization**: Caching, parallel execution

## Support

For questions or issues:
1. Check [ENHANCEMENTS_README.md](./ENHANCEMENTS_README.md) for detailed documentation
2. Review [Cursor_AI_Implementation_Guide.md](./Doc/Prd/Cursor_AI_Implementation_Guide.md)
3. Contact the development team

## License

All enhancements follow the same license as the main LexCoworkAI application.
