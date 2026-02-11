/*
  # LexCoworkAI v3.1 Feature Additions

  ## Overview
  Adds critical features for Cowork parity:
  - Risk Assessment with scoring
  - Vendor Intelligence tracking
  - Meeting Briefing system
  - Response Templates
  - Command History analytics

  ## New Tables
  1. risk_assessments - Risk scoring and assessment tracking
  2. vendors - Counterparty/vendor entity management
  3. vendor_agreements - Links vendors to documents
  4. vendor_key_terms - Extracted terms from agreements
  5. briefings - Meeting preparation summaries
  6. response_templates - Pre-approved response templates
  7. command_history - Command usage analytics

  ## Security
  All tables have RLS enabled with tenant-scoped policies
*/

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Risk Assessments Table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  document_id UUID,
  risk_score INTEGER CHECK (risk_score BETWEEN 1 AND 10),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_factors JSONB DEFAULT '[]'::jsonb,
  mitigations JSONB DEFAULT '[]'::jsonb,
  assessed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  escalated BOOLEAN DEFAULT FALSE,
  escalated_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  escalated_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  aliases TEXT[] DEFAULT ARRAY[]::TEXT[],
  jurisdiction TEXT,
  risk_profile TEXT CHECK (risk_profile IN ('low', 'medium', 'high', 'unknown')) DEFAULT 'unknown',
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  notes TEXT,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor Agreements Junction Table
CREATE TABLE IF NOT EXISTS vendor_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  document_id UUID NOT NULL,
  agreement_type TEXT,
  signed_date DATE,
  expiry_date DATE,
  status TEXT CHECK (status IN ('draft', 'pending', 'active', 'expired', 'terminated')) DEFAULT 'draft',
  renewal_terms TEXT,
  value_amount DECIMAL(15, 2),
  value_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor Key Terms Table
CREATE TABLE IF NOT EXISTS vendor_key_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_agreement_id UUID REFERENCES vendor_agreements(id) ON DELETE CASCADE NOT NULL,
  term_type TEXT NOT NULL,
  term_value TEXT NOT NULL,
  term_section TEXT,
  is_standard BOOLEAN DEFAULT FALSE,
  is_negotiated BOOLEAN DEFAULT FALSE,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Briefings Table
CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  meeting_date DATE,
  meeting_time TIME,
  attendees TEXT[],
  content JSONB DEFAULT '{}'::jsonb,
  document_ids UUID[] DEFAULT ARRAY[]::UUID[],
  task_ids UUID[] DEFAULT ARRAY[]::UUID[],
  status TEXT CHECK (status IN ('draft', 'final', 'archived')) DEFAULT 'draft',
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Response Templates Table
CREATE TABLE IF NOT EXISTS response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  jurisdiction TEXT,
  tone TEXT CHECK (tone IN ('formal', 'internal', 'friendly')) DEFAULT 'formal',
  status TEXT CHECK (status IN ('draft', 'approved', 'archived')) DEFAULT 'draft',
  variables JSONB DEFAULT '[]'::jsonb,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Command History Table
CREATE TABLE IF NOT EXISTS command_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  command TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  worker_id TEXT,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  execution_time_ms INTEGER,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_risk_assessments_document ON risk_assessments(document_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk_level ON risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_task ON risk_assessments(task_id);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_agreements_vendor ON vendor_agreements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_agreements_status ON vendor_agreements(status);
CREATE INDEX IF NOT EXISTS idx_vendor_agreements_expiry ON vendor_agreements(expiry_date);
CREATE INDEX IF NOT EXISTS idx_vendor_key_terms_agreement ON vendor_key_terms(vendor_agreement_id);
CREATE INDEX IF NOT EXISTS idx_vendor_key_terms_type ON vendor_key_terms(term_type);
CREATE INDEX IF NOT EXISTS idx_briefings_user ON briefings(user_id);
CREATE INDEX IF NOT EXISTS idx_briefings_meeting_date ON briefings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_response_templates_category ON response_templates(category);
CREATE INDEX IF NOT EXISTS idx_response_templates_status ON response_templates(status);
CREATE INDEX IF NOT EXISTS idx_command_history_user ON command_history(user_id);
CREATE INDEX IF NOT EXISTS idx_command_history_executed ON command_history(executed_at DESC);

-- Enable RLS
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_key_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for risk_assessments
DROP POLICY IF EXISTS "Users can view risk assessments in their tenant" ON risk_assessments;
CREATE POLICY "Users can view risk assessments in their tenant"
  ON risk_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.tenant_id = p2.tenant_id
      WHERE p1.user_id = auth.uid()
      AND p2.id = risk_assessments.assessed_by
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Users can create risk assessments" ON risk_assessments;
CREATE POLICY "Users can create risk assessments"
  ON risk_assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = risk_assessments.assessed_by
      AND profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own risk assessments" ON risk_assessments;
CREATE POLICY "Users can update their own risk assessments"
  ON risk_assessments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = risk_assessments.assessed_by
      AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = risk_assessments.assessed_by
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for vendors
DROP POLICY IF EXISTS "Users can view vendors in their tenant" ON vendors;
CREATE POLICY "Users can view vendors in their tenant"
  ON vendors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = vendors.tenant_id
    )
  );

DROP POLICY IF EXISTS "Users can create vendors in their tenant" ON vendors;
CREATE POLICY "Users can create vendors in their tenant"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = vendors.tenant_id
    )
  );

