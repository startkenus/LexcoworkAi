'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { TaskList } from '@/components/tasks/task-list';
import { TaskDetails } from '@/components/tasks/task-details';
import { EnhancedTaskCreator } from '@/components/tasks/enhanced-task-creator';
import { DocumentCard } from '@/components/documents/document-card';
import { EditDocumentDialog } from '@/components/documents/edit-document-dialog';
import { ShareDocumentDialog } from '@/components/documents/share-document-dialog';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Task, TaskStep, Citation } from '@/lib/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle2, AlertCircle, Play, Loader2, Building2, FileCheck, Scale, Shield, Search, Inbox, TrendingUp, Users, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { executeTask } from '@/lib/services/task-executor';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskSteps, setTaskSteps] = useState<TaskStep[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/login');
    }
  }, [authLoading, profile, router]);

  useEffect(() => {
    if (profile?.tenant_id) {
      loadTasks();
    }
  }, [profile?.tenant_id]);

  useEffect(() => {
    if (selectedTaskId) {
      loadTaskDetails(selectedTaskId);
    }
  }, [selectedTaskId]);

  const loadTasks = async () => {
    if (!profile?.tenant_id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tasksData = (data || []) as Task[];
      setTasks(tasksData);

      if (tasksData.length > 0 && !selectedTaskId) {
        setSelectedTaskId(tasksData[0].id);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskDetails = async (taskId: string) => {
    try {
      const taskRes = await supabase.from('tasks').select('*').eq('id', taskId).single();
      const stepsRes = await supabase.from('task_steps').select('*').eq('task_id', taskId).order('step_number');
      const citationsRes = await supabase.from('citations').select('*').eq('task_id', taskId);

      if (taskRes.data) setSelectedTask(taskRes.data as Task);
      if (stepsRes.data) setTaskSteps(stepsRes.data as TaskStep[]);
      if (citationsRes.data) setCitations(citationsRes.data as Citation[]);
    } catch (error) {
      console.error('Error loading task details:', error);
    }
  };

  const handleExecuteTask = async (taskId: string) => {
    setExecuting(true);
    try {
      const result = await executeTask(taskId);

      if (result.status === 'failed') {
        toast({
          title: 'Execution failed',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Task started',
          description: 'Your task is now being processed',
        });
        await loadTasks();
        if (selectedTaskId) {
          await loadTaskDetails(selectedTaskId);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to execute task',
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedTask) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'COMPLETED' })
        .eq('id', selectedTask.id);

      if (error) throw error;

      toast({
        title: 'Task approved',
        description: 'Task has been marked as completed',
      });

      await loadTasks();
      if (selectedTaskId) {
        await loadTaskDetails(selectedTaskId);
      }
    } catch (error) {
      console.error('Error approving task:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedTask) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'DRAFT' })
        .eq('id', selectedTask.id);

      if (error) throw error;

      toast({
        title: 'Task rejected',
        description: 'Task has been returned to draft status',
      });

      await loadTasks();
      if (selectedTaskId) {
        await loadTaskDetails(selectedTaskId);
      }
    } catch (error) {
      console.error('Error rejecting task:', error);
    }
  };

  const handleEditDocument = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setShowEditDialog(true);
    }
  };

  const handleShareDocument = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSharingTask(task);
      setShowShareDialog(true);
    }
  };

  const handleDeleteDocument = (taskId: string) => {
    setDeletingTaskId(taskId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingTaskId) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', deletingTaskId);

      if (error) throw error;

      toast({
        title: 'Document deleted',
        description: 'The document has been permanently deleted.',
      });

      await loadTasks();
      setShowDeleteDialog(false);
      setDeletingTaskId(null);

      if (selectedTaskId === deletingTaskId) {
        setSelectedTaskId(null);
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error deleting document',
        description: 'Failed to delete the document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveToGoogleDrive = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const content = JSON.stringify(task.output_data, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${task.title.replace(/[^a-z0-9]/gi, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Document downloaded',
        description: 'Document has been downloaded. You can now upload it to Google Drive.',
      });
    } catch (error) {
      console.error('Error saving to Google Drive:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare document for Google Drive.',
        variant: 'destructive',
      });
    }
  };

  const stats = {
    total: tasks.length,
    running: tasks.filter((t) => t.status === 'RUNNING' || t.status === 'QUEUED').length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    review: tasks.filter((t) => t.status === 'REVIEW_REQUIRED').length,
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      taskList={
        <TaskList
          tasks={tasks}
          selectedTaskId={selectedTaskId || undefined}
          onSelectTask={setSelectedTaskId}
          onDeleteTask={handleDeleteDocument}
        />
      }
      rightSidebar={
        selectedTask ? (
          <TaskDetails
            task={selectedTask}
            steps={taskSteps}
            citations={citations}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : undefined
      }
      showRightSidebar={!!selectedTask}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Overview of your legal productivity workspace
            </p>
          </div>
          <div className="flex gap-2">
            <EnhancedTaskCreator onTaskCreated={loadTasks} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.running}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Review Required</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.review}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Workers</CardTitle>
            <CardDescription>
              Click any worker to create a task
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <EnhancedTaskCreator
                onTaskCreated={loadTasks}
                initialTaskType="contract_review"
                triggerButton={
                  <div className="flex gap-4 p-4 border-2 rounded-lg hover:bg-accent hover:border-primary hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Contract Review</h3>
                      <p className="text-sm text-muted-foreground">
                        Analyze contracts against your playbook, flag risks, suggest revisions, and ensure compliance with jurisdiction-specific requirements.
                      </p>
                    </div>
                  </div>
                }
              />

              <EnhancedTaskCreator
                onTaskCreated={loadTasks}
                initialTaskType="policy_drafting"
                triggerButton={
                  <div className="flex gap-4 p-4 border-2 rounded-lg hover:bg-accent hover:border-primary hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900/20 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-800/30 transition-colors">
                        <Scale className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Policy Drafting</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate compliant policies and legal documents tailored to your jurisdiction, industry standards, and company requirements.
                      </p>
                    </div>
                  </div>
                }
              />

              <EnhancedTaskCreator
                onTaskCreated={loadTasks}
                initialTaskType="compliance_check"
                triggerButton={
                  <div className="flex gap-4 p-4 border-2 rounded-lg hover:bg-accent hover:border-primary hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/30 transition-colors">
                        <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Compliance Check</h3>
                      <p className="text-sm text-muted-foreground">
                        Verify agreements, processes, or documents against regulatory requirements and company policies across multiple jurisdictions.
                      </p>
                    </div>
                  </div>
                }
              />

              <EnhancedTaskCreator
                onTaskCreated={loadTasks}
                initialTaskType="legal_research"
                triggerButton={
                  <div className="flex gap-4 p-4 border-2 rounded-lg hover:bg-accent hover:border-primary hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-800/30 transition-colors">
                        <Search className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Legal Research</h3>
                      <p className="text-sm text-muted-foreground">
                        Search case law, statutes, and legal precedents to build research memos with proper citations and jurisdiction-specific insights.
                      </p>
                    </div>
                  </div>
                }
              />

              <EnhancedTaskCreator
                onTaskCreated={loadTasks}
                initialTaskType="intake"
                triggerButton={
                  <div className="flex gap-4 p-4 border-2 rounded-lg hover:bg-accent hover:border-primary hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800/30 transition-colors">
                        <Inbox className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Intake & Issue Spotting</h3>
                      <p className="text-sm text-muted-foreground">
                        Triage incoming legal requests, categorize issues, assess urgency, and route to the appropriate workflow or team member.
                      </p>
                    </div>
                  </div>
                }
              />

              <EnhancedTaskCreator
                onTaskCreated={loadTasks}
                initialTaskType="risk_assessment"
                triggerButton={
                  <div className="flex gap-4 p-4 border-2 rounded-lg hover:bg-accent hover:border-primary hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800/30 transition-colors">
                        <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Risk Assessment</h3>
                      <p className="text-sm text-muted-foreground">
                        Evaluate legal risk on contracts, deals, or requests with risk scoring, mitigation strategies, and escalation recommendations.
                      </p>
                    </div>
                  </div>
                }
              />

              <EnhancedTaskCreator
                onTaskCreated={loadTasks}
                initialTaskType="vendor_intelligence"
                triggerButton={
                  <div className="flex gap-4 p-4 border-2 rounded-lg hover:bg-accent hover:border-primary hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-800/30 transition-colors">
                        <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Vendor Intelligence</h3>
                      <p className="text-sm text-muted-foreground">
                        Search existing agreements with counterparties, compare key terms, track amendment history, and identify relationship patterns.
                      </p>
                    </div>
                  </div>
                }
              />

              <EnhancedTaskCreator
                onTaskCreated={loadTasks}
                initialTaskType="briefing"
                triggerButton={
                  <div className="flex gap-4 p-4 border-2 rounded-lg hover:bg-accent hover:border-primary hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center group-hover:bg-pink-200 dark:group-hover:bg-pink-800/30 transition-colors">
                        <Briefcase className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Meeting Briefing</h3>
                      <p className="text-sm text-muted-foreground">
                        Prepare executive summaries from documents, past meetings, and relevant agreements with action items and discussion points.
                      </p>
                    </div>
                  </div>
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents & Deliverables</CardTitle>
            <CardDescription>
              View, edit, and manage all your created documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.filter(t => t.status === 'COMPLETED' || t.status === 'REVIEW_REQUIRED').length > 0 ? (
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {tasks
                  .filter(t => t.status === 'COMPLETED' || t.status === 'REVIEW_REQUIRED')
                  .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())
                  .map(task => (
                    <DocumentCard
                      key={task.id}
                      task={task}
                      onEdit={handleEditDocument}
                      onShare={handleShareDocument}
                      onDelete={handleDeleteDocument}
                      onSaveToGoogleDrive={handleSaveToGoogleDrive}
                    />
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Create a task using one of the AI workers above. Once completed, your documents will appear here with options to edit, share, and export.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common workflows and shortcuts (Press ⌘K for command palette)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 hover:bg-accent"
                onClick={() => router.push('/dashboard?action=review')}
              >
                <FileText className="h-5 w-5 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Contract Review</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Review against playbook
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 hover:bg-accent"
                onClick={() => router.push('/risk')}
              >
                <AlertCircle className="h-5 w-5 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Risk Assessment</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Assess legal risk
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 hover:bg-accent"
                onClick={() => router.push('/vendors')}
              >
                <Building2 className="h-5 w-5 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Vendor Check</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Check existing agreements
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 hover:bg-accent"
                onClick={() => router.push('/briefings/new')}
              >
                <FileCheck className="h-5 w-5 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Meeting Briefing</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Prep for meeting
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {tasks.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Examples of what LexCowork AI can help you with
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Review a contract against your playbook</p>
                <p className="text-xs text-muted-foreground">
                  Upload a contract and LexCowork will analyze it against your jurisdiction&apos;s requirements and company playbook
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Assess legal risk on an incoming request</p>
                <p className="text-xs text-muted-foreground">
                  Get a risk score with specific risk factors and mitigation strategies
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Check existing agreements with a vendor</p>
                <p className="text-xs text-muted-foreground">
                  View vendor history, key terms across agreements, and identify deviations
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Prep a briefing for your next meeting</p>
                <p className="text-xs text-muted-foreground">
                  Generate executive summary, key points, risks, and action items
                </p>
              </div>
              <div className="pt-4 text-sm text-muted-foreground">
                Click &quot;+ New Task&quot; above or select an AI Worker to get started
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/10">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Disclaimer:</span> All information provided by LexCowork AI is for research and informational purposes only. This system does not provide legal advice. Always consult with a qualified legal professional for specific legal matters.
            </p>
          </CardContent>
        </Card>
      </div>

      <EditDocumentDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        task={editingTask}
        onSave={loadTasks}
      />

      <ShareDocumentDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        task={sharingTask}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
