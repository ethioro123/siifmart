-- Initialize Storage Buckets and RLS Policies

-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-assets', 'system-assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS policies for 'system-assets' (Drop first if exist)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Manage" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'system-assets');

CREATE POLICY "Auth Upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'system-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Auth Manage" ON storage.objects
    FOR ALL USING (bucket_id = 'system-assets' AND auth.role() = 'authenticated');


-- 3. Set up RLS policies for 'avatars' (Drop first if exist)
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Avatar Upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Avatar Manage" ON storage.objects;

CREATE POLICY "Public Avatar Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Auth Avatar Upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Auth Avatar Manage" ON storage.objects
    FOR ALL USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
