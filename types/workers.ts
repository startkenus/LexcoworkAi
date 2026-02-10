/**
 * Worker-specific type definitions
 * Based on Cursor AI Implementation Guide
 */

import { WorkerType, JurisdictionInfo } from './orchestration';

/**
 * Base worker configuration
 */
export interface BaseWorkerConfig {
  name: WorkerType;
  description: string;
  system_prompt: string;
  typical_token_usage: number;
  knowledge_base_query_types: string[];
}

/**
 * Contract Review Worker Output
 */
export interface ContractReviewOutput {
  summary: string;
  key_terms: Array<{
    term: string;
    value: string;
    location: string;
  }>;
  risks: Array<{
    severity: 'high' | 'medium' | 'low';
    issue: string;
    location: string;
    recommendation: string;
  }>;
  missing_clauses: string[];
  recommendations: string[];
  redline_suggestions?: Array<{
    clause: string;
    current: string;
    suggested: string;
    rationale: string;
  }>;
  confidence: number;
}

/**
 * Compliance Check Worker Output
 */
export interface ComplianceCheckOutput {
  compliant: boolean;
  applicable_regulations: Array<{
    name: string;
    jurisdiction: string;
    requirement: string;
  }>;
  violations: Array<{
    regulation: string;
    issue: string;
    severity: 'critical' | 'major' | 'minor';
    remediation: string;
  }>;
  recommendations: string[];
  confidence: number;
}

/**
 * Legal Research Worker Output
 */
export interface LegalResearchOutput {
  query: string;
  cases: Array<{
    citation: string;
    summary: string;
    relevance: number;
    jurisdiction: string;
  }>;
  statutes: Array<{
    citation: string;
    text: string;
    relevance: number;
    jurisdiction: string;
  }>;
  analysis: string;
  confidence: number;
}

/**
 * Policy Drafting Worker Output
 */
export interface PolicyDraftingOutput {
  policy_type: string;
  draft_content: string;
  required_sections: string[];
  jurisdiction_notes: string;
  compliance_checklist: string[];
  confidence: number;
}

/**
 * Risk Assessment Worker Output
 */
export interface RiskAssessmentOutput {
  overall_risk_score: number; // 0-100
  risk_category: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: Array<{
    category: 'legal' | 'financial' | 'operational' | 'reputational';
    factor: string;
    impact: number;
    likelihood: number;
    mitigation: string;
  }>;
  recommendations: string[];
  escalation_required: boolean;
  confidence: number;
}

/**
 * Intake & Triage Worker Output
 */
export interface IntakeOutput {
  issue_category: string;
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  complexity: 'simple' | 'moderate' | 'complex';
  recommended_workers: WorkerType[];
  initial_analysis: string;
  routing_recommendation: string;
  confidence: number;
}

/**
 * Vendor Intelligence Worker Output
 */
export interface VendorIntelligenceOutput {
  vendor_name: string;
  relationship_summary: string;
  agreement_analysis: Array<{
    agreement_type: string;
    key_terms: string[];
    risks: string[];
  }>;
  renewal_dates: string[];
  spend_analysis?: {
    total_spend: number;
    payment_terms: string;
  };
  recommendations: string[];
  confidence: number;
}

/**
 * Meeting Briefing Worker Output
 */
export interface BriefingOutput {
  briefing_type: string;
  executive_summary: string;
  key_points: string[];
  action_items: Array<{
    item: string;
    owner?: string;
    deadline?: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  decision_log: Array<{
    decision: string;
    rationale: string;
    stakeholders: string[];
  }>;
  attachments_summary?: string[];
  confidence: number;
}
