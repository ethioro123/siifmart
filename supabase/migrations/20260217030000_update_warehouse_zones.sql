-- Add locking columns to warehouse_zones table

-- Ensure table exists (idempotency check not strictly needed as earlier migrations should create it, but good practice)
CREATE TABLE IF NOT EXISTS public.warehouse_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
    name text NOT NULL,
    zone_type text DEFAULT 'STANDARD',
    picking_priority integer DEFAULT 10,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add is_locked column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_zones' AND column_name = 'is_locked') THEN
        ALTER TABLE public.warehouse_zones ADD COLUMN is_locked boolean DEFAULT false;
    END IF;
END $$;

-- Add lock_reason column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_zones' AND column_name = 'lock_reason') THEN
        ALTER TABLE public.warehouse_zones ADD COLUMN lock_reason text;
    END IF;
END $$;

-- Add locked_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_zones' AND column_name = 'locked_at') THEN
        ALTER TABLE public.warehouse_zones ADD COLUMN locked_at timestamptz;
    END IF;
END $$;

-- Add locked_by column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warehouse_zones' AND column_name = 'locked_by') THEN
        ALTER TABLE public.warehouse_zones ADD COLUMN locked_by uuid REFERENCES auth.users(id);
    END IF;
END $$;
