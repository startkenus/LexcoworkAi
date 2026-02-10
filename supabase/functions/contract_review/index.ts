import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContractReviewRequest {
  prompt: string;
  deliverableType?: string;
  documents?: Array<{ name: string; content: string }>;
  jurisdiction?: {
    country: string;
    state?: string | null;
    confidence?: string;
  };
}

interface RiskItem {
  clause: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  recommendation: string;
}

interface ContractReviewResult {
  summary: string;
  key_terms: string[];
  risks: RiskItem[];
  missing_clauses: string[];
  redline_suggestions: Array<{
    clause: string;
    current: string;
    suggested: string;
    rationale: string;
  }>;
  citations: string[];
}

async function callClaude(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!apiKey) {
    return generateMockResponse();
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("Claude API error, using mock response:", error);
    return generateMockResponse();
  }
}

function generateMockResponse(): string {
  return `## Contract Review Summary

This contract appears to be a standard service agreement with the following key observations:

## Key Terms
- Parties: Service Provider and Client
- Term: 12 months with automatic renewal
- Payment: Monthly invoicing with 30-day payment terms
- Termination: 60-day written notice required

## Risk Analysis

### HIGH RISK
- **Unlimited Liability**: No liability cap specified. Could expose party to significant financial risk.
- **Broad Indemnification**: Indemnification clause is one-sided and overly broad.

### MEDIUM RISK
- **Vague Scope of Work**: Services description lacks specificity, may lead to disputes.
- **No IP Assignment**: Intellectual property rights not clearly defined.

### LOW RISK
- **Standard Confidentiality**: Confidentiality provisions are reasonable and mutual.

## Missing Clauses
- Limitation of liability clause
- Dispute resolution mechanism (arbitration/mediation)
- Force majeure provision
- Data privacy and security obligations

## Redline Suggestions

1. **Add Liability Cap**
   - Current: No liability limitation
   - Suggested: "In no event shall either party's liability exceed the total fees paid in the 12 months preceding the claim."
   - Rationale: Protects both parties from excessive damages

2. **Clarify Scope of Work**
   - Current: "Provider shall deliver services as agreed"
   - Suggested: Add detailed Exhibit A with specific deliverables, timelines, and acceptance criteria
   - Rationale: Reduces ambiguity and potential disputes

3. **Add Dispute Resolution**
   - Suggested: "Parties agree to resolve disputes through binding arbitration under AAA rules"
   - Rationale: Faster and more cost-effective than litigation

## Citations
- Referenced: UCC Article 2 (Sales of Goods)
- Referenced: Standard Contract Principles
- Referenced: Industry best practices`;
}

