-- Migration: Add barcode fields to products table
-- This adds support for storing exact supplier/manufacturer barcodes separately from internal SKUs

-- Add barcode column (stores the actual barcode value, e.g., EAN-13, UPC)
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Add barcode_type column (identifies the barcode standard)
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode_type TEXT CHECK (barcode_type IN ('EAN-13', 'UPC-A', 'CODE128', 'CODE39', 'QR', 'OTHER'));

-- Create index on barcode for fast lookups during scanning
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Comment explaining the fields
COMMENT ON COLUMN products.barcode IS 'External barcode from supplier/manufacturer (EAN-13, UPC, etc.)';
COMMENT ON COLUMN products.barcode_type IS 'Type of barcode standard (EAN-13, UPC-A, CODE128, CODE39, QR, OTHER)';
