-- Increase barcode_prefix length to 4 and update constraint
ALTER TABLE public.sites
ALTER COLUMN barcode_prefix TYPE VARCHAR(4);

ALTER TABLE public.sites
DROP CONSTRAINT IF EXISTS check_barcode_prefix_format;

ALTER TABLE public.sites
ADD CONSTRAINT check_barcode_prefix_format 
CHECK (barcode_prefix IS NULL OR barcode_prefix ~ '^\d{4}$');
