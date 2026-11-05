CREATE TABLE private.employee_code_counters(country_code text PRIMARY KEY CHECK(country_code ~ '^[A-Z]{2}$'),last_sequence bigint NOT NULL CHECK(last_sequence>=0));
ALTER TABLE private.employee_code_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.employee_code_counters FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.reserve_next_employee_code(p_country_code text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE country text:=upper(btrim(p_country_code)); next_sequence bigint; maximum bigint;
BEGIN
 IF NOT private.has_active_operational_employee() OR NOT public.is_country_in_my_authorized_scope(country)
 OR NOT (public.is_manager() OR public.get_my_role() IN('group_ceo','group_chro','country_hr_director','regional_hr_manager','hr_generalist','talent_recruiter')) THEN RAISE EXCEPTION 'Authorized hiring employee and country required' USING ERRCODE='42501'; END IF;
 IF country IS NULL OR country !~ '^[A-Z]{2}$' THEN RAISE EXCEPTION 'Valid country required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('employee-code:'||country,0));
 SELECT greatest(coalesce(max((substring(upper(code) from 'SIIF([0-9]+)$'))::bigint),0),CASE WHEN country='ET' THEN 39 ELSE 0 END) INTO maximum FROM public.employees WHERE upper(code) ~ ('^'||country||'-SIIF[0-9]+$');
 INSERT INTO private.employee_code_counters(country_code,last_sequence) VALUES(country,maximum+1)
 ON CONFLICT(country_code) DO UPDATE SET last_sequence=greatest(private.employee_code_counters.last_sequence+1,excluded.last_sequence)
 RETURNING last_sequence INTO next_sequence;
 RETURN country||'-SIIF'||lpad(next_sequence::text,greatest(4,length(next_sequence::text)),'0');
END $$;
CREATE FUNCTION public.reserve_next_employee_code(p_country_code text) RETURNS text LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.reserve_next_employee_code(p_country_code); $$;
REVOKE ALL ON FUNCTION private.reserve_next_employee_code(text),public.reserve_next_employee_code(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.reserve_next_employee_code(text),public.reserve_next_employee_code(text) TO authenticated;
