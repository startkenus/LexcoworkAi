"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  FileText,
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { Vendor, VendorAgreement } from '@/lib/supabase/types';

export default function VendorProfilePage() {
  const params = useParams();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendorData();
  }, [vendorId]);

  async function loadVendorData() {
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (vendorError) throw vendorError;
      setVendor(vendorData);

      const { data: agreementsData, error: agreementsError } = await supabase
        .from('vendor_agreements')
        .select(`
          *,
          documents (
            id,
            title,
            doc_type,
            created_at
          )
        `)
        .eq('vendor_id', vendorId);

      if (agreementsError) throw agreementsError;
      setAgreements(agreementsData || []);
    } catch (error) {
      console.error('Error loading vendor:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'expired':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Vendor not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeAgreements = agreements.filter(a => a.status === 'active');
  const expiredAgreements = agreements.filter(a => a.status === 'expired');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{vendor.name}</h1>
            {vendor.legal_name && vendor.legal_name !== vendor.name && (
              <p className="text-muted-foreground">{vendor.legal_name}</p>
            )}
          </div>
        </div>
        <Badge variant={getRiskColor(vendor.risk_profile)} className="text-sm">
          {vendor.risk_profile.toUpperCase()} RISK
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Active Agreements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeAgreements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Agreements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agreements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {expiredAgreements.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agreements">
            Agreements ({agreements.length})
          </TabsTrigger>
          <TabsTrigger value="terms">Key Terms</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vendor.contact_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.contact_email}</span>
                </div>
              )}
              {vendor.contact_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.contact_phone}</span>
                </div>
              )}
              {vendor.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.address}</span>
                </div>
              )}
              {vendor.jurisdiction && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{vendor.jurisdiction}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {vendor.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{vendor.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="agreements" className="space-y-4">
          {agreements.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No agreements found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {agreements.map((agreement) => (
                <Card key={agreement.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-semibold">
                              {agreement.documents?.title || 'Untitled'}
                            </h3>
                            {agreement.agreement_type && (
                              <p className="text-sm text-muted-foreground">
                                {agreement.agreement_type}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 ml-8 text-sm text-muted-foreground">
                          {agreement.signed_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Signed:{' '}
                                {new Date(
                                  agreement.signed_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {agreement.expiry_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Expires:{' '}
                                {new Date(
                                  agreement.expiry_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={getStatusColor(agreement.status)}>
                        {agreement.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="terms">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                Key terms analysis coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
