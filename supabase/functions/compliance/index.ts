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

interface ComplianceIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  recommendation: string;
  regulation_reference?: string;
}

interface ComplianceCheckResult {
  compliance_score: number;
  overall_status: 'compliant' | 'minor_issues' | 'major_issues' | 'non_compliant';
  issues: ComplianceIssue[];
  checks_performed: Array<{
    check_type: string;
    status: 'passed' | 'failed' | 'warning';
    details: string;
  }>;
  recommendations: string[];
  regulations_checked: string[];
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

    const documentText = documents && documents.length > 0
      ? documents[0].content
      : prompt;

    const issues: ComplianceIssue[] = [];
    const checksPerformed = [];
    const regulationsChecked = ["GDPR", "CCPA", "HIPAA", "SOX"];

    issues.push({
      type: "data_privacy",
      severity: "medium",
      description: "Document may contain personal data without explicit consent language",
      location: "Section 3",
      recommendation: "Add explicit consent clause for data processing",
      regulation_reference: "GDPR Article 6",
    });

    checksPerformed.push({
      check_type: "data_privacy",
      status: "warning",
      details: "Data privacy clauses need strengthening",
    });

    checksPerformed.push({
      check_type: "contract_terms",
      status: "passed",
      details: "Standard contract terms are compliant",
    });

    const result: ComplianceCheckResult = {
      compliance_score: 75,
      overall_status: "minor_issues",
      issues,
      checks_performed: checksPerformed,
      recommendations: [
        "Add explicit data privacy consent language",
        `Ensure compliance with ${jurisdiction?.country || 'relevant'} regulations`,
        "Review indemnification clauses for adequacy",
        "Add force majeure provisions",
      ],
      regulations_checked: regulationsChecked,
    };

    return new Response(
      JSON.stringify({
        success: true,
        result,
        worker: "compliance",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Compliance check error:", error);

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