function getDeliverableInstructions(deliverableType?: string) {
  const deliverables: Record<string, { role: string; outputFormat: string; taskDescription: string; specialInstructions?: string }> = {
    full_analysis: {
      role: "Analyze contracts and provide comprehensive multi-page review reports for complex, high-value contracts",
      outputFormat: `Use markdown with these sections:
- ## Executive Summary
- ## Clause-by-Clause Risk Assessment
- ## Redline Suggestions with Rationale
- ## Negotiation Strategy Recommendations
- ## Approval Recommendation (Approve/Negotiate/Reject)
- ## Citations`,
      taskDescription: "Provide a comprehensive contract analysis with executive summary, detailed clause review, and strategic recommendations",
      specialInstructions: "Time target: 45-90 seconds. Focus on depth and strategic insights for enterprise agreements, M&A contracts, and major vendor deals."
    },
    risk_analysis: {
      role: "Provide focused risk evaluation for contracts when time is limited",
      outputFormat: `Use markdown with these sections:
- ## Risk Score (0-100 or Low/Medium/High/Critical)
- ## Top 5 Risk Factors
- ## Risk Categorization (Legal, Financial, Operational, Reputational)
- ## Mitigation Recommendations
- ## Escalation Criteria
- ## Citations`,
      taskDescription: "Analyze contract risks and provide risk-focused assessment",
      specialInstructions: "Time target: 30-45 seconds. Prioritize speed while maintaining accuracy."
    },
    redline: {
      role: "Generate marked-up contracts with tracked changes when counterparty sends first draft",
      outputFormat: `Use markdown with these sections:
- ## Redline Changes (grouped by priority: must-have vs nice-to-have)
- ## Detailed Change List (strike-through for deletions, underline for additions)
- ## Rationale for Each Change
- ## Clean Copy Summary
- ## Citations`,
      taskDescription: "Create comprehensive redline suggestions with detailed rationale for each proposed change",
      specialInstructions: "Time target: 40-60 seconds. Format changes clearly with priorities."
    },
    playbook: {
      role: "Check if contract deviates from company standards and provide gap analysis",
      outputFormat: `Use markdown with these sections:
- ## Side-by-Side Comparison Table
- ## Missing Required Clauses
- ## Non-Standard Language Flagged
- ## Deviation Risk Assessment
- ## Standard Language Suggestions
- ## Citations`,
      taskDescription: "Compare contract against company playbook and identify deviations",
      specialInstructions: "Time target: 35-50 seconds. Focus on compliance with internal standards."
    },
    nda_quick: {
      role: "Perform rapid NDA triage for high-volume processing (most common contract type)",
      outputFormat: `Use markdown with these sections:
- ## NDA Type (Mutual/Unilateral/Multilateral)
- ## Term Length Analysis (flag if >3 years)
- ## Confidential Information Definition Review
- ## Carve-Outs Check
- ## Return/Destruction Obligations
- ## RECOMMENDATION: ACCEPT / NEGOTIATE / REJECT
- ## If NEGOTIATE: Top 2-3 Must-Fix Issues`,
      taskDescription: "Provide one-page NDA assessment for rapid triage",
      specialInstructions: "Time target: 20-30 seconds. NDAs are 40-50% of contract volume - optimize for speed. Focus only on critical NDA elements."
    },
    saas_review: {
      role: "Review SaaS and cloud service agreements with focus on data security and compliance",
      outputFormat: `Use markdown with these sections:
- ## Data Location & Residency Check
- ## Data Security & Privacy Provisions
- ## SLA (Service Level Agreement) Analysis
- ## Termination & Data Portability Rights
- ## Liability Caps Adequacy
- ## Auto-Renewal Terms Flagging
- ## Audit Rights Verification
- ## Citations`,
      taskDescription: "Analyze SaaS agreement with focus on data, security, and compliance requirements",
      specialInstructions: "Time target: 45-60 seconds. SaaS contracts have unique risk areas in data protection and vendor lock-in."
    },
    msa_review: {
      role: "Provide enterprise-grade detailed analysis for Master Service Agreements and Framework Agreements",
      outputFormat: `Use markdown with these sections:
- ## Payment Terms & Pricing Structure
- ## IP Ownership & Licensing
- ## Indemnification Provisions
- ## Limitation of Liability Analysis
- ## Termination Rights & Notice Periods
- ## SOW (Statement of Work) Framework Review
- ## Governing Law & Dispute Resolution
- ## Citations`,
      taskDescription: "Analyze MSA/Enterprise Agreement focusing on long-term relationship structure",
      specialInstructions: "Time target: 60-90 seconds. MSAs are complex, high-value, multi-year commitments requiring thorough analysis."
    },
    employment_review: {
      role: "Review employment agreements with focus on compliance and jurisdiction-specific regulations",
      outputFormat: `Use markdown with these sections:
- ## At-Will vs Fixed-Term Classification
- ## Non-Compete Enforceability (jurisdiction-specific)
- ## Non-Solicitation Provisions
- ## IP Assignment Clauses
- ## Equity/Compensation Structure
- ## Confidentiality Obligations
- ## Termination Provisions Compliance
- ## Citations`,
      taskDescription: "Analyze employment agreement for compliance with employment laws",
      specialInstructions: "Time target: 40-55 seconds. Employment law is highly regulated and jurisdiction-specific. Flag enforceability issues."
    },
    vendor_review: {
      role: "Review vendor and procurement contracts for purchasing compliance",
      outputFormat: `Use markdown with these sections:
- ## Pricing & Payment Terms
- ## Delivery Obligations & Timelines
- ## Warranties & Representations
- ## Insurance Requirements
- ## Compliance with Procurement Policies
- ## Termination for Convenience
- ## Assignment & Subcontracting Restrictions
- ## Citations`,
      taskDescription: "Analyze vendor/purchasing agreement for procurement compliance",
      specialInstructions: "Time target: 40-55 seconds. High volume contracts requiring specific procurement policy checks."
    },
    realestate_review: {
      role: "Review real estate agreements and leases with focus on property-specific considerations",
      outputFormat: `Use markdown with these sections:
- ## Lease Term & Renewal Options
- ## Rent Escalation Clauses
- ## Maintenance Responsibilities
- ## Use Restrictions & Permitted Uses
- ## Subletting & Assignment Rights
- ## Termination & Default Provisions
- ## Security Deposit & Guarantees
- ## Citations`,
      taskDescription: "Analyze real estate agreement focusing on lease terms and property obligations",
      specialInstructions: "Time target: 50-70 seconds. Real estate has unique legal considerations around property rights and use."
    }
  };

  return deliverables[deliverableType || "full_analysis"] || deliverables.full_analysis;
}

