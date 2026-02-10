import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrchestratorInput {
  prompt: string;
  deliverableType?: string;
  documents?: Array<{ name: string; content: string }>;
  jurisdiction?: {
    country: string;
    state?: string | null;
    confidence: string;
  };
}

interface IntakeTriageResult {
  triage: {
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    subcategory?: string;
    estimated_complexity: 'simple' | 'moderate' | 'complex';
    recommended_workflow: string;
    assigned_practice_area: string;
  };
  initial_assessment: {
    summary: string;
    key_issues: string[];
    jurisdictions_involved: string[];
    required_expertise: string[];
    estimated_timeline: string;
  };
  next_steps: string[];
  routing_recommendation: {
    department: string;
    suggested_assignee?: string;
    urgency_notes?: string;
  };
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

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing authorization token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized", details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, tenant_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestData: OrchestratorInput = await req.json();
    const { prompt, documents, jurisdiction } = requestData;

    const jurisdictionStr = jurisdiction?.country || "US";
    const hasDocuments = documents && documents.length > 0;

    const result: IntakeTriageResult = {
      triage: {
        priority: "medium",
        category: "legal_request",
        subcategory: "general_inquiry",
        estimated_complexity: hasDocuments ? "moderate" : "simple",
        recommended_workflow: "standard_review",
        assigned_practice_area: "corporate",
      },
      initial_assessment: {
        summary: `Initial request received: "${prompt.substring(0, 100)}...". ${hasDocuments ? `${documents.length} document(s) attached.` : 'No documents attached.'}`,
        key_issues: [
          "Request requires initial review and categorization",
          "Determine applicable legal framework",
          "Assess resource requirements",
        ],
        jurisdictions_involved: [jurisdictionStr],
        required_expertise: ["General Counsel", "Legal Operations"],
        estimated_timeline: "3-5 business days",
      },
      next_steps: [
        "Assign to appropriate practice area",
        "Conduct detailed legal analysis",
        "Schedule stakeholder consultation if needed",
        "Prepare response or deliverable",
      ],
      routing_recommendation: {
        department: "Legal Operations",
        urgency_notes: "Standard processing time applies",
      },
    };

    return new Response(
      JSON.stringify({
        success: true,
        result,
        worker: "intake_triage",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Intake triage error:", error);

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
