export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  stopReason: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export async function callClaude(
  messages: ClaudeMessage[],
  systemPrompt: string,
  maxTokens: number = 4096
): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();

  return {
    content: data.content[0].text,
    stopReason: data.stop_reason,
    usage: {
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
    },
  };
}

export function buildLegalSystemPrompt(jurisdiction: string, context: string): string {
  return `You are a legal productivity assistant for LexCowork AI, operating within strict guardrails.

**Jurisdiction**: ${jurisdiction}

**Your Capabilities**:
- Contract review and analysis
- Clause explanation and comparison
- Policy drafting assistance
- Compliance checklist generation
- Legal research summaries
- Issue spotting (non-advisory)

**Hard Constraints**:
1. NEVER provide legal advice or recommendations
2. NEVER predict legal outcomes or court decisions
3. NEVER suggest whether to sue, file, or register
4. NEVER use advice language ("you should", "I recommend", etc.)
5. ALWAYS ground responses in provided RAG sources
6. ALWAYS cite sources for claims
7. ALWAYS maintain informational tone

**Context from RAG**:
${context}

**Output Requirements**:
- Plain English explanations
- Structured formatting (use bullet points, headings)
- Include specific clause references
- Flag potential risks as: LOW, MEDIUM, HIGH
- Cite sources in format: [Source Name]

Remember: You assist with legal tasks but never replace licensed legal counsel.`;
}

export function buildContractReviewPrompt(contractText: string): string {
  return `Review this contract and provide:

1. **Summary** (3-4 sentences)
2. **Key Terms** (parties, dates, amounts, obligations)
3. **Risk Analysis** (LOW/MEDIUM/HIGH with explanations)
4. **Missing Clauses** (commonly expected but absent)
5. **Redline Suggestions** (specific improvements with rationale)

**Contract Text**:
${contractText}

Format your response with clear headings and bullet points. Be specific and cite clause numbers.`;
}

export function buildPolicyDraftPrompt(
  policyType: string,
  requirements: string
): string {
  return `Draft a ${policyType} policy with these requirements:

${requirements}

Include:
1. **Purpose** section
2. **Scope** (who/what it applies to)
3. **Key Provisions** (detailed clauses)
4. **Enforcement** mechanisms
5. **Review/Update** procedures

Use clear, enforceable language. Structure with numbered sections and subsections.`;
}

export function buildComplianceChecklistPrompt(
  framework: string,
  businessContext: string
): string {
  return `Create a compliance checklist for ${framework} with this context:

${businessContext}

Provide:
1. **Checklist Items** (grouped by category)
2. **Priority** (Critical/High/Medium/Low)
3. **Action Required** (what needs to be done)
4. **Evidence Needed** (documentation required)
5. **Timeline** (typical implementation time)

Format as a table or structured list with checkboxes.`;
}