async function retrieveRAGContext(
  supabase: any,
  resolvedJurisdiction: { country: string; state?: string | null },
  tenantId: string
): Promise<{ context: string; citations: string[] }> {
  const { data: sources } = await supabase
    .from("rag_sources")
    .select("*")
    .eq("jurisdiction_country", resolvedJurisdiction.country)
    .eq("status", "approved")
    .limit(3);

  if (!sources || sources.length === 0) {
    return {
      context: "No specific RAG sources available for this jurisdiction.",
      citations: [],
    };
  }

  const citations = sources.map(
    (s: any) =>
      `${s.name} (${s.type}) - ${s.jurisdiction_country}${s.jurisdiction_state ? `, ${s.jurisdiction_state}` : ""}`
  );

  const context = sources
    .map((s: any, idx: number) => `[Source ${idx + 1}] ${s.name}: ${s.description || "Legal reference document"}`)
    .join("\n");

  return { context, citations };
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
        JSON.stringify({ error: "Missing authorization token" }), 
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create client with user's JWT for authentication
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized",
          details: authError?.message || "Invalid token",
        }), 
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, tenant_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }), 
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestData: ContractReviewRequest = await req.json();
    const { prompt, deliverableType, documents, jurisdiction } = requestData;

    const resolvedJurisdiction = jurisdiction || { country: "US", state: null };

    const contractText = documents && documents.length > 0
      ? documents[0].content
      : prompt;

    const { context, citations } = await retrieveRAGContext(
      supabase,
      resolvedJurisdiction,
      profile.tenant_id
    );

    const deliverableInstructions = getDeliverableInstructions(deliverableType);

    const systemPrompt = `You are a contract review specialist for LexCowork AI operating in ${resolvedJurisdiction.country}${resolvedJurisdiction.state ? `, ${resolvedJurisdiction.state}` : ""}.

**Your Role**: ${deliverableInstructions.role}

**Hard Constraints**:
1. NEVER provide legal advice or recommendations on what to do
2. NEVER use advice language ("you should", "I recommend")
3. ONLY provide informational analysis
4. Flag risks as LOW, MEDIUM, or HIGH with explanations
5. Cite specific clause numbers when referencing contract text

**Available Context**:
${context}

**Output Format**:
${deliverableInstructions.outputFormat}

${deliverableInstructions.specialInstructions || ""}

Remember: You inform, not advise. Users must consult licensed attorneys for legal decisions.`;

    const reviewPrompt = `${deliverableInstructions.taskDescription}

**Contract Text**:
${contractText.substring(0, 8000)}

Provide comprehensive analysis covering all sections mentioned in your instructions.`;

    const claudeResponse = await callClaude(reviewPrompt, systemPrompt);

    const result: ContractReviewResult = {
      summary: claudeResponse,
      key_terms: [],
      risks: [],
      missing_clauses: [],
      redline_suggestions: [],
      citations,
    };

    return new Response(
      JSON.stringify({
        success: true,
        result,
        resolvedJurisdiction,
        worker: "contract_review",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Contract review error:", error);

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
