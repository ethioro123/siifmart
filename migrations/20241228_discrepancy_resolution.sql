-- Migration: Create discrepancy resolution tables
-- Run this in Supabase SQL Editor

-- Table for tracking discrepancy resolutions
CREATE TABLE IF NOT EXISTS discrepancy_resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id TEXT NOT NULL, -- References wms_jobs.id
    line_item_index INTEGER NOT NULL, -- Index of the line item in the transfer
    product_id UUID REFERENCES products(id),
    
    -- Discrepancy details
    expected_qty INTEGER NOT NULL,
    received_qty INTEGER NOT NULL,
    variance INTEGER GENERATED ALWAYS AS (received_qty - expected_qty) STORED,
    discrepancy_type TEXT CHECK (discrepancy_type IN ('shortage', 'overage', 'damaged', 'wrong_item', 'missing')),
    
    -- Resolution
    resolution_type TEXT CHECK (resolution_type IN ('accept', 'investigate', 'claim', 'adjust', 'reject', 'recount', 'dispose', 'replace')),
    resolution_status TEXT DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'in_progress', 'approved', 'rejected', 'closed')),
    resolution_notes TEXT,
    reason_code TEXT,
    
    -- Financial
    estimated_value DECIMAL(10,2),
    claim_amount DECIMAL(10,2),
    
    -- Evidence
    photo_urls TEXT[],
    
    -- Audit trail
    reported_by TEXT,
    resolved_by TEXT,
    approved_by TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    site_id UUID REFERENCES sites(id),
    replacement_job_id TEXT -- References wms_jobs.id for internal replacements
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_discrepancy_transfer ON discrepancy_resolutions(transfer_id);
CREATE INDEX IF NOT EXISTS idx_discrepancy_status ON discrepancy_resolutions(resolution_status);
CREATE INDEX IF NOT EXISTS idx_discrepancy_site ON discrepancy_resolutions(site_id);

-- Table for tracking claims
CREATE TABLE IF NOT EXISTS discrepancy_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resolution_id UUID REFERENCES discrepancy_resolutions(id) ON DELETE CASCADE,
    
    claim_type TEXT CHECK (claim_type IN ('carrier', 'supplier', 'internal')),
    claim_number TEXT UNIQUE,
    claim_status TEXT DEFAULT 'submitted' CHECK (claim_status IN ('submitted', 'under_review', 'approved', 'denied', 'paid')),
    
    claim_amount DECIMAL(10,2) NOT NULL,
    approved_amount DECIMAL(10,2),
    
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    carrier_name TEXT,
    tracking_number TEXT,
    
    documents JSONB,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_claim_resolution ON discrepancy_claims(resolution_id);
CREATE INDEX IF NOT EXISTS idx_claim_status ON discrepancy_claims(claim_status);

-- Enable RLS
ALTER TABLE discrepancy_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discrepancy_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discrepancy_resolutions
CREATE POLICY "Enable read access for authenticated users" ON discrepancy_resolutions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON discrepancy_resolutions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON discrepancy_resolutions
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for discrepancy_claims
CREATE POLICY "Enable read access for authenticated users" ON discrepancy_claims
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON discrepancy_claims
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON discrepancy_claims
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON discrepancy_resolutions TO authenticated;
GRANT ALL ON discrepancy_claims TO authenticated;
