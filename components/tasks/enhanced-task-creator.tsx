'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { WorkerSelectionModal } from './worker-selection-modal';
import { TaskCreator } from './task-creator';

type WorkerType = 'contract_review' | 'policy_drafting' | 'compliance_check' | 'legal_research' | 'intake' | 'risk_assessment' | 'vendor_intelligence' | 'briefing';

interface EnhancedTaskCreatorProps {
  onTaskCreated?: () => void;
  triggerButton?: React.ReactNode;
  initialTaskType?: WorkerType;
}

export function EnhancedTaskCreator({ onTaskCreated, triggerButton, initialTaskType }: EnhancedTaskCreatorProps) {
  const [showWorkerSelection, setShowWorkerSelection] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerType | null>(initialTaskType || null);

  const handleWorkerSelect = (worker: WorkerType) => {
    setSelectedWorker(worker);
    setShowWorkerSelection(false);
    setShowTaskForm(true);
  };

  const handleTaskCreated = () => {
    setShowTaskForm(false);
    setSelectedWorker(null);
    onTaskCreated?.();
  };

  const handleTaskFormClose = () => {
    setShowTaskForm(false);
    setSelectedWorker(null);
  };

  const handleTriggerClick = () => {
    if (initialTaskType) {
      setShowTaskForm(true);
    } else {
      setShowWorkerSelection(true);
    }
  };

  return (
    <>
      {triggerButton ? (
        <div onClick={handleTriggerClick}>
          {triggerButton}
        </div>
      ) : (
        <Button onClick={handleTriggerClick}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      )}

      <WorkerSelectionModal
        open={showWorkerSelection}
        onOpenChange={setShowWorkerSelection}
        onSelect={handleWorkerSelect}
      />

      {selectedWorker && (
        <TaskCreator
          open={showTaskForm}
          onOpenChange={handleTaskFormClose}
          initialTaskType={selectedWorker}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </>
  );
}
