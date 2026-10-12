-- Migration: Add regional tracking and HQ escalation flags to purchase_orders
-- Date: 2026-10-12
-- Rule 9 compliant

ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS region_code TEXT,
ADD COLUMN IF NOT EXISTS requires_hq_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hq_approved_by CHARACTER VARYING,
ADD COLUMN IF NOT EXISTS hq_approved_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for regional procurement filtering and HQ escalation queue
CREATE INDEX IF NOT EXISTS idx_purchase_orders_region_code ON public.purchase_orders (region_code);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_requires_hq ON public.purchase_orders (requires_hq_approval) WHERE requires_hq_approval = TRUE;

-- Backfill existing purchase_orders region_code from sites table
UPDATE public.purchase_orders po
SET region_code = s.region_code
FROM public.sites s
WHERE po.site_id = s.id AND po.region_code IS NULL AND s.region_code IS NOT NULL;
