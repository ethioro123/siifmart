-- =============================================================================
-- FIX: Supabase Storage RLS Policy for Avatars
-- =============================================================================
-- This script ensures the 'avatars' bucket exists and has the correct
-- permissions for HR managers and employees to upload profile photos.
-- =============================================================================

-- 1. Ensure the 'avatars' bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars', 
    'avatars', 
    true, 
    5242880, -- 5MB limit
    '{image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif}'
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = '{image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif}';

-- 2. Enable RLS on storage.objects (it should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Avatar Upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Avatar Manage" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated manages" ON storage.objects;

-- 4. Create NEW robust policies

-- A. Public Access: Everyone can view profile photos
CREATE POLICY "Public Avatar Access" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'avatars');

-- B. Authenticated Upload: Any logged-in user can upload to the avatars bucket
-- We keep this simple to allow HR to upload photos for any employee.
CREATE POLICY "Auth Avatar Upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars');

-- C. Authenticated Manage: Any logged-in user can update or delete from the avatars bucket
-- This is necessary for replacing old photos.
CREATE POLICY "Auth Avatar Manage" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'avatars')
    WITH CHECK (bucket_id = 'avatars');

-- =============================================================================
-- VERIFICATION: Run this to confirm policies are applied
-- =============================================================================
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
-- =============================================================================
