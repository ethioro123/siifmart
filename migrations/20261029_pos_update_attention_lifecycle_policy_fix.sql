-- Explicit outer references: products also has a product_id column.
BEGIN;
ALTER POLICY pos_catalog_reads_insert ON public.pos_catalog_update_reads
 WITH CHECK (reviewer_id=(SELECT auth.uid()) AND public.is_site_in_my_authorized_scope(site_id::text,country_code)
 AND pos_catalog_update_reads.read_through <= now() AND EXISTS (
  SELECT 1 FROM public.products p JOIN public.sites s ON s.id=p.site_id
  WHERE p.id=pos_catalog_update_reads.product_id AND p.site_id=pos_catalog_update_reads.site_id AND upper(s.country)=pos_catalog_update_reads.country_code
  AND pos_catalog_update_reads.read_through <= CASE pos_catalog_update_reads.kind WHEN 'new' THEN p.created_at ELSE p.updated_at END));
ALTER POLICY pos_catalog_reads_update ON public.pos_catalog_update_reads
 WITH CHECK (reviewer_id=(SELECT auth.uid()) AND public.is_site_in_my_authorized_scope(site_id::text,country_code)
 AND pos_catalog_update_reads.read_through <= now() AND EXISTS (
  SELECT 1 FROM public.products p JOIN public.sites s ON s.id=p.site_id
  WHERE p.id=pos_catalog_update_reads.product_id AND p.site_id=pos_catalog_update_reads.site_id AND upper(s.country)=pos_catalog_update_reads.country_code
  AND pos_catalog_update_reads.read_through <= CASE pos_catalog_update_reads.kind WHEN 'new' THEN p.created_at ELSE p.updated_at END));
COMMIT;
