-- Migration: Create system_config table with all required columns
-- This is the central configuration table for application settings

CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Store Identity
    store_name TEXT DEFAULT 'SIIFMART',
    slogan TEXT DEFAULT 'Your trusted marketplace',
    logo_url TEXT,
    brand_color TEXT DEFAULT '#00ff9d',
    legal_business_name TEXT,
    tax_vat_number TEXT,
    registered_address TEXT,
    support_contact TEXT,
    support_phone TEXT,
    
    -- Localization
    currency TEXT DEFAULT 'ETB',
    timezone TEXT DEFAULT 'Africa/Addis_Ababa',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    number_format TEXT DEFAULT '1,234.56',
    language TEXT DEFAULT 'en',
    
    -- Tax Configuration
    tax_rate NUMERIC(5,2) DEFAULT 15,
    tax_inclusive BOOLEAN DEFAULT true,
    default_vat_rate NUMERIC(5,2) DEFAULT 15,
    withholding_tax NUMERIC(5,2) DEFAULT 2,
    tax_jurisdictions JSONB DEFAULT '[]'::jsonb,
    
    -- Finance Settings
    fiscal_year_start TEXT DEFAULT '2025-01',
    accounting_method TEXT DEFAULT 'accrual',
    max_petty_cash NUMERIC(10,2) DEFAULT 200,
    expense_approval_limit NUMERIC(10,2) DEFAULT 500,
    default_credit_limit NUMERIC(10,2) DEFAULT 1000,
    
    -- Inventory Settings
    low_stock_threshold INTEGER DEFAULT 10,
    fefo_rotation BOOLEAN DEFAULT true,
    bin_scan BOOLEAN DEFAULT false,
    
    -- Feature Flags
    enable_loyalty BOOLEAN DEFAULT false,
    enable_wms BOOLEAN DEFAULT true,
    multi_currency BOOLEAN DEFAULT false,
    require_shift_closure BOOLEAN DEFAULT true,
    
    -- POS Settings
    pos_terminal_id TEXT,
    pos_register_mode TEXT DEFAULT 'open',
    pos_guest_checkout BOOLEAN DEFAULT true,
    pos_block_negative_stock BOOLEAN DEFAULT true,
    pos_digital_receipts BOOLEAN DEFAULT false,
    pos_auto_print BOOLEAN DEFAULT true,
    
    -- POS Receipt Customization
    pos_receipt_logo TEXT,
    pos_receipt_show_logo BOOLEAN DEFAULT true,
    pos_receipt_header TEXT,
    pos_receipt_footer TEXT DEFAULT 'Thank you for shopping with us!',
    pos_receipt_address TEXT,
    pos_receipt_phone TEXT,
    pos_receipt_email TEXT,
    pos_receipt_tax_id TEXT,
    pos_receipt_policy TEXT,
    pos_receipt_social_handle TEXT,
    pos_receipt_enable_qr BOOLEAN DEFAULT false,
    pos_receipt_qr_link TEXT,
    pos_receipt_width TEXT DEFAULT '80mm',
    pos_receipt_font TEXT DEFAULT 'sans-serif',
    
    -- Payment Methods
    payment_cash BOOLEAN DEFAULT true,
    payment_card BOOLEAN DEFAULT true,
    payment_mobile_money BOOLEAN DEFAULT true,
    payment_store_credit BOOLEAN DEFAULT false,
    
    -- Warehouse Settings
    receiving_logic TEXT DEFAULT 'standard',
    qc_sampling_rate NUMERIC(5,2) DEFAULT 10,
    qc_block_on_failure BOOLEAN DEFAULT true,
    putaway_logic TEXT DEFAULT 'directed',
    rotation_policy TEXT DEFAULT 'FIFO',
    require_expiry BOOLEAN DEFAULT false,
    cycle_count_strategy TEXT DEFAULT 'ABC',
    picking_method TEXT DEFAULT 'zone',
    strict_scanning BOOLEAN DEFAULT false,
    reserve_stock_buffer INTEGER DEFAULT 0,
    
    -- Integrations
    webhook_order_created TEXT,
    webhook_inventory_low TEXT,
    webhook_customer_signup TEXT,
    scale_ip_address TEXT,
    scanner_com_port TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT
);

-- Insert default configuration row
INSERT INTO system_config (id, store_name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'SIIFMART')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON system_config
    FOR SELECT TO authenticated USING (true);

-- Policy: Allow authenticated users to update  
CREATE POLICY "Allow authenticated update" ON system_config
    FOR UPDATE TO authenticated USING (true);
