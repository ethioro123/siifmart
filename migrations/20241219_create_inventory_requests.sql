-- Create inventory_requests table
CREATE TABLE IF NOT EXISTS inventory_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES sites(id),
    product_id UUID REFERENCES products(id), -- Null for 'create' requests
    product_name VARCHAR(255),
    product_sku VARCHAR(100),
    change_type VARCHAR(20) CHECK (change_type IN ('create', 'edit', 'delete', 'stock_adjustment')),
    requested_by VARCHAR(255),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    proposed_changes JSONB, -- For 'create' and 'edit'
    adjustment_type VARCHAR(10), -- For 'stock_adjustment'
    adjustment_qty INT, -- For 'stock_adjustment'
    adjustment_reason TEXT, -- For 'stock_adjustment'
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    rejected_by VARCHAR(255),
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to products table if they don't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
