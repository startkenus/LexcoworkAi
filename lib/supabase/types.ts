export type UserRole = 'super_admin' | 'user';
export type TaskStatus = 'DRAFT' | 'QUEUED' | 'RUNNING' | 'REVIEW_REQUIRED' | 'COMPLETED' | 'ARCHIVED';
export type StepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type CountryCode = 'US' | 'IN';
export type DocType = 'contract' | 'agreement' | 'policy' | 'statute' | 'regulation' | 'case_law' | 'template' | 'other';

export interface Jurisdiction {
  country: CountryCode;
  state?: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  tenant_id: string;
  role: UserRole;
  email: string;
  full_name?: string;
  avatar_url?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  tenant_id: string;
  created_by: string;
  title: string;
  description?: string;
  status: TaskStatus;
  jurisdiction: Jurisdiction;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  assigned_worker?: string;
  recipe_id?: string;
  parent_task_id?: string;
  priority: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskStep {
  id: string;
  task_id: string;
  step_number: number;
  worker_name: string;
  status: StepStatus;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  tenant_id: string;
  task_id?: string;
  title: string;
  doc_type: DocType;
  jurisdiction?: Jurisdiction;
  storage_path?: string;
  mime_type?: string;
  file_size?: number;
  metadata: Record<string, any>;
  current_version: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  id: string;
  task_id: string;
  task_step_id: string;
  source_id?: string;
  chunk_id?: string;
  citation_text: string;
  relevance_score?: number;
  context_used?: string;
  created_at: string;
}

export interface RiskAssessment {
  id: string;
  task_id?: string;
  document_id?: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_factors: Array<{
    factor: string;
    severity: string;
    description: string;
  }>;
  mitigations: Array<{
    risk_factor: string;
    recommendation: string;
    priority: string;
  }>;
  assessed_by: string;
  assessed_at: string;
  escalated: boolean;
  escalated_to?: string;
  escalated_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  legal_name?: string;
  aliases: string[];
  jurisdiction?: string;
  risk_profile: 'low' | 'medium' | 'high' | 'unknown';
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  notes?: string;
  tenant_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorAgreement {
  id: string;
  vendor_id: string;
  document_id: string;
  agreement_type?: string;
  signed_date?: string;
  expiry_date?: string;
  status: 'draft' | 'pending' | 'active' | 'expired' | 'terminated';
  renewal_terms?: string;
  value_amount?: number;
  value_currency: string;
  created_at: string;
  updated_at: string;
}

export interface VendorKeyTerm {
  id: string;
  vendor_agreement_id: string;
  term_type: string;
  term_value: string;
  term_section?: string;
  is_standard: boolean;
  is_negotiated: boolean;
  extracted_at: string;
  created_at: string;
}

export interface Briefing {
  id: string;
  user_id: string;
  tenant_id: string;
  title: string;
  meeting_date?: string;
  meeting_time?: string;
  attendees: string[];
  content: {
    executive_summary?: string;
    key_points?: string[];
    risks?: string[];
    action_items?: string[];
    open_questions?: string[];
    [key: string]: any;
  };
  document_ids: string[];
  task_ids: string[];
  status: 'draft' | 'final' | 'archived';
  exported_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  jurisdiction?: string;
  tone: 'formal' | 'internal' | 'friendly';
  status: 'draft' | 'approved' | 'archived';
  variables: Array<{
    name: string;
    placeholder: string;
    required: boolean;
  }>;
  tenant_id: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommandHistory {
  id: string;
  user_id: string;
  tenant_id: string;
  command: string;
  parameters: Record<string, any>;
  worker_id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  execution_time_ms?: number;
  error_message?: string;
  executed_at: string;
}

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
      };
      profiles: {
        Row: Profile;
      };
      tasks: {
        Row: Task;
      };
      task_steps: {
        Row: TaskStep;
      };
      documents: {
        Row: Document;
      };
      citations: {
        Row: Citation;
      };
      risk_assessments: {
        Row: RiskAssessment;
      };
      vendors: {
        Row: Vendor;
      };
      vendor_agreements: {
        Row: VendorAgreement;
      };
      vendor_key_terms: {
        Row: VendorKeyTerm;
      };
      briefings: {
        Row: Briefing;
      };
      response_templates: {
        Row: ResponseTemplate;
      };
      command_history: {
        Row: CommandHistory;
      };
    };
  };
}
