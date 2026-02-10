/**
 * Anthropic Usage Policy Compliance Module
 * Based on Cursor AI Implementation Guide Phase 9
 */

import { TaskRequest, ComplianceCheck } from '@/types/orchestration';

/**
 * Check if task complies with Anthropic usage policies
 * Reference: https://www.anthropic.com/legal/aup
 */
export function checkAnthropicCompliance(task: TaskRequest): ComplianceCheck {
  const description = task.description.toLowerCase();
  const docText = task.document_text?.toLowerCase() || '';
  const combinedText = `${description} ${docText}`;

  // High-risk use case detection
  const riskIndicators = detectRiskLevel(combinedText, task);
  
  // Prohibited use cases (per Anthropic Usage Policy)
  const prohibited = checkProhibitedUseCases(combinedText);
  if (prohibited.isProhibited) {
    return {
      allowed: false,
      requires_human_review: true,
      requires_ai_disclosure: true,
      risk_level: 'critical',
      safeguards_required: ['BLOCKED'],
      blocked_reason: prohibited.reason,
    };
  }

  // Determine safeguards based on risk level
  const safeguards = determineSafeguards(riskIndicators.level, task);

  return {
    allowed: true,
    requires_human_review: riskIndicators.level === 'high' || riskIndicators.level === 'critical',
    requires_ai_disclosure: true, // Always required for legal use
    risk_level: riskIndicators.level,
    safeguards_required: safeguards,
  };
}

interface RiskIndicators {
  level: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
}

function detectRiskLevel(text: string, task: TaskRequest): RiskIndicators {
  const reasons: string[] = [];
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Critical risk indicators
  const criticalPatterns = [
    'court filing',
    'submit to court',
    'file lawsuit',
    'litigation strategy',
    'criminal defense',
    'plea agreement',
  ];

  for (const pattern of criticalPatterns) {
    if (text.includes(pattern)) {
      reasons.push(`Contains critical use case: ${pattern}`);
      level = 'critical';
      break;
    }
  }

  // High risk indicators
  if (level !== 'critical') {
    const highRiskPatterns = [
      'merger',
      'm&a',
      'acquisition',
      'ipo',
      'public offering',
      'regulatory investigation',
      'government inquiry',
    ];

    for (const pattern of highRiskPatterns) {
      if (text.includes(pattern)) {
        reasons.push(`High-stakes transaction: ${pattern}`);
        level = 'high';
        break;
      }
    }

    // Check contract value
    const valueMatch = text.match(/\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:million|m)?/i);
    if (valueMatch) {
      const value = parseFloat(valueMatch[1].replace(/,/g, ''));
      const isMillions = text.toLowerCase().includes('million');
      const actualValue = isMillions ? value * 1_000_000 : value;

      if (actualValue > 100_000) {
        reasons.push(`High-value contract: $${actualValue.toLocaleString()}`);
        level = level === 'low' ? 'high' : level;
      }
    }
  }

  // Medium risk indicators
  if (level === 'low') {
    const mediumRiskPatterns = [
      'compliance audit',
      'regulatory requirement',
      'data breach',
      'privacy violation',
      'employment termination',
      'discrimination claim',
    ];

    for (const pattern of mediumRiskPatterns) {
      if (text.includes(pattern)) {
        reasons.push(`Compliance-sensitive matter: ${pattern}`);
        level = 'medium';
        break;
      }
    }
  }

  // Priority flag
  if (task.priority === 'high' && level === 'low') {
    level = 'medium';
    reasons.push('User marked as high priority');
  }

  if (reasons.length === 0) {
    reasons.push('Standard legal information request');
  }

  return { level, reasons };
}

interface ProhibitedCheck {
  isProhibited: boolean;
  reason?: string;
}