DROP POLICY IF EXISTS "Users can update vendors in their tenant" ON vendors;
CREATE POLICY "Users can update vendors in their tenant"
  ON vendors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = vendors.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = vendors.tenant_id
    )
  );

-- RLS Policies for vendor_agreements
DROP POLICY IF EXISTS "Users can view vendor agreements in their tenant" ON vendor_agreements;
CREATE POLICY "Users can view vendor agreements in their tenant"
  ON vendor_agreements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN profiles ON profiles.tenant_id = vendors.tenant_id
      WHERE vendors.id = vendor_agreements.vendor_id
      AND profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create vendor agreements in their tenant" ON vendor_agreements;
CREATE POLICY "Users can create vendor agreements in their tenant"
  ON vendor_agreements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN profiles ON profiles.tenant_id = vendors.tenant_id
      WHERE vendors.id = vendor_agreements.vendor_id
      AND profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update vendor agreements in their tenant" ON vendor_agreements;
CREATE POLICY "Users can update vendor agreements in their tenant"
  ON vendor_agreements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN profiles ON profiles.tenant_id = vendors.tenant_id
      WHERE vendors.id = vendor_agreements.vendor_id
      AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      JOIN profiles ON profiles.tenant_id = vendors.tenant_id
      WHERE vendors.id = vendor_agreements.vendor_id
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for vendor_key_terms
DROP POLICY IF EXISTS "Users can view vendor key terms in their tenant" ON vendor_key_terms;
CREATE POLICY "Users can view vendor key terms in their tenant"
  ON vendor_key_terms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendor_agreements
      JOIN vendors ON vendors.id = vendor_agreements.vendor_id
      JOIN profiles ON profiles.tenant_id = vendors.tenant_id
      WHERE vendor_agreements.id = vendor_key_terms.vendor_agreement_id
      AND profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create vendor key terms" ON vendor_key_terms;
CREATE POLICY "Users can create vendor key terms"
  ON vendor_key_terms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendor_agreements
      JOIN vendors ON vendors.id = vendor_agreements.vendor_id
      JOIN profiles ON profiles.tenant_id = vendors.tenant_id
      WHERE vendor_agreements.id = vendor_key_terms.vendor_agreement_id
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for briefings
DROP POLICY IF EXISTS "Users can view their own briefings" ON briefings;
CREATE POLICY "Users can view their own briefings"
  ON briefings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = briefings.user_id
      AND profiles.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = briefings.tenant_id
      AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Users can create briefings in their tenant" ON briefings;
CREATE POLICY "Users can create briefings in their tenant"
  ON briefings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = briefings.user_id
      AND profiles.user_id = auth.uid()
      AND profiles.tenant_id = briefings.tenant_id
    )
  );

DROP POLICY IF EXISTS "Users can update their own briefings" ON briefings;
CREATE POLICY "Users can update their own briefings"
  ON briefings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = briefings.user_id
      AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = briefings.user_id
      AND profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own briefings" ON briefings;
CREATE POLICY "Users can delete their own briefings"
  ON briefings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = briefings.user_id
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for response_templates
DROP POLICY IF EXISTS "Users can view approved templates in their tenant" ON response_templates;
CREATE POLICY "Users can view approved templates in their tenant"
  ON response_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = response_templates.tenant_id
    )
    AND (
      status = 'approved'
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = response_templates.created_by
        AND profiles.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can create templates in their tenant" ON response_templates;
CREATE POLICY "Users can create templates in their tenant"
  ON response_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = response_templates.created_by
      AND profiles.user_id = auth.uid()
      AND profiles.tenant_id = response_templates.tenant_id
    )
  );

DROP POLICY IF EXISTS "Admins can update templates in their tenant" ON response_templates;
CREATE POLICY "Admins can update templates in their tenant"
  ON response_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = response_templates.tenant_id
      AND (
        profiles.role = 'super_admin'
        OR profiles.id = response_templates.created_by
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = response_templates.tenant_id
      AND (
        profiles.role = 'super_admin'
        OR profiles.id = response_templates.created_by
      )
    )
  );

-- RLS Policies for command_history
DROP POLICY IF EXISTS "Users can view their own command history" ON command_history;
CREATE POLICY "Users can view their own command history"
  ON command_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = command_history.user_id
      AND profiles.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.tenant_id = command_history.tenant_id
      AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Users can create command history" ON command_history;
CREATE POLICY "Users can create command history"
  ON command_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = command_history.user_id
      AND profiles.user_id = auth.uid()
      AND profiles.tenant_id = command_history.tenant_id
    )
  );

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_risk_assessments_updated_at') THEN
    CREATE TRIGGER update_risk_assessments_updated_at
      BEFORE UPDATE ON risk_assessments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vendors_updated_at') THEN
    CREATE TRIGGER update_vendors_updated_at
      BEFORE UPDATE ON vendors
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vendor_agreements_updated_at') THEN
    CREATE TRIGGER update_vendor_agreements_updated_at
      BEFORE UPDATE ON vendor_agreements
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_briefings_updated_at') THEN
    CREATE TRIGGER update_briefings_updated_at
      BEFORE UPDATE ON briefings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_response_templates_updated_at') THEN
    CREATE TRIGGER update_response_templates_updated_at
      BEFORE UPDATE ON response_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;