'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2, Upload, X, FileText, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { createTask } from '@/lib/services/task-executor';
import { useToast } from '@/hooks/use-toast';
import { USState } from '@/lib/jurisdiction/validator';

const TASK_DELIVERABLES = {
  contract_review: [
    { label: 'Full Contract Analysis', value: 'full_analysis', category: 'base' },
    { label: 'Risk Analysis Report', value: 'risk_analysis', category: 'base' },
    { label: 'Redline Generation', value: 'redline', category: 'base' },
    { label: 'Playbook Comparison', value: 'playbook', category: 'base' },
    { label: 'NDA Quick Review ⚡', value: 'nda_quick', category: 'specialized' },
    { label: 'SaaS Agreement Review ☁️', value: 'saas_review', category: 'specialized' },
    { label: 'MSA/Enterprise Agreement Review 🏢', value: 'msa_review', category: 'specialized' },
    { label: 'Employment Agreement Review 👤', value: 'employment_review', category: 'specialized' },
    { label: 'Vendor Agreement Review 🛒', value: 'vendor_review', category: 'specialized' },
    { label: 'Real Estate Agreement Review 🏠', value: 'realestate_review', category: 'specialized' },
  ],
  policy_drafting: [
    { label: 'Policy Document (Full Draft)', value: 'full_draft', category: 'base' },
    { label: 'Policy Amendment', value: 'amendment', category: 'base' },
    { label: 'Policy Gap Analysis', value: 'gap_analysis', category: 'base' },
    { label: 'Multi-Jurisdiction Policy', value: 'multi_jurisdiction', category: 'base' },
    { label: 'Privacy Policy (GDPR/CCPA) 🔒', value: 'privacy_policy', category: 'specialized' },
    { label: 'Information Security Policy 🛡️', value: 'infosec_policy', category: 'specialized' },
    { label: 'Code of Conduct / Ethics Policy ⚖️', value: 'ethics_policy', category: 'specialized' },
    { label: 'Remote Work / Hybrid Work Policy 💻', value: 'remote_work_policy', category: 'specialized' },
    { label: 'Social Media Policy 📱', value: 'social_media_policy', category: 'specialized' },
  ],
  compliance_check: [
    { label: 'Compliance Audit Report', value: 'audit_report', category: 'base' },
    { label: 'Gap Analysis', value: 'gap_analysis', category: 'base' },
    { label: 'Remediation Action Plan', value: 'remediation_plan', category: 'base' },
    { label: 'Policy Compliance Check', value: 'policy_check', category: 'base' },
    { label: 'GDPR Compliance Assessment 🇪🇺', value: 'gdpr_assessment', category: 'specialized' },
    { label: 'CCPA/Privacy Law Compliance 🇺🇸', value: 'ccpa_compliance', category: 'specialized' },
    { label: 'SOC 2 / ISO 27001 Compliance 🛡️', value: 'soc2_iso_compliance', category: 'specialized' },
    { label: 'HIPAA Compliance 🏥', value: 'hipaa_compliance', category: 'specialized' },
    { label: 'Financial Regulations (SOX, FINRA) 💰', value: 'financial_regulations', category: 'specialized' },
    { label: 'Export Control / Sanctions Compliance 🌍', value: 'export_control', category: 'specialized' },
  ],
  legal_research: [
    { label: 'Research Memorandum (Full)', value: 'research_memo', category: 'base' },
    { label: 'Case Law Summary', value: 'case_law_summary', category: 'base' },
    { label: 'Statutory Analysis', value: 'statutory_analysis', category: 'base' },
    { label: 'Jurisdiction Comparison', value: 'jurisdiction_comparison', category: 'base' },
    { label: 'Contract Clause Precedent Research 📋', value: 'clause_precedent', category: 'specialized' },
    { label: 'IP / Trademark Research ™️', value: 'ip_research', category: 'specialized' },
    { label: 'Employment Law Research 👔', value: 'employment_law', category: 'specialized' },
    { label: 'Litigation Case Strategy Research ⚖️', value: 'litigation_strategy', category: 'specialized' },
    { label: 'Regulatory Update Alert 🚨', value: 'regulatory_update', category: 'specialized' },
  ],
  intake: [
    { label: 'General Legal Request Intake', value: 'general_intake', category: 'base' },
    { label: 'Issue Categorization & Tagging', value: 'categorization', category: 'base' },
    { label: 'Complexity & Risk Triage', value: 'triage', category: 'base' },
    { label: 'Initial Legal Analysis', value: 'initial_analysis', category: 'base' },
    { label: 'NDA Triage & Routing ⚡', value: 'nda_triage', category: 'specialized' },
    { label: 'Vendor Contract Intake 🛒', value: 'vendor_intake', category: 'specialized' },
    { label: 'Employment Matter Intake 👤', value: 'employment_intake', category: 'specialized' },
    { label: 'Litigation / Dispute Intake ⚖️', value: 'litigation_intake', category: 'specialized' },
    { label: 'Privacy / Data Request Intake 🔒', value: 'privacy_intake', category: 'specialized' },
    { label: 'IP Matter Intake ™️', value: 'ip_intake', category: 'specialized' },
    { label: 'M&A / Transaction Intake 💼', value: 'ma_intake', category: 'specialized' },
    { label: 'Regulatory / Government Inquiry Intake 🏛️', value: 'regulatory_intake', category: 'specialized' },
  ],
  risk_assessment: [
    { label: 'Legal Risk Analysis Report', value: 'risk_analysis_report', category: 'base' },
    { label: 'Risk Score Matrix', value: 'risk_matrix', category: 'base' },
    { label: 'Mitigation Strategy Plan', value: 'mitigation_plan', category: 'base' },
    { label: 'Risk Comparison Analysis', value: 'risk_comparison', category: 'base' },
    { label: 'Litigation Risk Assessment ⚖️', value: 'litigation_risk', category: 'specialized' },
    { label: 'Regulatory Risk Assessment 🏛️', value: 'regulatory_risk', category: 'specialized' },
    { label: 'Contract Risk Assessment 📄', value: 'contract_risk', category: 'specialized' },
    { label: 'Third-Party / Vendor Risk 🛒', value: 'vendor_risk', category: 'specialized' },
    { label: 'Product / Feature Launch Risk 🚀', value: 'product_launch_risk', category: 'specialized' },
  ],
  vendor_intelligence: [
    { label: 'Vendor Relationship Summary', value: 'vendor_summary', category: 'base' },
    { label: 'Agreement Comparison (Same Vendor)', value: 'agreement_comparison', category: 'base' },
    { label: 'Key Terms Extraction', value: 'key_terms', category: 'base' },
    { label: 'Vendor Amendment History', value: 'amendment_history', category: 'base' },
    { label: 'Vendor Renewal Analysis 🔄', value: 'renewal_analysis', category: 'specialized' },
    { label: 'Vendor Consolidation Analysis 🏢', value: 'consolidation_analysis', category: 'specialized' },
    { label: 'Vendor Risk Profile ⚠️', value: 'vendor_risk_profile', category: 'specialized' },
    { label: 'Vendor Spend Analysis 💰', value: 'spend_analysis', category: 'specialized' },
    { label: 'Competitive Vendor Comparison 🏆', value: 'competitive_comparison', category: 'specialized' },
  ],
  briefing: [
    { label: 'Executive Meeting Brief', value: 'executive_brief', category: 'base' },
    { label: 'Document Summary for Meeting', value: 'document_summary', category: 'base' },
    { label: 'Action Items Tracker', value: 'action_items', category: 'base' },
    { label: 'Meeting Decision Log', value: 'decision_log', category: 'base' },
    { label: 'Board Meeting Brief 🏛️', value: 'board_brief', category: 'specialized' },
    { label: 'Negotiation Meeting Brief 🤝', value: 'negotiation_brief', category: 'specialized' },
    { label: 'Due Diligence Meeting Brief 🔍', value: 'due_diligence_brief', category: 'specialized' },
    { label: 'Litigation Strategy Meeting Brief ⚖️', value: 'litigation_brief', category: 'specialized' },
  ],
};

