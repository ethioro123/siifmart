BEGIN;
ALTER TABLE public.sites DROP CONSTRAINT IF EXISTS check_barcode_prefix_format;
ALTER TABLE public.sites ADD CONSTRAINT check_barcode_prefix_format CHECK (barcode_prefix IS NULL OR barcode_prefix ~ '^[0-9]{4}$');
CREATE UNIQUE INDEX IF NOT EXISTS sites_barcode_prefix_unique ON public.sites(barcode_prefix) WHERE barcode_prefix IS NOT NULL;
CREATE SEQUENCE IF NOT EXISTS public.site_configuration_number_seq;
SELECT setval('public.site_configuration_number_seq',greatest(coalesce((SELECT max(site_number) FROM public.sites),0),coalesce((SELECT max(barcode_prefix::integer) FROM public.sites WHERE barcode_prefix ~ '^[0-9]{4}$'),0),1));
GRANT USAGE ON SEQUENCE public.site_configuration_number_seq TO authenticated;
CREATE OR REPLACE FUNCTION public.save_site_configuration(p_site_id uuid,p_changes jsonb,p_source_ids uuid[] DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE saved public.sites; previous public.sites; changes jsonb:=p_changes; field text; columns_sql text; values_sql text; seq integer;
 allowed text[]:=ARRAY['name','code','type','address','status','manager','area_manager_id','warehouse_manager_id','capacity','terminal_count','bonus_enabled','warehouse_bonus_enabled','fulfillment_strategy','is_fulfillment_node','replenishment_source_id','logistics_zone_id','region_code','country','currency','tax_jurisdiction_id','region'];
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.employees WHERE id=auth.uid() AND lower(status)='active') THEN RAISE EXCEPTION 'Active employee required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(changes) IS DISTINCT FROM 'object' OR changes='{}'::jsonb THEN RAISE EXCEPTION 'Site changes required'; END IF;
 FOR field IN SELECT jsonb_object_keys(changes) LOOP
  IF NOT field=ANY(allowed) THEN RAISE EXCEPTION 'Unsupported site field: %',field; END IF;
 END LOOP;
 IF p_site_id IS NOT NULL THEN
  SELECT * INTO previous FROM public.sites WHERE id=p_site_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Site unavailable' USING ERRCODE='42501'; END IF;
  IF changes ? 'country' AND changes->>'country' IS DISTINCT FROM previous.country THEN RAISE EXCEPTION 'An existing facility cannot move between countries'; END IF;
  IF changes ? 'code' AND changes->>'code' IS DISTINCT FROM previous.code THEN RAISE EXCEPTION 'Site code is immutable'; END IF;
 END IF;
 IF p_source_ids IS NOT NULL THEN
  changes:=changes||jsonb_build_object('replenishment_source_id',p_source_ids[1]);
 END IF;
 IF p_site_id IS NULL THEN
  seq:=nextval('public.site_configuration_number_seq');
  IF seq>9999 THEN RAISE EXCEPTION 'Site barcode prefix range exhausted'; END IF;
  changes:=changes||jsonb_build_object('site_number',seq);
  IF changes->>'type' IN ('Warehouse','Distribution Center') THEN changes:=changes||jsonb_build_object('barcode_prefix',lpad(seq::text,4,'0')); END IF;
  SELECT string_agg(format('%I',key),','),string_agg(format('(jsonb_populate_record(NULL::public.sites,$1)).%I',key),',') INTO columns_sql,values_sql FROM jsonb_object_keys(changes) key;
  EXECUTE format('INSERT INTO public.sites (%s) SELECT %s RETURNING *',columns_sql,values_sql) INTO saved USING changes;
 ELSE
  SELECT string_agg(format('%I=(jsonb_populate_record(NULL::public.sites,$1)).%I',key,key),',') INTO values_sql FROM jsonb_object_keys(changes) key;
  EXECUTE format('UPDATE public.sites SET %s WHERE id=$2 RETURNING *',values_sql) INTO saved USING changes,p_site_id;
  IF saved.id IS NULL THEN RAISE EXCEPTION 'Site update denied' USING ERRCODE='42501'; END IF;
 END IF;
 IF saved.logistics_zone_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.logistics_zones z WHERE z.id=saved.logistics_zone_id AND upper(coalesce(z.country,'ET'))=upper(saved.country)) THEN RAISE EXCEPTION 'Logistics zone must belong to the site country'; END IF;
 IF p_source_ids IS NOT NULL THEN
  IF EXISTS(SELECT 1 FROM unnest(p_source_ids) source_id WHERE source_id=saved.id OR NOT EXISTS(SELECT 1 FROM public.sites s WHERE s.id=source_id AND s.country=saved.country AND s.type IN('Warehouse','Distribution Center') AND s.status='Active')) THEN RAISE EXCEPTION 'Replenishment sources must be active warehouses in the same country'; END IF;
  DELETE FROM public.site_replenishment_sources WHERE site_id=saved.id;
  INSERT INTO public.site_replenishment_sources(site_id,source_site_id) SELECT saved.id,source_id FROM (SELECT DISTINCT unnest(p_source_ids) source_id) sources;
 END IF;
 RETURN to_jsonb(saved);
END;
$fn$;
REVOKE ALL ON FUNCTION public.save_site_configuration(uuid,jsonb,uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_site_configuration(uuid,jsonb,uuid[]) TO authenticated;
-- Provision only wholly unconfigured operational facilities; preserve all existing zone settings.
INSERT INTO public.warehouse_zones(site_id,name,type,zone_type,picking_priority,capacity,occupied,allow_picking,allow_putaway)
SELECT s.id,'Zone '||z.letter,z.storage,z.kind,z.priority,z.capacity,0,true,true
FROM public.sites s CROSS JOIN (VALUES
 ('A','Dry','RECEIVING',1,5000),('B','Dry','BULK',10,25000),('C','Dry','STANDARD',3,10000),('D','Dry','STANDARD',5,15000),
 ('E','Cold','CHILLED',6,8000),('F','Cold','FREEZER',8,6000),('G','Secure','HIGH_VALUE',4,2000),('H','Dry','QUARANTINE',9,3000),('I','Dry','STAGING',2,5000),('J','Dry','SHIPPING',1,4000)
) z(letter,storage,kind,priority,capacity)
WHERE s.type IN('Warehouse','Distribution Center') AND s.status='Active' AND NOT EXISTS(SELECT 1 FROM public.warehouse_zones existing WHERE existing.site_id=s.id);
COMMIT;
