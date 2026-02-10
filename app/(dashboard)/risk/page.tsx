"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Shield, FileWarning } from 'lucide-react';
import { RiskAssessment } from '@/lib/supabase/types';

export default function RiskDashboardPage() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    escalated: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRiskData();
  }, []);

  async function loadRiskData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('risk_assessments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const assessmentsData = data || [];
      setAssessments(assessmentsData);

      setStats({
        total: assessmentsData.length,
        high: assessmentsData.filter(a => a.risk_level === 'high').length,
        medium: assessmentsData.filter(a => a.risk_level === 'medium').length,
        low: assessmentsData.filter(a => a.risk_level === 'low').length,
        escalated: assessmentsData.filter(a => a.escalated).length,
      });
    } catch (error) {
      console.error('Error loading risk data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Risk Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage legal risk assessments
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assessments
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.high}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.medium}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Escalated</CardTitle>
            <FileWarning className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.escalated}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Risk Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading assessments...
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No risk assessments yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <Card key={assessment.id} className="border-l-4" style={{
                  borderLeftColor: assessment.risk_level === 'high' ? 'hsl(var(--destructive))' :
                                   assessment.risk_level === 'medium' ? 'hsl(var(--warning))' :
                                   'hsl(var(--secondary))'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge variant={getRiskColor(assessment.risk_level)}>
                            {assessment.risk_level.toUpperCase()}
                          </Badge>
                          <span className="font-semibold">
                            Risk Score: {assessment.risk_score}/10
                          </span>
                          {assessment.escalated && (
                            <Badge variant="destructive">ESCALATED</Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div>
                            <div className="text-sm font-medium mb-1">Risk Factors ({assessment.risk_factors.length})</div>
                            <div className="space-y-1">
                              {assessment.risk_factors.slice(0, 3).map((factor, idx) => (
                                <div key={idx} className="text-sm flex items-start gap-2">
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                                    factor.severity === 'HIGH' ? 'bg-destructive/10 text-destructive' :
                                    factor.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-secondary text-secondary-foreground'
                                  }`}>
                                    {factor.severity}
                                  </span>
                                  <span className="flex-1">{factor.factor}: {factor.description}</span>
                                </div>
                              ))}
                              {assessment.risk_factors.length > 3 && (
                                <div className="text-sm text-muted-foreground">
                                  +{assessment.risk_factors.length - 3} more risk factors
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-medium mb-1">Recommended Mitigations ({assessment.mitigations.length})</div>
                            <div className="space-y-1">
                              {assessment.mitigations.slice(0, 2).map((mitigation, idx) => (
                                <div key={idx} className="text-sm flex items-start gap-2">
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                                    mitigation.priority === 'HIGH' ? 'bg-destructive/10 text-destructive' :
                                    'bg-secondary text-secondary-foreground'
                                  }`}>
                                    {mitigation.priority}
                                  </span>
                                  <span className="flex-1">{mitigation.recommendation}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Assessed on {new Date(assessment.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
