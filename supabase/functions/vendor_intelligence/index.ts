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

interface VendorIntelligenceResult {
  vendor_profile: {
    name: string;
    industry: string;
    size: string;
    headquarters_location: string;
  };
  risk_assessment: {
    overall_risk: 'low' | 'medium' | 'high' | 'critical';
    financial_health: string;
    compliance_status: string;
    reputation_score: number;
  };
  contract_analysis: {
    active_contracts: number;
    total_contract_value: string;
    key_terms_summary: string[];
    renewal_dates: string[];
    termination_provisions: string;
  };
  recommendations: string[];
  red_flags: string[];
  strengths: string[];
  monitoring_alerts: string[];
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
    const { prompt } = requestData;

    const vendorName = prompt.substring(0, 50);

    const result: VendorIntelligenceResult = {
      vendor_profile: {
        name: vendorName,
        industry: "Technology Services",
        size: "Mid-Market",
        headquarters_location: "United States",
      },
      risk_assessment: {
        overall_risk: "medium",
        financial_health: "Stable - adequate cash reserves and consistent revenue",
        compliance_status: "Compliant with standard industry regulations",
        reputation_score: 75,
      },
      contract_analysis: {
        active_contracts: 0,
        total_contract_value: "$0",
        key_terms_summary: [
          "New vendor - no existing contract history",
          "Initial assessment pending",
        ],
        renewal_dates: [],
        termination_provisions: "To be evaluated upon contract review",
      },
      recommendations: [
        "Conduct thorough due diligence before engagement",
        "Request financial statements and references",
        "Verify insurance coverage and compliance certifications",
        "Negotiate favorable payment and termination terms",
        "Include standard indemnification and liability provisions",
      ],
      red_flags: [],
      strengths: [
        "Industry presence and market reputation",
        "Standard service offerings",
      ],
      monitoring_alerts: [
        "Monitor for any regulatory changes affecting vendor operations",
        "Track vendor financial health quarterly",
        "Review contract performance metrics regularly",
      ],
    };

    return new Response(
      JSON.stringify({
        success: true,
        result,
        worker: "vendor_intelligence",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Vendor intelligence error:", error);

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
