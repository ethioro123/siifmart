-- Migration: 20261015_enable_realtime_warehouse_operations.sql
-- Purpose: Enable Supabase Realtime CDC publication and FULL replica identity for warehouse jobs, assignments, transfers, and products
-- Impact: Allows warehouse operations, job assignments, products, and transfers to stream live updates to worker devices without refreshing

DO $$
BEGIN
    -- 1. wms_jobs
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'wms_jobs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE wms_jobs;
    END IF;

    -- 2. job_assignments
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'job_assignments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE job_assignments;
    END IF;

    -- 3. transfers
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'transfers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE transfers;
    END IF;

    -- 4. products
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE products;
    END IF;
END $$;

-- Enable REPLICA IDENTITY FULL so UPDATE and DELETE events include full row payloads across websockets
ALTER TABLE wms_jobs REPLICA IDENTITY FULL;
ALTER TABLE job_assignments REPLICA IDENTITY FULL;
ALTER TABLE transfers REPLICA IDENTITY FULL;
ALTER TABLE products REPLICA IDENTITY FULL;
