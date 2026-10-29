-- Per-employee catalog read receipts; price acknowledgements remain independent.
BEGIN;
CREATE TABLE public.pos_catalog_update_reads (
 reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
 country_code text NOT NULL CHECK (country_code = upper(country_code)),
 product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK (kind IN ('new','updated')),
 read_through timestamptz NOT NULL,
 PRIMARY KEY (reviewer_id,site_id,country_code,product_id,kind)
);
CREATE INDEX pos_catalog_reads_product_idx ON public.pos_catalog_update_reads(product_id);
CREATE INDEX pos_catalog_reads_site_idx ON public.pos_catalog_update_reads(site_id,country_code,reviewer_id);
ALTER TABLE public.pos_catalog_update_reads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pos_catalog_update_reads FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.pos_catalog_update_reads TO authenticated;
CREATE POLICY pos_catalog_reads_own ON public.pos_catalog_update_reads FOR SELECT TO authenticated
 USING (reviewer_id=(SELECT auth.uid()) AND public.is_site_in_my_authorized_scope(site_id::text,country_code));
CREATE POLICY pos_catalog_reads_insert ON public.pos_catalog_update_reads FOR INSERT TO authenticated
 WITH CHECK (reviewer_id=(SELECT auth.uid()) AND public.is_site_in_my_authorized_scope(site_id::text,country_code)
 AND read_through <= now() AND EXISTS (
  SELECT 1 FROM public.products p JOIN public.sites s ON s.id=p.site_id
  WHERE p.id=product_id AND p.site_id=pos_catalog_update_reads.site_id AND upper(s.country)=country_code
  AND read_through <= CASE kind WHEN 'new' THEN p.created_at ELSE p.updated_at END));
CREATE POLICY pos_catalog_reads_update ON public.pos_catalog_update_reads FOR UPDATE TO authenticated
 USING (reviewer_id=(SELECT auth.uid()) AND public.is_site_in_my_authorized_scope(site_id::text,country_code))
 WITH CHECK (reviewer_id=(SELECT auth.uid()) AND public.is_site_in_my_authorized_scope(site_id::text,country_code)
 AND read_through <= now() AND EXISTS (
  SELECT 1 FROM public.products p JOIN public.sites s ON s.id=p.site_id
  WHERE p.id=product_id AND p.site_id=pos_catalog_update_reads.site_id AND upper(s.country)=country_code
  AND read_through <= CASE kind WHEN 'new' THEN p.created_at ELSE p.updated_at END));

CREATE FUNCTION public.mark_pos_catalog_updates_read(p_site_id uuid,p_country_code text,p_updates jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE item jsonb; observed timestamptz; recorded timestamptz; total integer:=0;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_site_in_my_authorized_scope(p_site_id::text,p_country_code) THEN
  RAISE EXCEPTION 'Catalog read scope denied' USING ERRCODE='42501';
 END IF;
 IF jsonb_typeof(p_updates) IS DISTINCT FROM 'array' OR jsonb_array_length(p_updates) NOT BETWEEN 1 AND 50 THEN
  RAISE EXCEPTION 'One to fifty observed updates are required';
 END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_updates) LOOP
  IF item->>'kind' IS NULL OR item->>'kind' NOT IN ('new','updated') THEN RAISE EXCEPTION 'Invalid catalog update kind'; END IF;
  observed:=(item->>'changed_at')::timestamptz;
  SELECT CASE item->>'kind' WHEN 'new' THEN p.created_at ELSE p.updated_at END INTO recorded
  FROM public.products p JOIN public.sites s ON s.id=p.site_id
  WHERE p.id=(item->>'product_id')::uuid AND p.site_id=p_site_id AND upper(s.country)=upper(p_country_code);
  IF observed IS NULL OR recorded IS NULL OR observed>recorded OR observed>now() THEN
   RAISE EXCEPTION 'Catalog update is unavailable or its timestamp is invalid';
  END IF;
  INSERT INTO public.pos_catalog_update_reads(reviewer_id,site_id,country_code,product_id,kind,read_through)
  VALUES(auth.uid(),p_site_id,upper(p_country_code),(item->>'product_id')::uuid,item->>'kind',observed)
  ON CONFLICT(reviewer_id,site_id,country_code,product_id,kind) DO UPDATE
   SET read_through=greatest(public.pos_catalog_update_reads.read_through,EXCLUDED.read_through);
  total:=total+1;
 END LOOP;
 RETURN total;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_pos_catalog_updates_read(uuid,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mark_pos_catalog_updates_read(uuid,text,jsonb) TO authenticated;

-- Keep the legacy second parameter for older clients; attention never expires by age.
CREATE OR REPLACE FUNCTION public.count_unreviewed_product_price_history(p_site_id uuid,p_since timestamptz DEFAULT NULL)
RETURNS bigint LANGUAGE sql STABLE SECURITY INVOKER SET search_path='public','pg_temp' AS $$
 SELECT count(*)::bigint FROM public.product_price_history h
 WHERE h.site_id=p_site_id AND auth.uid() IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.product_price_history_reviews r WHERE r.history_id=h.id AND r.reviewer_id=auth.uid());
$$;
REVOKE ALL ON FUNCTION public.count_unreviewed_product_price_history(uuid,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.count_unreviewed_product_price_history(uuid,timestamptz) TO authenticated;
COMMIT;
