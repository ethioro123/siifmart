BEGIN;
CREATE OR REPLACE FUNCTION private.audit_unused_product_cleanup() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; target_country text;
BEGIN
 IF auth.uid() IS NULL THEN RETURN OLD; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required for product cleanup audit' USING ERRCODE='42501'; END IF;
 SELECT country INTO target_country FROM public.sites WHERE id=OLD.site_id;
 INSERT INTO public.system_logs(user_name,employee_id,performed_by,action,module,details,site_id,country_code)
 VALUES(actor.name,actor.id::text,actor.id::text,'UNUSED_PRODUCT_REMOVED','Inventory',
   jsonb_build_object('product_id',OLD.id,'sku',OLD.sku,'name',OLD.name,'stock',OLD.stock,
     'actor_role',actor.role,'reason','Unused zero-stock product removed after server evidence checks')::text,
   OLD.site_id::text,target_country);
 RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION private.audit_unused_product_cleanup() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE TRIGGER audit_unused_product_cleanup AFTER DELETE ON public.products
 FOR EACH ROW EXECUTE FUNCTION private.audit_unused_product_cleanup();
COMMIT;
