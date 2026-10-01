-- Migration: Add packaging and merchandise spec columns to po_items table
-- Guarantees zero data loss for bulk manifest packaging (bales, cases, cartons, units per pack)
-- and updates PO AAAA0142 line items to reflect 12 Bales @ 12 pk/bale = 144 sellable units.

ALTER TABLE public.po_items ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.po_items ADD COLUMN IF NOT EXISTS pack_quantity NUMERIC DEFAULT 1;
ALTER TABLE public.po_items ADD COLUMN IF NOT EXISTS case_size NUMERIC DEFAULT 0;
ALTER TABLE public.po_items ADD COLUMN IF NOT EXISTS package_type TEXT;
ALTER TABLE public.po_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.po_items ADD COLUMN IF NOT EXISTS min_stock NUMERIC DEFAULT 0;
ALTER TABLE public.po_items ADD COLUMN IF NOT EXISTS max_stock NUMERIC DEFAULT 0;
ALTER TABLE public.po_items ADD COLUMN IF NOT EXISTS custom_attributes JSONB;

-- Backfill PO AAAA0142 (Juma Ugali Flour 1kg - 12 Bales @ 12 pk/bale = 144 sellable units)
UPDATE public.po_items
SET 
    sku = 'KE-GR001',
    pack_quantity = 12,
    case_size = 0,
    package_type = 'Bale',
    custom_attributes = '{"packaging": {"packQty": 12, "caseSize": 0, "packageType": "Bale", "unitSize": "1kg"}, "physical": {"netWeight": "1", "sizeType": "kg"}}'::jsonb
WHERE 
    po_id IN (SELECT id FROM public.purchase_orders WHERE po_number = 'AAAA0142')
    AND product_name ILIKE '%Juma Ugali Flour%';
