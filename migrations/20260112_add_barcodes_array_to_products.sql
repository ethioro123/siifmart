-- ============================================================================
-- SQL Migration: Add Barcodes Array Column to Products
-- ============================================================================
-- This migration adds support for multiple barcode aliases per product.
-- The barcodes array allows mapping different supplier/manufacturer barcodes
-- to the same internal SKU.

-- Add barcodes array column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='products' 
        AND column_name='barcodes'
    ) THEN
        ALTER TABLE products ADD COLUMN barcodes TEXT[];
    END IF;
END $$;

-- Add GIN index for efficient array searching
CREATE INDEX IF NOT EXISTS idx_products_barcodes_gin ON products USING GIN(barcodes);

-- Add comment to document the column purpose
COMMENT ON COLUMN products.barcodes IS 'Array of alternative barcodes/aliases for multi-SKU mapping';
