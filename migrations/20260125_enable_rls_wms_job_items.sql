-- Enable RLS on wms_job_items table
-- This ensures all access goes through defined policies

-- 1. Enable RLS
ALTER TABLE public.wms_job_items ENABLE ROW LEVEL SECURITY;

-- 2. Create permissive policy for authenticated users
-- (Adjust based on your access requirements)
CREATE POLICY "wms_job_items_authenticated_access"
ON public.wms_job_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Optional: Allow read-only access to anon users if needed
-- CREATE POLICY "wms_job_items_anon_read"
-- ON public.wms_job_items
-- FOR SELECT
-- TO anon
-- USING (true);
