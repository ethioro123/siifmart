-- Pending requests carry no supervisor identity. Confirmed custody derives from auth.uid().
CREATE OR REPLACE FUNCTION public.validate_pos_cash_drop_custody()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e public.employees%ROWTYPE;
BEGIN
 IF NEW.status IN ('pending_supervisor','cancelled_at_close') THEN
 IF NEW.supervisor_id IS NOT NULL THEN RAISE EXCEPTION 'Pending drop cannot claim supervisor approval'; END IF;
 RETURN NEW;
 END IF;
 SELECT * INTO e FROM public.employees WHERE id::text=NEW.supervisor_id AND lower(coalesce(status,'active'))='active';
 IF e.id IS NULL OR NEW.cashier_id=e.id::text
 OR e.role NOT IN ('store_manager','assistant_store_manager','head_cashier','shift_supervisor','regional_operations_manager','area_operations_manager','country_operations_director')
 OR NOT EXISTS(SELECT 1 FROM public.sites s JOIN public.sites home ON home.id=e.site_id
 WHERE s.id::text=NEW.site_id AND s.country=NEW.country_code AND home.country=s.country
 AND (e.site_id=s.id OR (coalesce(e.region_code,home.region_code) IS NOT NULL AND coalesce(e.region_code,home.region_code)=s.region_code)
 OR e.role='country_operations_director'))
 THEN RAISE EXCEPTION 'Independent scoped supervisor custody is required' USING ERRCODE='42501'; END IF;
 NEW.supervisor_name:=e.name; NEW.supervisor_role:=e.role;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_pos_cash_drop_custody() FROM PUBLIC,anon,authenticated;
