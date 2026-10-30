-- Only the authenticated Edge Function may record a verified account handover.
BEGIN;
CREATE OR REPLACE FUNCTION public.guard_employee_access_handover()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public, pg_temp AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF (NEW.credentials_handed_over_at IS NOT NULL OR NEW.credentials_handed_over_by IS NOT NULL)
       AND coalesce(auth.role(), '') <> 'service_role' THEN
      RAISE EXCEPTION 'Verified employee access handover is required';
    END IF;
    RETURN NEW;
  END IF;
  IF (NEW.credentials_handed_over_at IS DISTINCT FROM OLD.credentials_handed_over_at
      OR NEW.credentials_handed_over_by IS DISTINCT FROM OLD.credentials_handed_over_by)
     AND coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Verified employee access handover is required';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS employee_access_handover_guard ON public.employees;
CREATE TRIGGER employee_access_handover_guard BEFORE INSERT OR UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.guard_employee_access_handover();
REVOKE ALL ON FUNCTION public.guard_employee_access_handover() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_employee_access_handover(
  p_actor_id uuid, p_employee_id uuid, p_country_code text,
  p_actor_role text, p_employee_role text, p_site_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, auth, pg_temp AS $$
DECLARE actor public.employees%ROWTYPE; target public.employees%ROWTYPE; stamp timestamptz;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN RAISE EXCEPTION 'Server access required'; END IF;
  SELECT * INTO actor FROM public.employees WHERE id=p_actor_id FOR SHARE;
  IF NOT FOUND OR actor.status IS DISTINCT FROM 'Active' OR actor.role IS DISTINCT FROM p_actor_role THEN RAISE EXCEPTION 'Actor changed'; END IF;
  SELECT * INTO target FROM public.employees WHERE id=p_employee_id FOR UPDATE;
  IF NOT FOUND OR target.status IS DISTINCT FROM 'Active' OR target.role IS DISTINCT FROM p_employee_role OR target.site_id IS DISTINCT FROM p_site_id
     OR actor.id=target.id THEN RAISE EXCEPTION 'Employee changed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.sites WHERE id=target.site_id AND upper(country)=upper(p_country_code)) THEN
    RAISE EXCEPTION 'Country scope changed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id=target.id AND lower(email)=lower(target.email)) THEN
    RAISE EXCEPTION 'Login identity is not verified';
  END IF;
  IF target.credentials_handed_over_at IS NOT NULL THEN
    RETURN jsonb_build_object('employeeId',target.id,'handedOverAt',target.credentials_handed_over_at);
  END IF;
  stamp := clock_timestamp();
  UPDATE public.employees SET credentials_handed_over_at=stamp,
    credentials_handed_over_by=actor.name WHERE id=target.id;
  INSERT INTO public.system_logs(action,module,site_id,country_code,employee_id,user_name,details)
  VALUES ('EMPLOYEE_ACCESS_HANDED_OVER','HR',target.site_id::text,upper(p_country_code),actor.id::text,actor.name,
    jsonb_build_object('employeeId',target.id,'handedOverAt',stamp)::text);
  RETURN jsonb_build_object('employeeId',target.id,'handedOverAt',stamp);
END;
$$;
REVOKE ALL ON FUNCTION public.record_employee_access_handover(uuid,uuid,text,text,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_employee_access_handover(uuid,uuid,text,text,text,uuid) TO service_role;
-- Staff identities do not create commerce wallets or inherit a foreign default currency.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE default_currency text := 'KES'; new_user_id uuid; wallet_exists boolean;
BEGIN
  IF NEW.raw_app_meta_data ? 'staff_employee_id' THEN
    IF NEW.raw_app_meta_data->>'staff_employee_id' <> NEW.id::text OR NOT EXISTS (
      SELECT 1 FROM public.employees e JOIN public.sites s ON s.id=e.site_id
      WHERE e.id=NEW.id AND lower(e.email)=lower(NEW.email) AND e.status='Active'
        AND e.site_id::text=NEW.raw_app_meta_data->>'site_id'
        AND upper(s.country)=upper(NEW.raw_app_meta_data->>'country_code')
    ) THEN RAISE EXCEPTION 'Approved staff identity required'; END IF;
    RETURN NEW;
  END IF;
  INSERT INTO public.users(auth_id,email,phone,full_name,default_language,created_at,updated_at)
  VALUES(NEW.id,NEW.email,NEW.phone,coalesce(NEW.raw_user_meta_data->>'full_name',NEW.email),'en',now(),now())
  ON CONFLICT(auth_id) DO UPDATE SET email=excluded.email,phone=excluded.phone,full_name=excluded.full_name,updated_at=now()
  RETURNING id INTO new_user_id;
  IF new_user_id IS NULL THEN SELECT id INTO new_user_id FROM public.users WHERE auth_id=NEW.id; END IF;
  SELECT EXISTS(SELECT 1 FROM public.wallets WHERE user_id=new_user_id) INTO wallet_exists;
  IF NOT wallet_exists THEN
    INSERT INTO public.wallets(user_id,currency_code,balance_cents) VALUES(new_user_id,default_currency,0);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.employee_access_ready() RETURNS integer
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = pg_catalog, pg_temp AS $$ SELECT 1 $$;
REVOKE ALL ON FUNCTION public.employee_access_ready() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.employee_access_ready() TO service_role;
COMMIT;
