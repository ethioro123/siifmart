-- Migration: Allow Decimal Quantities for Weighed Items
-- Description: Converts strict INTEGER columns to NUMERIC(14,4) across all relevant tables
-- to support fractional quantities (e.g., 1.5 KG, 0.75 L) without crashing the POS or WMS.

BEGIN;

-- 1. Products Table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE products 
            ALTER COLUMN stock TYPE NUMERIC(14,4) USING stock::numeric,
            ALTER COLUMN pack_quantity TYPE NUMERIC(14,4) USING pack_quantity::numeric;
    END IF;
END $$;

-- 2. Sale Items Table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sale_items') THEN
        ALTER TABLE sale_items 
            ALTER COLUMN quantity TYPE NUMERIC(14,4) USING quantity::numeric;
    END IF;
END $$;

-- 3. Inventory Transactions Table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_transactions') THEN
        ALTER TABLE inventory_transactions 
            ALTER COLUMN quantity_changed TYPE NUMERIC(14,4) USING quantity_changed::numeric,
            ALTER COLUMN stock_after TYPE NUMERIC(14,4) USING stock_after::numeric;
    END IF;
END $$;

-- 4. Purchase Order Items Table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'po_items') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'po_items' AND column_name = 'quantity') THEN
            ALTER TABLE po_items ALTER COLUMN quantity TYPE NUMERIC(14,4) USING quantity::numeric;
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'po_items' AND column_name = 'received_quantity') THEN
            ALTER TABLE po_items ALTER COLUMN received_quantity TYPE NUMERIC(14,4) USING received_quantity::numeric;
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'po_items' AND column_name = 'quantity_received') THEN
            ALTER TABLE po_items ALTER COLUMN quantity_received TYPE NUMERIC(14,4) USING quantity_received::numeric;
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'po_items' AND column_name = 'pack_quantity') THEN
            ALTER TABLE po_items ALTER COLUMN pack_quantity TYPE NUMERIC(14,4) USING pack_quantity::numeric;
        END IF;
    END IF;
END $$;

-- 5. Transfer Items Table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transfer_items') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'transfer_items' AND column_name = 'quantity') THEN
            ALTER TABLE transfer_items ALTER COLUMN quantity TYPE NUMERIC(14,4) USING quantity::numeric;
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'transfer_items' AND column_name = 'received_qty') THEN
            ALTER TABLE transfer_items ALTER COLUMN received_qty TYPE NUMERIC(14,4) USING received_qty::numeric;
        END IF;
    END IF;
END $$;

-- 6. Waste Records Table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'waste_records') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'waste_records' AND column_name = 'quantity') THEN
            ALTER TABLE waste_records ALTER COLUMN quantity TYPE NUMERIC(14,4) USING quantity::numeric;
        END IF;
    END IF;
END $$;

-- 7. Return Items Table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'return_items') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'return_items' AND column_name = 'quantity') THEN
            ALTER TABLE return_items ALTER COLUMN quantity TYPE NUMERIC(14,4) USING quantity::numeric;
        END IF;
    END IF;
END $$;

-- 8. Stock Counts Table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_counts') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'stock_counts' AND column_name = 'expected_quantity') THEN
            ALTER TABLE stock_counts ALTER COLUMN expected_quantity TYPE NUMERIC(14,4) USING expected_quantity::numeric;
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'stock_counts' AND column_name = 'counted_quantity') THEN
            ALTER TABLE stock_counts ALTER COLUMN counted_quantity TYPE NUMERIC(14,4) USING counted_quantity::numeric;
        END IF;
    END IF;
END $$;

-- 9. WMS Job Line Items
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wms_job_lines') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wms_job_lines' AND column_name = 'expected_qty') THEN
            ALTER TABLE wms_job_lines ALTER COLUMN expected_qty TYPE NUMERIC(14,4) USING expected_qty::numeric;
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'wms_job_lines' AND column_name = 'picked_qty') THEN
            ALTER TABLE wms_job_lines ALTER COLUMN picked_qty TYPE NUMERIC(14,4) USING picked_qty::numeric;
        END IF;
    END IF;
END $$;

-- 10. Stock Movements Table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_movements') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'quantity') THEN
            ALTER TABLE stock_movements ALTER COLUMN quantity TYPE NUMERIC(14,4) USING quantity::numeric;
        END IF;
    END IF;
END $$;

COMMIT;
