'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, User, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuditLog {
  id: string;
  task_id?: string;
  user_id?: string;
  action: string;
  details: any;
  created_at: string;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function getActionIcon(action: string) {
    if (action.includes('approved')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (action.includes('rejected')) return <XCircle className="h-4 w-4 text-red-600" />;
    if (action.includes('created')) return <FileText className="h-4 w-4 text-blue-600" />;
    return <Clock className="h-4 w-4 text-gray-600" />;
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading audit logs...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-600" />
          Audit Logs
        </CardTitle>
        <CardDescription>
          Immutable record of all system actions and changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No audit logs found
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-1">{getActionIcon(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {formatTimestamp(log.created_at)}
                      </Badge>
                    </div>
                    {log.user_id && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <User className="h-3 w-3" />
                        <span>User: {log.user_id.substring(0, 8)}...</span>
                      </div>
                    )}
                    {log.task_id && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <FileText className="h-3 w-3" />
                        <span>Task: {log.task_id.substring(0, 8)}...</span>
                      </div>
                    )}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2">
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
