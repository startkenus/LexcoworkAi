'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle } from 'lucide-react';
import { WorkerManager } from '@/components/admin/worker-manager';
import { RAGSourceManager } from '@/components/admin/rag-source-manager';
import { AuditLogViewer } from '@/components/admin/audit-log-viewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPage() {
  const { profile, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Super Admin Console</h2>
            <p className="text-muted-foreground">
              Platform governance, worker management, and system controls
            </p>
          </div>
        </div>

        <Tabs defaultValue="workers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="rag">RAG Sources</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="jurisdiction">Jurisdictions</TabsTrigger>
          </TabsList>

          <TabsContent value="workers">
            <WorkerManager />
          </TabsContent>

          <TabsContent value="rag">
            <RAGSourceManager />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogViewer />
          </TabsContent>

          <TabsContent value="jurisdiction">
            <Card>
              <CardHeader>
                <CardTitle>Jurisdiction Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">United States</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Federal</Badge>
                      <Badge variant="outline">Texas (TX)</Badge>
                      <Badge variant="outline">California (CA)</Badge>
                      <Badge variant="outline">New York (NY)</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">India</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Central Laws</Badge>
                      <Badge variant="outline">Companies Act</Badge>
                      <Badge variant="outline">IT Act</Badge>
                      <Badge variant="outline">DPDP Act</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-red-200 bg-red-50 dark:bg-red-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Important Security Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-red-800 dark:text-red-300 space-y-2">
              <li>• Super Admin cannot bypass legal guardrails or enable legal advice</li>
              <li>• All worker actions are logged in immutable audit trails</li>
              <li>• RAG sources must be approved before use in production</li>
              <li>• Emergency controls will freeze all write operations system-wide</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
