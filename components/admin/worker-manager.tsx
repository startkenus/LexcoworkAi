'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bot, Settings } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WorkerConfig {
  id: string;
  worker_name: string;
  worker_type: string;
  enabled: boolean;
  config: any;
  description: string;
}

export function WorkerManager() {
  const [workers, setWorkers] = useState<WorkerConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkers();
  }, []);

  async function loadWorkers() {
    try {
      const { data, error } = await supabase
        .from('worker_configs')
        .select('*')
        .order('worker_name');

      if (error) throw error;
      setWorkers(data || []);
    } catch (error) {
      console.error('Error loading workers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleWorker(workerId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('worker_configs')
        .update({ enabled: !currentStatus })
        .eq('id', workerId);

      if (error) throw error;

      setWorkers((prev) =>
        prev.map((w) => (w.id === workerId ? { ...w, enabled: !currentStatus } : w))
      );
    } catch (error) {
      console.error('Error toggling worker:', error);
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading workers...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          Worker Management
        </CardTitle>
        <CardDescription>
          Enable/disable workers and configure settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{worker.worker_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {worker.worker_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {worker.description || 'No description available'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={worker.enabled}
                  onCheckedChange={() => toggleWorker(worker.id, worker.enabled)}
                />
                <Badge
                  variant="outline"
                  className={
                    worker.enabled
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-50 text-gray-500'
                  }
                >
                  {worker.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full">
            <Settings className="mr-2 h-4 w-4" />
            Advanced Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
