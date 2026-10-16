-- Migration: 20261015_enable_realtime_pos_and_shifts.sql
-- Description: Enable Postgres Realtime CDC on shifts, pos_cash_drops, and pos_supervisory_overrides tables with REPLICA IDENTITY FULL for instant bi-directional POS Command Center and POS Terminal synchronization.

-- 1. Ensure REPLICA IDENTITY FULL for shifts, pos_cash_drops, and pos_supervisory_overrides
ALTER TABLE public.shifts REPLICA IDENTITY FULL;
ALTER TABLE public.pos_cash_drops REPLICA IDENTITY FULL;
ALTER TABLE public.pos_supervisory_overrides REPLICA IDENTITY FULL;

-- 2. Add tables to supabase_realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'shifts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'pos_cash_drops'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_cash_drops;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'pos_supervisory_overrides'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_supervisory_overrides;
    END IF;
END $$;
