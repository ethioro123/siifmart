-- Section-specific, country-isolated saves with a trusted audit in the same transaction.
CREATE TABLE private.general_settings_receipts(id uuid PRIMARY KEY,actor_id uuid NOT NULL REFERENCES public.employees(id),country_code text NOT NULL,section text NOT NULL,fingerprint text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX general_settings_receipts_actor ON private.general_settings_receipts(actor_id);
ALTER TABLE private.general_settings_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.general_settings_receipts FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.guard_and_audit_general_settings() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; column_name text; key text; market text;
 globals jsonb:='{}'; changes jsonb; old_json jsonb:=to_jsonb(OLD); new_json jsonb:=to_jsonb(NEW);
 protected text[]:=ARRAY['slogan','storeName','brandColor','logoUrl','legalBusinessName','taxVatNumber','posReceiptTaxId','registeredAddress','supportContact','supportPhone','currency','timezone','dateFormat','language'];
 db_protected text[]:=ARRAY['slogan','store_name','brand_color','logo_url','legal_business_name','tax_vat_number','pos_receipt_tax_id','registered_address','support_contact','support_phone','currency','timezone','date_format','language'];
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=public.get_my_employee_id() AND lower(status)='active';
 FOREACH column_name IN ARRAY db_protected LOOP
  IF old_json->column_name IS DISTINCT FROM new_json->column_name THEN globals:=globals||jsonb_build_object(column_name,jsonb_build_object('before',old_json->column_name,'after',new_json->column_name)); END IF;
 END LOOP;
 IF globals<>'{}' THEN
  IF coalesce(auth.jwt()->>'role','')<>'service_role' AND (actor.id IS NULL OR actor.role<>'group_ceo') THEN RAISE EXCEPTION 'Only the Group CEO may change corporate, legal or localization settings' USING ERRCODE='42501'; END IF;
  INSERT INTO public.system_logs(action,module,employee_id,user_name,country_code,entity_type,entity_id,details)
  VALUES('GENERAL_SETTINGS_UPDATED','Settings',actor.id::text,coalesce(actor.name,'System service'),NULL,'system_config',NEW.id::text,jsonb_build_object('scope','global','changes',globals)::text);
 END IF;
 FOR market IN SELECT jsonb_object_keys(coalesce(OLD.country_configs,'{}')||coalesce(NEW.country_configs,'{}')) LOOP
  changes:='{}';
  FOREACH key IN ARRAY protected LOOP
   IF OLD.country_configs#>ARRAY[market,key] IS DISTINCT FROM NEW.country_configs#>ARRAY[market,key] THEN
    changes:=changes||jsonb_build_object(key,jsonb_build_object('before',OLD.country_configs#>ARRAY[market,key],'after',NEW.country_configs#>ARRAY[market,key]));
   END IF;
  END LOOP;
  IF changes<>'{}' THEN
   IF coalesce(auth.jwt()->>'role','')<>'service_role' AND (actor.id IS NULL OR actor.role<>'group_ceo') THEN RAISE EXCEPTION 'Only the Group CEO may change corporate, legal or localization settings' USING ERRCODE='42501'; END IF;
   INSERT INTO public.system_logs(action,module,employee_id,user_name,country_code,entity_type,entity_id,details)
   VALUES('GENERAL_SETTINGS_UPDATED','Settings',actor.id::text,coalesce(actor.name,'System service'),market,'system_config',NEW.id::text,jsonb_build_object('scope',market,'changes',changes)::text);
  END IF;
 END LOOP;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_and_audit_general_settings() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_and_audit_general_settings BEFORE UPDATE ON public.system_config FOR EACH ROW EXECUTE FUNCTION private.guard_and_audit_general_settings();

CREATE FUNCTION private.save_general_settings_section(p_request uuid,p_country text,p_section text,p_changes jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; cfg public.system_config%ROWTYPE; receipt private.general_settings_receipts%ROWTYPE;
 allowed text[]; key text; value text; partition jsonb; fingerprint text:=md5(p_changes::text);
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=public.get_my_employee_id() AND lower(status)='active';
 IF actor.id IS NULL OR actor.role<>'group_ceo' THEN RAISE EXCEPTION 'Only the Group CEO may save general settings' USING ERRCODE='42501'; END IF;
 IF p_request IS NULL OR coalesce(p_country,'') NOT IN('ET','KE','UG','RW','TZ') OR jsonb_typeof(p_changes) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Valid request, country and section values required'; END IF;
 allowed:=CASE p_section WHEN 'branding' THEN ARRAY['slogan'] WHEN 'legal' THEN ARRAY['legalBusinessName','taxVatNumber','posReceiptTaxId','registeredAddress','supportContact','supportPhone'] WHEN 'localization' THEN ARRAY['currency','timezone','dateFormat','language'] ELSE NULL END;
 IF allowed IS NULL OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_changes)k WHERE NOT k=ANY(allowed)) OR EXISTS(SELECT 1 FROM unnest(allowed)k WHERE jsonb_typeof(p_changes->k) IS DISTINCT FROM 'string') THEN RAISE EXCEPTION 'Only the selected section fields may be saved'; END IF;
 FOREACH key IN ARRAY allowed LOOP
  value:=p_changes->>key;
  IF length(value)>(CASE WHEN key='slogan' THEN 200 WHEN key='registeredAddress' THEN 255 WHEN key='legalBusinessName' THEN 150 WHEN key='supportContact' THEN 100 WHEN key='supportPhone' THEN 30 WHEN key='currency' THEN 10 ELSE 50 END) THEN RAISE EXCEPTION 'Setting % is too long',key; END IF;
 END LOOP;
 IF p_section='legal' AND (length(trim(p_changes->>'legalBusinessName'))=0 OR length(trim(p_changes->>'registeredAddress'))=0 OR length(trim(p_changes->>'supportPhone'))<5 OR p_changes->>'supportContact' !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$') THEN RAISE EXCEPTION 'Legal name, address, valid support email and phone are required'; END IF;
 IF p_section='localization' AND (length(trim(p_changes->>'currency'))=0 OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name=p_changes->>'timezone') OR p_changes->>'dateFormat' NOT IN('DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD') OR p_changes->>'language' NOT IN('en','am','or') OR (p_country<>'ET' AND p_changes->>'language'<>'en')) THEN RAISE EXCEPTION 'Invalid localization values for this country'; END IF;
 SELECT * INTO cfg FROM public.system_config WHERE id='00000000-0000-0000-0000-000000000001' FOR UPDATE;
 IF cfg.id IS NULL THEN RAISE EXCEPTION 'System configuration has not been initialized'; END IF;
 SELECT * INTO receipt FROM private.general_settings_receipts WHERE id=p_request;
 IF receipt.id IS NOT NULL THEN
  IF receipt.actor_id<>actor.id OR receipt.country_code<>p_country OR receipt.section<>p_section OR receipt.fingerprint IS DISTINCT FROM fingerprint THEN RAISE EXCEPTION 'Settings retry does not match the original request'; END IF;
  RETURN jsonb_build_object('saved',true,'settings',public.get_sanitized_system_config());
 END IF;
 partition:=coalesce(cfg.country_configs->p_country,'{}')||p_changes;
 UPDATE public.system_config SET country_configs=jsonb_set(coalesce(country_configs,'{}'),ARRAY[p_country],partition,true),updated_at=now(),updated_by=actor.name WHERE id=cfg.id;
 INSERT INTO private.general_settings_receipts(id,actor_id,country_code,section,fingerprint) VALUES(p_request,actor.id,p_country,p_section,fingerprint);
 RETURN jsonb_build_object('saved',true,'settings',public.get_sanitized_system_config());
END $$;
REVOKE ALL ON FUNCTION private.save_general_settings_section(uuid,text,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.save_general_settings_section(uuid,text,text,jsonb) TO authenticated;
CREATE FUNCTION public.save_general_settings_section(p_request uuid,p_country text,p_section text,p_changes jsonb) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.save_general_settings_section(p_request,p_country,p_section,p_changes); $$;
REVOKE ALL ON FUNCTION public.save_general_settings_section(uuid,text,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_general_settings_section(uuid,text,text,jsonb) TO authenticated;
