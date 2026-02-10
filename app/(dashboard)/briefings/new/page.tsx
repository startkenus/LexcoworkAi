"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileCheck, Loader2 } from 'lucide-react';

export default function NewBriefingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    meeting_date: '',
    meeting_time: '',
    attendees: '',
    focus_areas: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const attendeesArray = formData.attendees.split(',').map(a => a.trim()).filter(Boolean);
      const focusAreasArray = formData.focus_areas.split(',').map(a => a.trim()).filter(Boolean);

      router.push('/briefings');
    } catch (error) {
      console.error('Error creating briefing:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Briefing</h1>
        <p className="text-muted-foreground">
          Prepare a briefing for your next legal meeting
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Briefing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Q2 Vendor Contract Review"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meeting_date">Meeting Date</Label>
                <Input
                  id="meeting_date"
                  type="date"
                  value={formData.meeting_date}
                  onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting_time">Meeting Time</Label>
                <Input
                  id="meeting_time"
                  type="time"
                  value={formData.meeting_time}
                  onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendees">Attendees (comma-separated)</Label>
              <Input
                id="attendees"
                placeholder="e.g., John Doe, Jane Smith, Legal Team"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="focus_areas">Focus Areas (comma-separated)</Label>
              <Textarea
                id="focus_areas"
                placeholder="e.g., Contract risks, Compliance issues, Vendor terms"
                value={formData.focus_areas}
                onChange={(e) => setFormData({ ...formData, focus_areas: e.target.value })}
                rows={3}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <FileCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium mb-1">What happens next?</p>
                  <p className="text-muted-foreground">
                    AI will analyze related documents and tasks to generate a comprehensive briefing
                    with key points, risks, and action items for your meeting.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/briefings')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Briefing
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
