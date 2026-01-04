-- Enable RLS on store_points table
ALTER TABLE IF EXISTS public.store_points ENABLE ROW LEVEL SECURITY;

-- Re-create policies to ensure they exist and are correct
DROP POLICY IF EXISTS "Allow authenticated read access to store_points" ON public.store_points;
CREATE POLICY "Allow authenticated read access to store_points" ON public.store_points
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated write access to store_points" ON public.store_points;
CREATE POLICY "Allow authenticated write access to store_points" ON public.store_points
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
