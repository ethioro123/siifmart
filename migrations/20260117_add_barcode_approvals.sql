-- Create table for tracking barcode approvals
CREATE TABLE IF NOT EXISTS barcode_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode TEXT NOT NULL,
    image_url TEXT, -- Evidence photo URL
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    
    -- Context
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    
    -- Audit Trail
    created_by UUID, -- Can reference employees(id) or auth.users(id)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT
);

-- Index for fast retrieval by site and status
CREATE INDEX IF NOT EXISTS idx_barcode_approvals_site_status ON barcode_approvals(site_id, status);
CREATE INDEX IF NOT EXISTS idx_barcode_approvals_product ON barcode_approvals(product_id);

-- Comment
COMMENT ON TABLE barcode_approvals IS 'Audit trail for cashier-generated barcode mappings that require manager approval.';
