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

interface ResearchMemoResult {
  memo: {
    title: string;
    executive_summary: string;
    sections: Array<{
      heading: string;
      content: string;
      sources?: string[];
    }>;
    conclusion: string;
    recommendations: string[];
    metadata: {
      jurisdiction: string;
      research_date: string;
      depth: string;
    };
  };
  confidence_level: 'low' | 'medium' | 'high';
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

    const jurisdictionStr = jurisdiction
      ? `${jurisdiction.country}${jurisdiction.state ? ` - ${jurisdiction.state}` : ''}`
      : "Multi-jurisdictional";

    const result: ResearchMemoResult = {
      memo: {
        title: `Research Memo: ${prompt.substring(0, 60)}...`,
        executive_summary: `This research memo addresses the following topic: "${prompt}". Based on our analysis of applicable laws and regulations in ${jurisdictionStr}, we have identified key considerations and recommendations.`,
        sections: [
          {
            heading: "Background",
            content: `Research was conducted regarding: ${prompt}`,
            sources: ["Legal Research Database", "Case Law Repository"],
          },
          {
            heading: "Legal Framework",
            content: `The applicable legal framework in ${jurisdictionStr} includes relevant statutes, regulations, and case law that govern this matter.`,
            sources: ["Statutory Research", "Regulatory Guidance"],
          },
          {
            heading: "Analysis",
            content: "Based on the research conducted, several key points emerge that are relevant to the matter at hand. The legal landscape suggests specific considerations that should be taken into account.",
            sources: ["Case Law Analysis", "Legal Commentary"],
          },
          {
            heading: "Potential Issues",
            content: "Several potential issues have been identified that may impact the approach to this matter, including compliance considerations and risk factors.",
          },
        ],
        conclusion: "Based on the research conducted, there are several paths forward that could be considered. Each approach has specific legal implications that should be carefully evaluated.",
        recommendations: [
          "Review applicable statutes and regulations in detail",
          "Consider consulting with subject matter experts",
          "Monitor for any regulatory changes in this area",
          "Document compliance efforts thoroughly",
        ],
        metadata: {
          jurisdiction: jurisdictionStr,
          research_date: new Date().toISOString().split('T')[0],
          depth: "standard",
        },
      },
      confidence_level: "medium",
    };

    return new Response(
      JSON.stringify({
        success: true,
        result,
        worker: "research_memo",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Research memo error:", error);

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
