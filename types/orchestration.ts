/**
 * Core Type Definitions for LexCoworkAI Orchestration System
 * Based on Cursor AI Implementation Guide
 */

export type WorkerType =
  | 'contract_review'
  | 'compliance_check'
  | 'legal_research'
  | 'policy_drafting'
  | 'intake_triage'
  | 'risk_assessment'
  | 'vendor_intelligence'
  | 'briefing';

export type TaskPriority = 'high' | 'normal' | 'low';
export type TaskStatus = 'pending' | 'planning' | 'executing' | 'completed' | 'failed' | 'review_required';
export type JurisdictionCountry = 'US' | 'IN';
export type USState = 'TX' | 'CA' | 'NY' | null;

/**
 * Task Request submitted by user
 */
export interface TaskRequest {
  id: string;
  organization_id: string;
  user_id: string;
  description: string;
  document_text?: string;
  document_url?: string;
  documents?: Array<{ name: string; content: string }>;
  jurisdiction: JurisdictionInfo;
  doc_type?: string;
  task_type: WorkerType;
  deliverable_type?: string;
  priority: TaskPriority;
  created_at: Date;
}

/**
 * Jurisdiction information for legal context
 */
export interface JurisdictionInfo {
  country: JurisdictionCountry;
  state?: USState;
  confidence: 'explicit' | 'inferred' | 'unknown';
}

/**
 * Single step in execution plan
 */
export interface ExecutionStep {
  worker: WorkerType;
  purpose: string; // Why this worker is needed
  depends_on?: number[]; // Indices of steps that must complete first
  estimated_tokens: number;
  deliverable_type?: string;
}

/**
 * Execution plan created by planner
 */
export interface ExecutionPlan {
  task_id: string;
  steps: ExecutionStep[];
  estimated_duration_seconds: number;
  estimated_cost: number;
  reasoning?: string; // Why this plan was chosen
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cached?: number;
}

/**
 * Output from a single worker
 */
export interface WorkerOutput {
  worker: WorkerType;
  output: any; // Worker-specific output structure
  confidence: number; // 0-1 confidence score
  token_usage: TokenUsage;
  duration_ms: number;
  success: boolean;
  error?: string;
  citations?: string[];
  rag_sources_used?: string[];
}

/**
 * Final synthesized result
 */
export interface TaskResult {
  task_id: string;
  execution_plan: ExecutionPlan;
  worker_outputs: WorkerOutput[];
  final_output: string;
  confidence_score: number;
  requires_attorney_review: boolean;
  ai_disclosure: string;
  total_tokens: TokenUsage;
  total_cost: number;
  duration_ms: number;
  status: TaskStatus;
  error?: string;
}

/**
 * Context passed between workers
 */
export interface WorkerContext {
  task: TaskRequest;
  knowledge_base_results: KnowledgeBaseResult[];
  previous_worker_outputs?: WorkerOutput[];
  organization_preferences?: Record<string, any>;
}

/**
 * Knowledge base query result
 */
export interface KnowledgeBaseResult {
  id: string;
  content_type: 'template' | 'clause' | 'precedent' | 'regulation';
  title: string;
  content: string;
  jurisdiction: JurisdictionInfo;
  doc_type?: string;
  relevance_score: number;
  metadata?: Record<string, any>;
}

/**
 * Anthropic compliance check result
 */
export interface ComplianceCheck {
  allowed: boolean;
  requires_human_review: boolean;
  requires_ai_disclosure: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  safeguards_required: string[];
  blocked_reason?: string;
}

/**
 * Progress update for UI
 */
export interface OrchestrationProgress {
  task_id: string;
  stage: 'planning' | 'executing' | 'synthesizing' | 'completed';
  current_step?: number;
  total_steps?: number;
  current_worker?: WorkerType;
  message: string;
  timestamp: Date;
}
