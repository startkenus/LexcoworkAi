'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, FileText, Check, X, Upload } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RAGSource {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  jurisdiction_country: string;
  jurisdiction_state?: string;
  description?: string;
  uploaded_at: string;
}

export function RAGSourceManager() {
  const [sources, setSources] = useState<RAGSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    loadSources();
  }, [filter]);

  async function loadSources() {
    try {
      let query = supabase.from('rag_sources').select('*').order('uploaded_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error loading RAG sources:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateSourceStatus(sourceId: string, status: 'approved' | 'rejected') {
    try {
      const { error } = await supabase
        .from('rag_sources')
        .update({ status })
        .eq('id', sourceId);

      if (error) throw error;

      setSources((prev) =>
        prev.map((s) => (s.id === sourceId ? { ...s, status } : s))
      );
    } catch (error) {
      console.error('Error updating source status:', error);
    }
  }

  const stats = {
    total: sources.length,
    approved: sources.filter((s) => s.status === 'approved').length,
    pending: sources.filter((s) => s.status === 'pending').length,
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading RAG sources...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-600" />
          RAG Source Management
        </CardTitle>
        <CardDescription>
          Upload, approve, and revoke knowledge sources for legal grounding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant={filter === 'all' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter('all')}>
                All ({stats.total})
              </Badge>
              <Badge variant={filter === 'approved' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter('approved')}>
                Approved ({stats.approved})
              </Badge>
              <Badge variant={filter === 'pending' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter('pending')}>
                Pending ({stats.pending})
              </Badge>
            </div>
            <Button size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Upload Source
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No sources found
                    </TableCell>
                  </TableRow>
                ) : (
                  sources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {source.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{source.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {source.jurisdiction_country}
                        {source.jurisdiction_state && `, ${source.jurisdiction_state}`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            source.status === 'approved'
                              ? 'bg-green-50 text-green-700'
                              : source.status === 'pending'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-red-50 text-red-700'
                          }
                        >
                          {source.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {source.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateSourceStatus(source.id, 'approved')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateSourceStatus(source.id, 'rejected')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
