-- Routing recommends locations; it must never rewrite a confirmed scan or receiving placeholder.
-- No existing product locations or quantities are changed by this migration.
CREATE OR REPLACE FUNCTION public.trg_auto_assign_product_zone()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE matching_zone uuid; matches integer;
BEGIN
 IF NEW.site_id IS NULL OR NEW.location IS NULL
   OR upper(btrim(NEW.location)) !~ '^[A-Z]-[0-9]{2}-[0-9]{2}$'
   OR upper(btrim(NEW.location)) ~ '-00' THEN
  NEW.zone_id:=NULL;
  RETURN NEW;
 END IF;
 SELECT count(*),(array_agg(z.id))[1] INTO matches,matching_zone
 FROM public.warehouse_zones z
 WHERE z.site_id=NEW.site_id
   AND upper(btrim(z.name)) ~ ('^(ZONE[[:space:]]+)?'||left(upper(btrim(NEW.location)),1)||'($|[[:space:]-])');
 -- Never infer an alphabetic zone from category descriptions or another site.
 NEW.zone_id:=CASE WHEN matches=1 THEN matching_zone ELSE NULL END;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.trg_auto_assign_product_zone() FROM PUBLIC,anon,authenticated;
-- Existing trigger registrations remain unchanged; only their location-rewrite behavior is replaced.
