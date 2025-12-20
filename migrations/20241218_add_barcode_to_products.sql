-- ============================================================================
-- SQL Migration: Add Barcode Columns to Products
-- ============================================================================

-- 1. Add barcode column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='barcode') THEN
        ALTER TABLE products ADD COLUMN barcode VARCHAR(100);
    END IF;
END $$;

-- 2. Add barcode_type column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='barcode_type') THEN
        ALTER TABLE products ADD COLUMN barcode_type VARCHAR(50);
    END IF;
END $$;

-- 3. Add index for faster barcode scanning
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

COMMENT ON COLUMN products.barcode IS 'External barcode (EAN-13, UPC, etc.)';
COMMENT ON COLUMN products.barcode_type IS 'Type of barcode symbology';