function checkProhibitedUseCases(text: string): ProhibitedCheck {
  // Anthropic Usage Policy prohibitions
  const prohibitedPatterns = [
    {
      pattern: /(?:how to|help me|assist with)\s+(?:evade|avoid|hide|conceal)\s+(?:tax|taxes|regulation|law)/i,
      reason: 'Requests assistance with illegal activities (tax evasion)',
    },
    {
      pattern: /(?:help|assist|advise)\s+(?:me|us|them)\s+(?:lie|deceive|mislead|fraud)/i,
      reason: 'Requests assistance with deceptive practices',
    },
    {
      pattern: /(?:voter|election)\s+(?:targeting|manipulation|suppression)/i,
      reason: 'Prohibited use: Voter targeting or election manipulation',
    },
    {
      pattern: /(?:write|draft|generate)\s+(?:fake|fraudulent|false)\s+(?:legal|court|affidavit|testimony)/i,
      reason: 'Requests generation of fraudulent legal documents',
    },
  ];

  for (const { pattern, reason } of prohibitedPatterns) {
    if (pattern.test(text)) {
      return { isProhibited: true, reason };
    }
  }

  // Legal advice vs information boundary
  const advicePatterns = [
    /should i (?:sue|file|settle|sign)/i,
    /what should i do (?:legally|in court)/i,
    /will i win (?:this case|in court)/i,
    /(?:give me|provide) legal advice/i,
  ];

  for (const pattern of advicePatterns) {
    if (pattern.test(text)) {
      return {
        isProhibited: false, // Not completely prohibited, but requires disclaimer
        reason: 'Request may seek legal advice. Ensure output is informational only.',
      };
    }
  }

  return { isProhibited: false };
}

function determineSafeguards(
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  task: TaskRequest
): string[] {
  const safeguards: string[] = [];

  // All tasks require AI disclosure
  safeguards.push('AI_DISCLOSURE');

  switch (riskLevel) {
    case 'critical':
      safeguards.push('ATTORNEY_REVIEW_REQUIRED');
      safeguards.push('NO_AUTO_EXECUTION');
      safeguards.push('SENIOR_APPROVAL_REQUIRED');
      safeguards.push('AUDIT_TRAIL_DETAILED');
      break;

    case 'high':
      safeguards.push('ATTORNEY_REVIEW_RECOMMENDED');
      safeguards.push('MANUAL_APPROVAL_REQUIRED');
      safeguards.push('AUDIT_TRAIL_STANDARD');
      break;

    case 'medium':
      safeguards.push('HUMAN_REVIEW_RECOMMENDED');
      safeguards.push('AUDIT_TRAIL_STANDARD');
      break;

    case 'low':
      safeguards.push('STANDARD_DISCLAIMER');
      break;
  }

  return safeguards;
}

/**
 * Generate mandatory AI disclosure text
 */
export function generateAIDisclosure(task: TaskRequest, confidence: number): string {
  const jurisdiction = task.jurisdiction.state
    ? `${task.jurisdiction.state}, ${task.jurisdiction.country}`
    : task.jurisdiction.country;

  return `
---

## ⚠️ AI-Generated Content Disclosure

This document was generated with assistance from Claude AI (Anthropic PBC) via LexCoworkAI platform.

**Important Legal Disclaimers:**

1. **Not Legal Advice**: This output is provided for informational purposes only and does not constitute legal advice. It should not be relied upon as a substitute for consultation with licensed legal counsel.

2. **No Attorney-Client Relationship**: Use of this AI-assisted platform does not create an attorney-client relationship. Consult with a licensed attorney before making legal decisions.

3. **Verification Required**: This output may contain errors, omissions, or inaccuracies. All information should be independently verified by qualified legal professionals.

4. **Jurisdiction-Specific**: This analysis is based on ${jurisdiction} legal context. Laws vary by jurisdiction and change over time.

5. **Human Review Required**: All AI-generated legal content must be reviewed and approved by a licensed attorney before use in any legal proceeding or binding agreement.

**Confidence Score**: ${(confidence * 100).toFixed(0)}%

**Recommended Next Steps**: 
- Have a licensed attorney review this analysis
- Verify all cited laws and regulations
- Confirm applicability to your specific situation

For legal advice, please consult a licensed attorney in your jurisdiction.
`;
}

/**
 * Check if output contains prohibited advice language
 */
export function containsAdviceLanguage(text: string): {
  hasAdvice: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();

  const adviceIndicators = [
    { pattern: /\byou should\b/gi, description: '"you should" - directive language' },
    { pattern: /\bi recommend\b/gi, description: '"I recommend" - recommendation language' },
    { pattern: /\byou must\b/gi, description: '"you must" - mandatory directive' },
    { pattern: /\bmy advice is\b/gi, description: '"my advice is" - explicit advice' },
    { pattern: /\bin my opinion\b/gi, description: '"in my opinion" - subjective advice' },
    { pattern: /\byou ought to\b/gi, description: '"you ought to" - directive language' },
  ];

  for (const { pattern, description } of adviceIndicators) {
    const matches = text.match(pattern);
    if (matches) {
      violations.push(`${description} (${matches.length} occurrence(s))`);
    }
  }

  return {
    hasAdvice: violations.length > 0,
    violations,
  };
}
