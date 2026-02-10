'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Scale, Shield, Search, Inbox, TrendingUp, Building2, Briefcase, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type WorkerType = 'contract_review' | 'policy_drafting' | 'compliance_check' | 'legal_research' | 'intake' | 'risk_assessment' | 'vendor_intelligence' | 'briefing';

interface Worker {
  id: WorkerType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  expandedDescription: string;
  color: string;
  bgColor: string;
}

const WORKERS: Worker[] = [
  {
    id: 'contract_review',
    name: 'Contract Review',
    icon: FileText,
    description: 'Analyze contracts against your playbook',
    expandedDescription: 'Analyze contracts against your playbook, flag risks, suggest revisions, and ensure compliance with jurisdiction-specific requirements.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    id: 'policy_drafting',
    name: 'Policy Drafting',
    icon: Scale,
    description: 'Generate compliant policies and documents',
    expandedDescription: 'Generate compliant policies and legal documents tailored to your jurisdiction, industry standards, and company requirements.',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 dark:bg-slate-900/20',
  },
  {
    id: 'compliance_check',
    name: 'Compliance Check',
    icon: Shield,
    description: 'Verify against regulatory requirements',
    expandedDescription: 'Verify agreements, processes, or documents against regulatory requirements and company policies across multiple jurisdictions.',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
  },
  {
    id: 'legal_research',
    name: 'Legal Research',
    icon: Search,
    description: 'Search case law and build research memos',
    expandedDescription: 'Search case law, statutes, and legal precedents to build research memos with proper citations and jurisdiction-specific insights.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/20',
  },
  {
    id: 'intake',
    name: 'Intake & Issue Spotting',
    icon: Inbox,
    description: 'Triage incoming legal requests',
    expandedDescription: 'Triage incoming legal requests, categorize issues, assess urgency, and route to the appropriate workflow or team member.',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
  },
  {
    id: 'risk_assessment',
    name: 'Risk Assessment',
    icon: TrendingUp,
    description: 'Evaluate legal risk with scoring',
    expandedDescription: 'Evaluate legal risk on contracts, deals, or requests with risk scoring, mitigation strategies, and escalation recommendations.',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
  },
  {
    id: 'vendor_intelligence',
    name: 'Vendor Intelligence',
    icon: Building2,
    description: 'Search existing vendor agreements',
    expandedDescription: 'Search existing agreements with counterparties, compare key terms, track amendment history, and identify relationship patterns.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
  },
  {
    id: 'briefing',
    name: 'Meeting Briefing',
    icon: Briefcase,
    description: 'Prepare executive summaries',
    expandedDescription: 'Prepare executive summaries from documents, past meetings, and relevant agreements with action items and discussion points.',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
  },
];

interface WorkerSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (workerType: WorkerType) => void;
  initialWorker?: WorkerType;
}

export function WorkerSelectionModal({ open, onOpenChange, onSelect, initialWorker }: WorkerSelectionModalProps) {
  const [selectedWorker, setSelectedWorker] = useState<WorkerType | null>(initialWorker || null);
  const [hoveredWorker, setHoveredWorker] = useState<WorkerType | null>(null);

  const handleContinue = () => {
    if (selectedWorker) {
      onSelect(selectedWorker);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select AI Worker for Your Task</DialogTitle>
          <DialogDescription>
            Choose the specialized legal workflow for this task
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-6">
          {WORKERS.map((worker) => {
            const Icon = worker.icon;
            const isSelected = selectedWorker === worker.id;
            const isHovered = hoveredWorker === worker.id;

            return (
              <button
                key={worker.id}
                onClick={() => setSelectedWorker(worker.id)}
                onMouseEnter={() => setHoveredWorker(worker.id)}
                onMouseLeave={() => setHoveredWorker(null)}
                className={cn(
                  'flex gap-4 p-4 border-2 rounded-lg text-left transition-all',
                  'hover:shadow-md hover:border-primary',
                  isSelected && 'border-primary bg-primary/5 shadow-md',
                  !isSelected && 'border-border'
                )}
              >
                <div className="flex-shrink-0">
                  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', worker.bgColor)}>
                    <Icon className={cn('h-6 w-6', worker.color)} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{worker.name}</h3>
                    {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isHovered || isSelected ? worker.expandedDescription : worker.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={!selectedWorker}>
            Next: Configure Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
