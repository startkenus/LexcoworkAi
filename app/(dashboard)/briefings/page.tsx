"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileCheck, Plus, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Briefing } from '@/lib/supabase/types';

export default function BriefingsPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBriefings();
  }, []);

  async function loadBriefings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('briefings')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBriefings(data || []);
    } catch (error) {
      console.error('Error loading briefings:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meeting Briefings</h1>
          <p className="text-muted-foreground">
            Prepare and manage legal meeting briefings
          </p>
        </div>
        <Link href="/briefings/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Briefing
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading briefings...
        </div>
      ) : briefings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No briefings yet</p>
            <Link href="/briefings/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Briefing
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {briefings.map((briefing) => (
            <Card key={briefing.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <FileCheck className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">{briefing.title}</h3>
                    </div>

                    {briefing.meeting_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-8">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(briefing.meeting_date).toLocaleDateString()}
                          {briefing.meeting_time && ` at ${briefing.meeting_time}`}
                        </span>
                      </div>
                    )}

                    {briefing.attendees.length > 0 && (
                      <div className="text-sm text-muted-foreground ml-8">
                        Attendees: {briefing.attendees.join(', ')}
                      </div>
                    )}

                    {briefing.content.executive_summary && (
                      <p className="text-sm text-muted-foreground ml-8 line-clamp-2">
                        {briefing.content.executive_summary}
                      </p>
                    )}

                    <div className="flex gap-4 text-sm text-muted-foreground ml-8">
                      {briefing.content.key_points && (
                        <span>{briefing.content.key_points.length} key points</span>
                      )}
                      {briefing.content.risks && (
                        <span>{briefing.content.risks.length} risks</span>
                      )}
                      {briefing.content.action_items && (
                        <span>{briefing.content.action_items.length} action items</span>
                      )}
                    </div>
                  </div>

                  <Badge variant={getStatusColor(briefing.status)}>
                    {briefing.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
