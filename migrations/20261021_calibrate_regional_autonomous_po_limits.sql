-- Migration: 20261021_calibrate_regional_autonomous_po_limits.sql
-- Calibrates regional autonomous purchase order authorization caps:
-- Adama Oromia (ET-ADA): ETB 150,000 ceiling
-- Mombasa Coastal (KE-MBA): KES 500,000 ceiling

UPDATE public.regions
SET autonomous_po_limit = 150000.00,
    last_change_reason = 'Calibrated autonomous PO authorization cap to ETB 150,000 as per governance policy SOP-MGT-020',
    updated_at = NOW()
WHERE code = 'ET-ADA';

UPDATE public.regions
SET autonomous_po_limit = 500000.00,
    last_change_reason = 'Calibrated autonomous PO authorization cap to KES 500,000 as per governance policy SOP-MGT-020',
    updated_at = NOW()
WHERE code = 'KE-MBA';
