BEGIN;
CREATE OR REPLACE FUNCTION private.can_upload_employee_avatar(object_name text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE target uuid; actor public.employees%ROWTYPE; target_site public.sites%ROWTYPE; actor_site public.sites%ROWTYPE;
BEGIN
 IF object_name !~ '^profile-photos/[0-9a-fA-F-]{36}/[^/]+$' THEN RETURN false; END IF;
 BEGIN target:=split_part(object_name,'/',2)::uuid; EXCEPTION WHEN invalid_text_representation THEN RETURN false; END;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 IF actor.id IS NULL THEN RETURN false; END IF;
 IF actor.id=target THEN RETURN true; END IF;
 IF actor.role NOT IN ('group_ceo','country_managing_director','country_hr_director','regional_hr_manager','hr_generalist') THEN RETURN false; END IF;
 SELECT s.* INTO target_site FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.id=target;
 SELECT * INTO actor_site FROM public.sites WHERE id=actor.site_id;
 IF target_site.id IS NULL OR actor_site.id IS NULL THEN RETURN false; END IF;
 RETURN (actor.role='group_ceo' OR upper(actor_site.country)=upper(target_site.country))
   AND private.hr_employee_scope(target,target_site.country);
END;
$$;
REVOKE ALL ON FUNCTION private.can_upload_employee_avatar(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.can_upload_employee_avatar(text) TO authenticated;
DROP POLICY IF EXISTS "Auth Avatar Manage v2" ON storage.objects;
DROP POLICY IF EXISTS "Auth Avatar Upload v2" ON storage.objects;
DROP POLICY IF EXISTS "Auth Active Avatar Upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Active Avatar Update" ON storage.objects;
DROP POLICY IF EXISTS "Auth Active Avatar Delete" ON storage.objects;
CREATE POLICY "Scoped employee avatar upload" ON storage.objects FOR INSERT TO authenticated
 WITH CHECK(bucket_id='avatars' AND private.can_upload_employee_avatar(name));
-- Restrictive guards prevent another permissive policy from bypassing scope or retention.
CREATE POLICY avatar_insert_scope_guard ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(bucket_id<>'avatars' OR private.can_upload_employee_avatar(name));
CREATE POLICY avatar_no_overwrite_guard ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(bucket_id<>'avatars') WITH CHECK(bucket_id<>'avatars');
CREATE POLICY avatar_retention_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
 USING(bucket_id<>'avatars');
CREATE POLICY storage_active_write_insert ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK((SELECT private.has_active_operational_employee()));
CREATE POLICY storage_active_write_update ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
 USING((SELECT private.has_active_operational_employee())) WITH CHECK((SELECT private.has_active_operational_employee()));
CREATE POLICY storage_active_write_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
 USING((SELECT private.has_active_operational_employee()));
-- Existing public image URLs remain valid. This bucket is not personnel-document storage.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('avatars','avatars',true,5242880,ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif'])
ON CONFLICT(id) DO UPDATE SET file_size_limit=5242880,allowed_mime_types=EXCLUDED.allowed_mime_types;
COMMIT;
