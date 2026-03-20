-- Add barcode_prefix column to sites table
ALTER TABLE public.sites
ADD COLUMN IF NOT EXISTS barcode_prefix VARCHAR(3);

-- Add logic to ensure it is 3 digits if not null (optional check constraint)
ALTER TABLE public.sites
ADD CONSTRAINT check_barcode_prefix_format 
CHECK (barcode_prefix IS NULL OR barcode_prefix ~ '^\d{3}$');