export function TaskCreator({
  onTaskCreated,
  initialTaskType,
  triggerButton,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  onTaskCreated?: () => void;
  initialTaskType?: 'contract_review' | 'policy_drafting' | 'compliance_check' | 'legal_research' | 'intake' | 'risk_assessment' | 'vendor_intelligence' | 'briefing';
  triggerButton?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (controlledOnOpenChange) {
      controlledOnOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    taskType: 'contract_review' | 'policy_drafting' | 'compliance_check' | 'legal_research' | 'intake' | 'risk_assessment' | 'vendor_intelligence' | 'briefing';
    deliverableType: string;
    jurisdiction: 'US' | 'IN';
    state: USState | 'none';
  }>({
    title: '',
    description: '',
    taskType: initialTaskType || 'contract_review',
    deliverableType: '',
    jurisdiction: 'US',
    state: 'none',
  });

  const [documents, setDocuments] = useState<Array<{ name: string; content: string }>>([]);

  useEffect(() => {
    if (initialTaskType && open) {
      setFormData((prev) => ({ ...prev, taskType: initialTaskType, deliverableType: '' }));
    }
  }, [initialTaskType, open]);

  const currentDeliverables = TASK_DELIVERABLES[formData.taskType] || [];

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const uploadedDocs: Array<{ name: string; content: string }> = [];

    for (const file of fileArray) {
      try {
        const content = await file.text();
        uploadedDocs.push({
          name: file.name,
          content: content,
        });
      } catch (error) {
        toast({
          title: 'Error reading file',
          description: `Failed to read ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    setDocuments((prev) => [...prev, ...uploadedDocs]);
  }

  function removeDocument(index: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !profile) return;

    setLoading(true);

    try {
      const result = await createTask({
        title: formData.title,
        description: formData.description,
        taskType: formData.taskType,
        deliverableType: formData.deliverableType || undefined,
        documents: documents.length > 0 ? documents : undefined,
        jurisdiction: {
          country: formData.jurisdiction,
          state: (formData.state === 'none' ? null : formData.state) as USState | null,
          confidence: 'explicit',
        },
        tenantId: profile.tenant_id,
        userId: user.id,
      });

      if (result.status === 'failed') {
        toast({
          title: 'Task creation failed',
          description: typeof result.error === 'string'
            ? result.error
            : result.error
              ? JSON.stringify(result.error)
              : 'Unknown error occurred',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Task created',
          description: 'Your task has been queued for execution',
        });

        setFormData({
          title: '',
          description: '',
          taskType: 'contract_review',
          deliverableType: '',
          jurisdiction: 'US',
          state: 'none',
        });
        setDocuments([]);

        setOpen(false);
        onTaskCreated?.();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create task',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {triggerButton || (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Legal Task</DialogTitle>
          <DialogDescription>
            Create a new legal task for AI-assisted processing
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="e.g., Review NDA with Vendor ABC"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide details about what you need reviewed or drafted..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskType">LexCoworker</Label>
              <Select
                value={formData.taskType}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, taskType: value, deliverableType: '' }))
                }
              >
                <SelectTrigger id="taskType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract_review">Contract Review</SelectItem>
                  <SelectItem value="policy_drafting">Policy Drafting</SelectItem>
                  <SelectItem value="compliance_check">Compliance Check</SelectItem>
                  <SelectItem value="legal_research">Legal Research</SelectItem>
                  <SelectItem value="intake">Intake & Issue Spotting</SelectItem>
                  <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                  <SelectItem value="vendor_intelligence">Vendor Intelligence</SelectItem>
                  <SelectItem value="briefing">Meeting Briefing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Select
                value={formData.jurisdiction}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, jurisdiction: value, state: 'none' }))
                }
              >
                <SelectTrigger id="jurisdiction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="IN">India</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
            <div>
              <Label className="text-sm font-medium">Available Deliverables</Label>
              <p className="text-xs text-muted-foreground mt-1">
                This LexCoworker can generate the following outputs
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentDeliverables.map((deliverable) => (
                <Badge
                  key={deliverable.value}
                  variant="secondary"
                  className="flex items-center gap-1 py-1.5 px-3"
                >
                  <CheckCircle className="h-3 w-3" />
                  {deliverable.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliverableType">Deliverable Type</Label>
            <Select
              value={formData.deliverableType}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, deliverableType: value }))
              }
            >
              <SelectTrigger id="deliverableType">
                <SelectValue placeholder="Select what you need delivered..." />
              </SelectTrigger>
              <SelectContent>
                {currentDeliverables.map((deliverable) => (
                  <SelectItem key={deliverable.value} value={deliverable.value}>
                    {deliverable.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.jurisdiction === 'US' && (
            <div className="space-y-2">
              <Label htmlFor="state">State (Optional)</Label>
              <Select
                value={formData.state}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, state: value as USState | 'none' }))
                }
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select state..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Federal (No specific state)</SelectItem>
                  <SelectItem value="TX">Texas</SelectItem>
                  <SelectItem value="CA">California</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="documents">Documents (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 hover:border-gray-400 transition-colors">
              <input
                id="documents"
                type="file"
                multiple
                accept=".txt,.pdf,.doc,.docx,.md"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
              <label
                htmlFor="documents"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  TXT, PDF, DOC, DOCX, MD files
                </span>
              </label>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2 mt-3">
                {documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{doc.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
