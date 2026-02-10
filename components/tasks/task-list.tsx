'use client';

import { Task } from '@/lib/supabase/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Clock, CheckCircle2, AlertCircle, MoreVertical, Eye, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface TaskListProps {
  tasks: Task[];
  selectedTaskId?: string;
  onSelectTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  QUEUED: 'bg-blue-100 text-blue-800',
  RUNNING: 'bg-blue-100 text-blue-800',
  REVIEW_REQUIRED: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};

const statusIcons = {
  DRAFT: FileText,
  QUEUED: Clock,
  RUNNING: Clock,
  REVIEW_REQUIRED: AlertCircle,
  COMPLETED: CheckCircle2,
  FAILED: AlertCircle,
  ARCHIVED: FileText,
};

export function TaskList({ tasks, selectedTaskId, onSelectTask, onDeleteTask }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No tasks yet. Create your first task to get started.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        {tasks.map((task) => {
          const StatusIcon = statusIcons[task.status];
          const isSelected = task.id === selectedTaskId;

          return (
            <div
              key={task.id}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-colors relative group',
                isSelected
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                  : 'bg-card hover:bg-accent border-border'
              )}
            >
              <button
                onClick={() => onSelectTask(task.id)}
                className="w-full text-left"
              >
                <div className="flex items-start gap-3">
                  <StatusIcon className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0 pr-8">
                    <h4 className="font-medium text-sm mb-1 truncate">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge
                        variant="outline"
                        className={cn('text-xs', statusColors[task.status])}
                      >
                        {task.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.jurisdiction.country}
                        {task.jurisdiction.state && ` - ${task.jurisdiction.state}`}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(task.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </button>

              <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-accent"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectTask(task.id);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {onDeleteTask && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteTask(task.id);
                        }}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
