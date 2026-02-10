'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Edit,
  Share2,
  Trash2,
  Download,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Task } from '@/lib/supabase/types';
import { format } from 'date-fns';

interface DocumentCardProps {
  task: Task;
  onEdit: (taskId: string) => void;
  onShare: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onSaveToGoogleDrive: (taskId: string) => void;
}

export function DocumentCard({
  task,
  onEdit,
  onShare,
  onDelete,
  onSaveToGoogleDrive
}: DocumentCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          icon: CheckCircle,
          label: 'Completed',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        };
      case 'REVIEW_REQUIRED':
        return {
          icon: AlertCircle,
          label: 'Review Required',
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
        };
      case 'RUNNING':
        return {
          icon: Clock,
          label: 'Running',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        };
      default:
        return {
          icon: Clock,
          label: status,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        };
    }
  };

  const statusConfig = getStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;

  const getDocumentType = () => {
    if (task.input_data?.taskType) {
      return task.input_data.taskType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
    return 'Document';
  };

  const getDeliverableType = () => {
    if (task.input_data?.deliverableType) {
      return task.input_data.deliverableType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
    return null;
  };

  const hasOutput = task.output_data && Object.keys(task.output_data).length > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-1 truncate">{task.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {task.description || 'No description provided'}
              </CardDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {getDocumentType()}
                </Badge>
                {getDeliverableType() && (
                  <Badge variant="secondary" className="text-xs">
                    {getDeliverableType()}
                  </Badge>
                )}
                <Badge className={`text-xs ${statusConfig.className}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(task.id)} disabled={!hasOutput}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(task.id)} disabled={!hasOutput}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSaveToGoogleDrive(task.id)} disabled={!hasOutput}>
                <Download className="mr-2 h-4 w-4" />
                Save to Google Drive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              Created {format(new Date(task.created_at), 'MMM d, yyyy')}
            </span>
            {task.completed_at && (
              <span>
                Completed {format(new Date(task.completed_at), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          {task.jurisdiction && (
            <Badge variant="outline" className="text-xs">
              {task.jurisdiction.country}
              {task.jurisdiction.state && ` - ${task.jurisdiction.state}`}
            </Badge>
          )}
        </div>

        {!hasOutput && task.status !== 'RUNNING' && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-400">
              No deliverables available yet. Document actions will be enabled once the task completes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
