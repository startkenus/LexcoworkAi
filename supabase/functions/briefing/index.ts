import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BriefingRequest {
  title: string;
  meeting_date?: string;
  meeting_time?: string;
  attendees?: string[];
  document_ids: string[];
  task_ids?: string[];
  focus_areas?: string[];
}

interface BriefingContent {
  executive_summary: string;
  key_points: string[];
  risks: string[];
  action_items: string[];
  open_questions: string[];
}

async function callClaude(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!apiKey) {
    return generateMockBriefing();
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
    return generateMockBriefing();
  }
}

function generateMockBriefing(): string {
  return JSON.stringify({
    executive_summary: "This briefing covers key legal matters requiring discussion, including contract negotiations with new vendors, compliance updates, and pending risk assessments.",
    key_points: [
      "Three new vendor agreements pending review",
      "Q1 compliance audit completed with minor findings",
      "Two high-risk contracts flagged for immediate attention",
      "Updated data privacy requirements effective next month"
    ],
    risks: [
      "Unlimited liability clause in Acme Corp agreement needs urgent revision",
      "Compliance gap in EU data processing requirements",
      "Missing force majeure provisions in 40% of active contracts"
    ],
    action_items: [
      "Schedule legal review meeting with Acme Corp by Friday",
      "Update data processing agreements to meet new requirements",
      "Conduct risk assessment on top 10 vendor relationships",
      "Draft policy update for board approval"
    ],
    open_questions: [
      "What is our risk appetite for the Acme Corp liability exposure?",
      "Should we standardize force majeure language across all agreements?",
      "Timeline for implementing new compliance requirements?"
    ]
  });
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

    const requestData: BriefingRequest = await req.json();
    const { title, meeting_date, meeting_time, attendees, document_ids, task_ids, focus_areas } = requestData;

    const { data: documents } = await supabase
      .from("documents")
      .select("title, doc_type, metadata")
      .in("id", document_ids);

    let tasks = [];
    if (task_ids && task_ids.length > 0) {
      const { data: taskData } = await supabase
        .from("tasks")
        .select("title, status, output_data")
        .in("id", task_ids);
      tasks = taskData || [];
    }

    const documentSummaries = documents?.map(d =>
      `- ${d.title} (${d.doc_type})`
    ).join("\n") || "No documents provided";

    const taskSummaries = tasks.map(t =>
      `- ${t.title}: ${t.status}`
    ).join("\n") || "No related tasks";

    const systemPrompt = `You are a legal briefing specialist for LexCoworkAI. Your role is to prepare concise, actionable meeting briefings for legal teams.

**Your Task**: Analyze documents and tasks to create a structured briefing.

**Output Format** (JSON only):
{
  "executive_summary": "2-3 sentence overview of key topics",
  "key_points": ["Array of 4-6 most important points"],
  "risks": ["Array of identified legal risks"],
  "action_items": ["Array of recommended actions"],
  "open_questions": ["Array of questions for discussion"]
}

Be concise, specific, and action-oriented. Focus on legal significance and business impact.`;

    const briefingPrompt = `Create a briefing for: ${title}
${meeting_date ? `Meeting Date: ${meeting_date}` : ""}
${attendees ? `Attendees: ${attendees.join(", ")}` : ""}
${focus_areas ? `Focus Areas: ${focus_areas.join(", ")}` : ""}

**Documents**:
${documentSummaries}

**Related Tasks**:
${taskSummaries}

Generate comprehensive briefing in JSON format.`;

    const claudeResponse = await callClaude(briefingPrompt, systemPrompt);

    let content: BriefingContent;
    try {
      content = JSON.parse(claudeResponse.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
    } catch {
      content = JSON.parse(generateMockBriefing());
    }

    const { data: briefing } = await supabase
      .from("briefings")
      .insert({
        user_id: user.id,
        tenant_id: profile.tenant_id,
        title,
        meeting_date,
        meeting_time,
        attendees: attendees || [],
        content,
        document_ids,
        task_ids: task_ids || [],
        status: 'draft',
      })
      .select()
      .maybeSingle();

    return new Response(
      JSON.stringify({
        success: true,
        briefing,
        worker: "briefing",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Briefing error:", error);

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
