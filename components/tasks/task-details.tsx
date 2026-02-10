'use client';

import { Task, TaskStep, Citation } from '@/lib/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  BookOpen,
  CheckSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaskDetailsProps {
  task: Task;
  steps?: TaskStep[];
  citations?: Citation[];
  onApprove?: () => void;
  onReject?: () => void;
}

const stepStatusIcons = {
  PENDING: Clock,
  RUNNING: Clock,
  COMPLETED: CheckCircle2,
  FAILED: XCircle,
  SKIPPED: AlertCircle,
};

const stepStatusColors = {
  PENDING: 'text-gray-500',
  RUNNING: 'text-blue-500',
  COMPLETED: 'text-green-500',
  FAILED: 'text-red-500',
  SKIPPED: 'text-yellow-500',
};

export function TaskDetails({
  task,
  steps = [],
  citations = [],
  onApprove,
  onReject,
}: TaskDetailsProps) {
  const requiresReview = task.status === 'REVIEW_REQUIRED';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {task.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {task.jurisdiction.country}
            {task.jurisdiction.state && ` - ${task.jurisdiction.state}`}
          </Badge>
          <Badge variant="outline">{task.status}</Badge>
          {task.assigned_worker && (
            <Badge variant="secondary">{task.assigned_worker}</Badge>
          )}
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">
            Steps ({steps.length})
          </TabsTrigger>
          <TabsTrigger value="sources">
            Sources ({citations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
              </div>
              {task.started_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span>{formatDistanceToNow(new Date(task.started_at), { addSuffix: true })}</span>
                </div>
              )}
              {task.completed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span>{task.priority}</span>
              </div>
            </CardContent>
          </Card>

          {task.output_data && Object.keys(task.output_data).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Output Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  {task.output_data.summary && (
                    <p>{task.output_data.summary}</p>
                  )}
                  {task.output_data.risks && (
                    <div>
                      <p className="font-medium mb-1">Identified Risks:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {task.output_data.risks.map((risk: any, idx: number) => (
                          <li key={idx}>
                            <Badge variant="outline" className="mr-2">
                              {risk.level}
                            </Badge>
                            {risk.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {requiresReview && onApprove && onReject && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/10">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Review Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This task requires your approval before proceeding.
                </p>
                <div className="flex gap-2">
                  <Button onClick={onApprove} size="sm" className="flex-1">
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button onClick={onReject} size="sm" variant="outline" className="flex-1">
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="steps" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {steps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No steps recorded yet
                </p>
              ) : (
                steps.map((step) => {
                  const StatusIcon = stepStatusIcons[step.status];
                  return (
                    <Card key={step.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <StatusIcon className={`h-5 w-5 mt-0.5 ${stepStatusColors[step.status]}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">
                                Step {step.step_number}: {step.worker_name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {step.status}
                              </Badge>
                            </div>
                            {step.error_message && (
                              <p className="text-xs text-red-600 mb-2">
                                {step.error_message}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {citations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sources cited yet
                </p>
              ) : (
                citations.map((citation) => (
                  <Card key={citation.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-4 w-4 mt-0.5 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm mb-2">{citation.citation_text}</p>
                          {citation.relevance_score && (
                            <Badge variant="outline" className="text-xs">
                              Relevance: {(citation.relevance_score * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground italic">
              All outputs are grounded in approved legal sources. This information is for research purposes only and does not constitute legal advice.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
