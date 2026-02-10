import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface JurisdictionInfo {
  country: "US" | "IN";
  state?: "TX" | "CA" | "NY" | null;
  confidence: "explicit" | "inferred" | "unknown";
}

interface OrchestrationRequest {
  taskId: string;
  taskType: string;
  deliverableType?: string;
  prompt: string;
  documents?: Array<{ name: string; content: string }>;
  jurisdiction?: JurisdictionInfo;
}

interface TaskStep {
  step_number: number;
  worker_name: string;
  status: string;
  input_data: any;
  output_data?: any;
  error_message?: string;
}

function detectJurisdiction(text: string): JurisdictionInfo {
  const lowerText = text.toLowerCase();

  let country: "US" | "IN" = "US";
  let state: "TX" | "CA" | "NY" | null = null;
  let confidence: "explicit" | "inferred" | "unknown" = "unknown";

  if (lowerText.includes("india") || lowerText.includes("indian")) {
    country = "IN";
    confidence = "inferred";
  } else if (lowerText.includes("texas") || lowerText.includes(" tx")) {
    country = "US";
    state = "TX";
    confidence = "explicit";
  } else if (lowerText.includes("california") || lowerText.includes(" ca")) {
    country = "US";
    state = "CA";
    confidence = "explicit";
  } else if (lowerText.includes("new york") || lowerText.includes(" ny")) {
    country = "US";
    state = "NY";
    confidence = "explicit";
  }

  return { country, state, confidence };
}

function selectWorkers(taskType: string): string[] {
  const workerMap: Record<string, string[]> = {
    "contract_review": ["contract_review"],
    "policy_drafting": ["policy_drafting"],
    "compliance_check": ["compliance"],
    "legal_research": ["research_memo"],
    "intake": ["intake_triage"],
    "risk_assessment": ["risk_assessment"],
    "vendor_intelligence": ["vendor_intelligence"],
    "briefing": ["briefing"],
  };

  return workerMap[taskType] || ["contract_review"];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Extract JWT token
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing authorization token",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create client with user's JWT token for authentication
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify the user with the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or expired authentication token. Please log in again.",
          details: authError?.message || "No user found",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestData: OrchestrationRequest = await req.json();
    const { taskId, taskType, deliverableType, prompt, documents, jurisdiction } = requestData;

    // Use service role client for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingTask, error: taskError } = await supabase
      .from("tasks")
      .select("tenant_id, created_by")
      .eq("id", taskId)
      .single();
    
    if (taskError || !existingTask) {
      console.error("Task fetch error:", taskError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Task not found or access denied",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Verify user has access to this task
    if (existingTask.created_by !== user.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "You do not have permission to execute this task",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resolvedJurisdiction = jurisdiction || detectJurisdiction(prompt);

    await supabase
      .from("tasks")
      .update({
        status: "RUNNING",
        started_at: new Date().toISOString(),
        jurisdiction_country: resolvedJurisdiction.country,
        jurisdiction_state: resolvedJurisdiction.state,
      })
      .eq("id", taskId);

    const workers = selectWorkers(taskType);
    const steps: TaskStep[] = [];

    for (let i = 0; i < workers.length; i++) {
      const workerName = workers[i];

      const step: TaskStep = {
        step_number: i + 1,
        worker_name: workerName,
        status: "RUNNING",
        input_data: {
          prompt,
          deliverableType,
          documents,
          jurisdiction: resolvedJurisdiction,
        },
      };

      const { data: stepData, error: stepError } = await supabase
        .from("task_steps")
        .insert({
          task_id: taskId,
          step_number: step.step_number,
          worker_name: step.worker_name,
          status: "RUNNING",
          started_at: new Date().toISOString(),
          input_data: step.input_data,
        })
        .select()
        .single();

      if (stepError || !stepData) {
        const errorMsg = `Failed to create task step: ${stepError?.message || 'Unknown error'}`;
        await supabase
          .from("tasks")
          .update({ status: "FAILED", error: errorMsg })
          .eq("id", taskId);

        return new Response(
          JSON.stringify({
            success: false,
            error: errorMsg,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      try {
        const workerResponse = await fetch(
          `${supabaseUrl}/functions/v1/${workerName}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify(step.input_data),
          }
        );

        if (!workerResponse.ok) {
          throw new Error(`Worker ${workerName} failed: ${await workerResponse.text()}`);
        }

        const workerResult = await workerResponse.json();

        await supabase
          .from("task_steps")
          .update({
            status: "COMPLETED",
            completed_at: new Date().toISOString(),
            output_data: workerResult,
          })
          .eq("id", stepData.id);

        step.status = "COMPLETED";
        step.output_data = workerResult;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        await supabase
          .from("task_steps")
          .update({
            status: "FAILED",
            error_message: errorMessage,
          })
          .eq("id", stepData.id);

        step.status = "FAILED";
        step.error_message = errorMessage;

        await supabase
          .from("tasks")
          .update({ status: "FAILED", error: errorMessage })
          .eq("id", taskId);

        return new Response(
          JSON.stringify({
            success: false,
            error: errorMessage,
            steps,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      steps.push(step);
    }

    const lastStepOutput = steps[steps.length - 1]?.output_data || {};

    await supabase
      .from("tasks")
      .update({
        status: "REVIEW_REQUIRED",
        output_data: lastStepOutput,
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    // Try to log audit (non-critical)
    if (existingTask) {
      try {
        await supabase.from("audit_logs").insert({
          resource_id: taskId,
          resource_type: "task",
          user_id: existingTask.created_by,
          tenant_id: existingTask.tenant_id,
          action: "orchestration_completed",
          details: {
            workers: workers,
            jurisdiction: resolvedJurisdiction,
            steps_count: steps.length,
          },
        });
      } catch (auditError) {
        console.warn("Audit log failed (non-critical):", auditError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        taskId,
        jurisdiction: resolvedJurisdiction,
        workers,
        steps,
        status: "review_required",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Orchestrator error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
