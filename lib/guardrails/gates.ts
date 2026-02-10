import { JurisdictionInfo } from '../jurisdiction/validator';

export type GateResult = {
  allowed: boolean;
  reason?: string;
  blockedBy?: 'policy' | 'tool' | 'output';
};

const PROHIBITED_PATTERNS = [
  'should i sue',
  'should i file',
  'should i register',
  'will i win',
  'what are my chances',
  'court strategy',
  'legal outcome',
  'guaranteed',
  'definitely win',
  'evade',
  'avoid tax',
  'hide assets',
];

const ADVICE_INDICATORS = [
  'you should',
  'i recommend',
  'you must',
  'i advise',
  'my advice is',
  'in my opinion',
];

export function policyGate(userPrompt: string, aiResponse?: string): GateResult {
  const lowerPrompt = userPrompt.toLowerCase();
  const lowerResponse = aiResponse?.toLowerCase() || '';

  for (const pattern of PROHIBITED_PATTERNS) {
    if (lowerPrompt.includes(pattern)) {
      return {
        allowed: false,
        reason: `This request involves ${pattern.replace(/\s+/g, ' ')}, which is outside the scope of this platform. Please consult a licensed attorney for legal advice.`,
        blockedBy: 'policy',
      };
    }
  }

  for (const indicator of ADVICE_INDICATORS) {
    if (lowerResponse.includes(indicator)) {
      return {
        allowed: false,
        reason: 'Response contains legal advice language. LexCowork AI provides informational assistance only.',
        blockedBy: 'policy',
      };
    }
  }

  return { allowed: true };
}

type Action =
  | 'create_document'
  | 'insert_redlines'
  | 'generate_summary'
  | 'generate_checklist'
  | 'compare_versions'
  | 'delete_document';

const ALLOWED_ACTIONS: Action[] = [
  'create_document',
  'insert_redlines',
  'generate_summary',
  'generate_checklist',
  'compare_versions',
];

const ADMIN_ONLY_ACTIONS: Action[] = ['delete_document'];

export function toolGate(
  action: Action,
  userRole: 'super_admin' | 'user',
  requiresPreview: boolean = true
): GateResult {
  if (ADMIN_ONLY_ACTIONS.includes(action) && userRole !== 'super_admin') {
    return {
      allowed: false,
      reason: 'This action requires Super Admin privileges',
      blockedBy: 'tool',
    };
  }

  if (!ALLOWED_ACTIONS.includes(action) && !ADMIN_ONLY_ACTIONS.includes(action)) {
    return {
      allowed: false,
      reason: `Action '${action}' is not in the allowlist`,
      blockedBy: 'tool',
    };
  }

  if (['create_document', 'insert_redlines'].includes(action) && !requiresPreview) {
    return {
      allowed: false,
      reason: 'Write actions require user preview and approval',
      blockedBy: 'tool',
    };
  }

  return { allowed: true };
}

export interface OutputMetadata {
  jurisdiction: JurisdictionInfo;
  ragSources: string[];
  confidence: number;
  workersUsed: string[];
}

export function outputGate(
  content: string,
  metadata: OutputMetadata
): GateResult {
  if (metadata.ragSources.length === 0) {
    return {
      allowed: false,
      reason: 'No RAG sources found. All outputs must be grounded in verified sources.',
      blockedBy: 'output',
    };
  }

  if (metadata.confidence < 0.5) {
    return {
      allowed: false,
      reason: 'Confidence too low. Please refine your request or provide more context.',
      blockedBy: 'output',
    };
  }

  if (!metadata.jurisdiction.country) {
    return {
      allowed: false,
      reason: 'Jurisdiction must be specified',
      blockedBy: 'output',
    };
  }

  return { allowed: true };
}

export function addMandatoryFooter(
  content: string,
  metadata: OutputMetadata
): string {
  const jurisdiction = metadata.jurisdiction.state
    ? `${metadata.jurisdiction.state}, ${metadata.jurisdiction.country}`
    : metadata.jurisdiction.country;

  const footer = `

---

**Jurisdiction**: ${jurisdiction}
**Confidence**: ${(metadata.confidence * 100).toFixed(0)}%
**Sources**: ${metadata.ragSources.length} document(s)

⚠️ **Disclaimer**: This output is informational only and does not constitute legal advice. For legal decisions, please consult a licensed attorney in your jurisdiction.
`;

  return content + footer;
}

export function runAllGates(
  userPrompt: string,
  aiResponse: string,
  action: Action | null,
  userRole: 'super_admin' | 'user',
  metadata: OutputMetadata
): GateResult {
  const policyResult = policyGate(userPrompt, aiResponse);
  if (!policyResult.allowed) return policyResult;

  if (action) {
    const toolResult = toolGate(action, userRole);
    if (!toolResult.allowed) return toolResult;
  }

  const outputResult = outputGate(aiResponse, metadata);
  if (!outputResult.allowed) return outputResult;

  return { allowed: true };
}
