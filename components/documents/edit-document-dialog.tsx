'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Task } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSave: () => void;
}

export function EditDocumentDialog({
  open,
  onOpenChange,
  task,
  onSave
}: EditDocumentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Record<string, any>>({});

  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setContent(task.output_data || {});
    }
  }, [task, open]);

  const handleSave = async () => {
    if (!task) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title,
          output_data: content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: 'Document updated',
        description: 'Your changes have been saved successfully.',
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: 'Error updating document',
        description: 'Failed to save your changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (key: string, value: string) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  if (!task) return null;

  const contentKeys = Object.keys(content).filter(key =>
    typeof content[key] === 'string' || typeof content[key] === 'object'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>
            Make changes to your document. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
            />
          </div>

          <div className="space-y-2">
            <Label>Document Content</Label>
            <Tabs defaultValue={contentKeys[0] || 'content'} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(contentKeys.length, 3)}, 1fr)` }}>
                {contentKeys.slice(0, 3).map(key => (
                  <TabsTrigger key={key} value={key}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollArea className="h-[400px] w-full border rounded-md p-4 mt-2">
                {contentKeys.map(key => (
                  <TabsContent key={key} value={key} className="mt-0">
                    <Textarea
                      value={typeof content[key] === 'string' ? content[key] : JSON.stringify(content[key], null, 2)}
                      onChange={(e) => handleContentChange(key, e.target.value)}
                      className="min-h-[380px] font-mono text-sm"
                      placeholder={`Edit ${key}...`}
                    />
                  </TabsContent>
                ))}
              </ScrollArea>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
