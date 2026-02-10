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

interface PolicyDraftResult {
  draft: {
    title: string;
    sections: Array<{
      heading: string;
      content: string;
    }>;
    metadata: {
      jurisdiction: string;
      policy_type: string;
      version: string;
      date_drafted: string;
    };
  };
  template_used?: any;
  suggestions: string[];
  compliance_notes: string[];
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
    const { prompt, deliverableType, documents, jurisdiction } = requestData;

    const policyType = deliverableType || "Corporate Policy";
    const jurisdictionStr = jurisdiction
      ? `${jurisdiction.country}${jurisdiction.state ? ` - ${jurisdiction.state}` : ''}`
      : "Multi-jurisdictional";

    const sections = [];

    sections.push({
      heading: "1. Purpose and Scope",
      content: `This ${policyType} establishes the framework and guidelines for organizational operations as requested: "${prompt.substring(0, 100)}...". It applies to all employees, contractors, and third parties with access to company resources.`,
    });

    sections.push({
      heading: "2. Definitions",
      content: `Key terms used throughout this policy are defined as follows:\n\n- Organization: Refers to the legal entity and all its subsidiaries and affiliates.\n- Policy Owner: The designated individual responsible for maintaining and enforcing this policy.\n- Compliance Officer: The individual responsible for monitoring adherence to this policy.`,
    });

    sections.push({
      heading: "3. Policy Statement",
      content: `The organization is committed to maintaining the highest standards of ${policyType.toLowerCase()} practices. This policy outlines the requirements, procedures, and responsibilities necessary to achieve compliance with applicable laws and regulations in ${jurisdictionStr}.`,
    });

    sections.push({
      heading: "4. Requirements",
      content: `Based on the request: "${prompt}"\n\nKey requirements include:\n1. Compliance with all applicable federal, state, and local laws\n2. Regular review and updates to ensure continued relevance\n3. Training and awareness programs for all affected personnel\n4. Documentation and record-keeping requirements\n5. Incident reporting and response procedures`,
    });

    sections.push({
      heading: "5. Roles and Responsibilities",
      content: `- Executive Management: Oversee policy implementation and provide necessary resources\n- Department Heads: Ensure compliance within their respective areas\n- All Staff: Adhere to policy requirements and report violations\n- Compliance Team: Monitor adherence and conduct regular audits`,
    });

    sections.push({
      heading: "6. Compliance and Enforcement",
      content: `Violations of this policy may result in disciplinary action up to and including termination of employment or contract. The organization reserves the right to report violations to appropriate regulatory authorities where required by law.`,
    });

    sections.push({
      heading: "7. Review and Updates",
      content: `This policy will be reviewed annually or as needed to ensure continued relevance and compliance with applicable laws. The Policy Owner is responsible for initiating reviews and proposing updates.`,
    });

    const result: PolicyDraftResult = {
      draft: {
        title: `${policyType}`,
        sections,
        metadata: {
          jurisdiction: jurisdictionStr,
          policy_type: policyType,
          version: "1.0",
          date_drafted: new Date().toISOString().split('T')[0],
        },
      },
      template_used: null,
      suggestions: [
        "Consider adding jurisdiction-specific requirements",
        "Review with legal counsel before finalization",
        "Ensure alignment with existing organizational policies",
        "Schedule training sessions for staff after approval",
      ],
      compliance_notes: [
        `Ensure compliance with ${jurisdictionStr} regulations`,
        "Document any deviations from industry standards",
        "Maintain audit trail of policy changes",
      ],
    };

    return new Response(
      JSON.stringify({
        success: true,
        result,
        worker: "policy_drafting",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Policy drafting error:", error);

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
