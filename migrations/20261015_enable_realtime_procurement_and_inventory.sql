-- Migration: 20261015_enable_realtime_procurement_and_inventory.sql
-- Purpose: Enable Supabase Realtime CDC publication and FULL replica identity for procurement, sales, stock movements, inventory requests, and barcode approvals
-- Impact: Allows live bidirectional sync between Procurement and Receive/Docks, and across all fulfillment tabs (Pick, Pack, Replenish, Count, Waste, Returns, Labels) without page refreshes

DO $$
BEGIN
    -- 1. purchase_orders (Procurement <-> Receive/Docks synchronization)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'purchase_orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE purchase_orders;
    END IF;

    -- 2. inventory_requests (Stock adjustments, Count variances, Waste, and Returns approvals)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'inventory_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE inventory_requests;
    END IF;

    -- 3. stock_movements (Replenishment, Putaway, Picking stock updates)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'stock_movements'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE stock_movements;
    END IF;

    -- 4. barcode_approvals (Barcode audits and Labels verification)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'barcode_approvals'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE barcode_approvals;
    END IF;

    -- 5. sales (POS checkout sales triggering outbound fulfillment)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'sales'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE sales;
    END IF;
END $$;

-- Enable REPLICA IDENTITY FULL so all row columns are available in UPDATE/DELETE events
ALTER TABLE purchase_orders REPLICA IDENTITY FULL;
ALTER TABLE inventory_requests REPLICA IDENTITY FULL;
ALTER TABLE stock_movements REPLICA IDENTITY FULL;
ALTER TABLE barcode_approvals REPLICA IDENTITY FULL;
ALTER TABLE sales REPLICA IDENTITY FULL;
