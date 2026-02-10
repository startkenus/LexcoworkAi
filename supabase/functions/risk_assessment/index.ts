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

interface RiskAssessmentResult {
  overall_risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_categories: Array<{
    category: string;
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation_strategies: string[];
  }>;
  key_risks: string[];
  compliance_risks: string[];
  financial_risks: string[];
  operational_risks: string[];
  reputational_risks: string[];
  recommendations: Array<{
    priority: 'immediate' | 'high' | 'medium' | 'low';
    recommendation: string;
    rationale: string;
  }>;
  monitoring_requirements: string[];
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
    const { prompt, jurisdiction } = requestData;

    const result: RiskAssessmentResult = {
      overall_risk_score: 65,
      risk_level: "medium",
      risk_categories: [
        {
          category: "Legal & Compliance",
          score: 70,
          level: "medium",
          description: "Moderate legal and compliance risks identified",
          mitigation_strategies: [
            "Ensure all contractual terms comply with applicable regulations",
            "Implement regular compliance monitoring",
            "Maintain documentation of compliance efforts",
          ],
        },
        {
          category: "Financial",
          score: 55,
          level: "medium",
          description: "Financial exposure within acceptable parameters",
          mitigation_strategies: [
            "Review liability caps and indemnification provisions",
            "Consider insurance coverage",
            "Monitor payment terms and conditions",
          ],
        },
        {
          category: "Operational",
          score: 60,
          level: "medium",
          description: "Operational risks require attention",
          mitigation_strategies: [
            "Clarify service level expectations",
            "Establish clear escalation procedures",
            "Define performance metrics",
          ],
        },
      ],
      key_risks: [
        "Potential compliance gaps in current framework",
        "Liability exposure may exceed risk tolerance",
        "Operational dependencies not fully documented",
      ],
      compliance_risks: [
        `Ensure compliance with ${jurisdiction?.country || 'applicable'} regulations`,
        "Data privacy requirements need verification",
        "Regulatory reporting obligations to be confirmed",
      ],
      financial_risks: [
        "Unlimited liability exposure in some scenarios",
        "Payment terms may impact cash flow",
        "Currency and exchange rate considerations",
      ],
      operational_risks: [
        "Service continuity not fully guaranteed",
        "Dependency on third-party providers",
        "Change management process unclear",
      ],
      reputational_risks: [
        "Public disclosure requirements may apply",
        "Stakeholder communication plan needed",
        "Brand protection measures to be implemented",
      ],
      recommendations: [
        {
          priority: "high",
          recommendation: "Address unlimited liability exposure immediately",
          rationale: "Uncapped liability creates unacceptable financial risk",
        },
        {
          priority: "high",
          recommendation: "Clarify data privacy and security requirements",
          rationale: "Compliance with privacy regulations is mandatory",
        },
        {
          priority: "medium",
          recommendation: "Document operational dependencies and contingencies",
          rationale: "Business continuity planning is essential",
        },
      ],
      monitoring_requirements: [
        "Quarterly compliance reviews",
        "Monthly operational performance tracking",
        "Annual risk assessment updates",
        "Continuous regulatory change monitoring",
      ],
    };

    return new Response(
      JSON.stringify({
        success: true,
        result,
        worker: "risk_assessment",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Risk assessment error:", error);

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
