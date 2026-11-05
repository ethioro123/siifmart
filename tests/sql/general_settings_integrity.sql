-- Trusted saves and RLS checks; all settings/audit fixtures are rolled back.
BEGIN;
DO $test$
DECLARE ceo uuid; manager uuid; home text; before_cfg public.system_config%ROWTYPE; after_cfg public.system_config%ROWTYPE; key uuid:=gen_random_uuid(); response jsonb; request uuid; blocked boolean; n integer;
BEGIN
 SELECT id INTO ceo FROM public.employees WHERE role='group_ceo' AND lower(status)='active' LIMIT 1;
 SELECT * INTO before_cfg FROM public.system_config WHERE id='00000000-0000-0000-0000-000000000001';
 IF ceo IS NULL OR before_cfg.id IS NULL THEN RAISE EXCEPTION 'Missing settings fixture';END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',ceo,'role','authenticated')::text,true);EXECUTE 'SET LOCAL ROLE authenticated';
 response:=public.save_general_settings_section(key,'ET','branding','{"slogan":"Audit regression slogan"}');
 IF response->>'saved'<>'true' THEN RAISE EXCEPTION 'Save was not confirmed'; END IF;
 response:=public.save_general_settings_section(gen_random_uuid(),'KE','branding','{"slogan":"Independent KE slogan"}');
 response:=public.save_general_settings_section(key,'ET','branding','{"slogan":"Audit regression slogan"}');
 blocked:=false;BEGIN PERFORM public.save_general_settings_section(key,'ET','branding','{"slogan":"Changed retry"}');EXCEPTION WHEN raise_exception THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Changed retry accepted';END IF;
 blocked:=false;BEGIN PERFORM public.save_general_settings_section(gen_random_uuid(),'ET','localization','{"currency":"ETB","timezone":"UTC","dateFormat":"YYYY-MM-DD","language":"en","taxRate":"99"}');EXCEPTION WHEN raise_exception THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Localization modified a hidden fiscal field';END IF;
 EXECUTE 'RESET ROLE';
 SELECT * INTO after_cfg FROM public.system_config WHERE id=before_cfg.id;
 IF after_cfg.country_configs#>>'{ET,slogan}'<>'Audit regression slogan' OR after_cfg.country_configs#>>'{KE,slogan}'<>'Independent KE slogan' THEN RAISE EXCEPTION 'Country patches overwrote each other';END IF;
 IF (to_jsonb(after_cfg)-ARRAY['country_configs','updated_at','updated_by']) IS DISTINCT FROM (to_jsonb(before_cfg)-ARRAY['country_configs','updated_at','updated_by']) THEN RAISE EXCEPTION 'Section save changed global/unrelated columns';END IF;
 IF ((after_cfg.country_configs#>'{ET}')-'slogan') IS DISTINCT FROM (coalesce(before_cfg.country_configs#>'{ET}','{}')-'slogan') THEN RAISE EXCEPTION 'Branding changed unrelated ET settings';END IF;
 SELECT count(*) INTO n FROM public.system_logs WHERE action='GENERAL_SETTINGS_UPDATED' AND employee_id=ceo::text AND country_code='ET' AND details::jsonb#>>'{changes,slogan,after}'='Audit regression slogan';
 IF n<>1 THEN RAISE EXCEPTION 'Missing or duplicate audit';END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',ceo,'role','authenticated')::text,true);EXECUTE 'SET LOCAL ROLE authenticated';
 response:=public.save_general_settings_section(gen_random_uuid(),'ET','localization','{"currency":"ETB","timezone":"Africa/Addis_Ababa","dateFormat":"YYYY-MM-DD","language":"am"}');
 response:=public.save_general_settings_section(gen_random_uuid(),'ET','branding','{"slogan":""}');
 EXECUTE 'RESET ROLE';
 SELECT * INTO after_cfg FROM public.system_config WHERE id=before_cfg.id;
 IF after_cfg.country_configs#>>'{ET,slogan}' IS DISTINCT FROM '' THEN RAISE EXCEPTION 'Blank slogan was not retained';END IF;
 IF after_cfg.country_configs#>'{ET,posReceiptTaxId}' IS DISTINCT FROM before_cfg.country_configs#>'{ET,posReceiptTaxId}' OR after_cfg.country_configs#>'{ET,supportPhone}' IS DISTINCT FROM before_cfg.country_configs#>'{ET,supportPhone}' OR after_cfg.country_configs#>'{ET,taxRate}' IS DISTINCT FROM before_cfg.country_configs#>'{ET,taxRate}' THEN RAISE EXCEPTION 'Localization reset legal/contact/tax details';END IF;
 SELECT e.id,s.country INTO manager,home FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='warehouse_manager' AND lower(e.status)='active' LIMIT 1;
 IF manager IS NOT NULL THEN
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',manager,'role','authenticated')::text,true);EXECUTE 'SET LOCAL ROLE authenticated';
  blocked:=false;BEGIN PERFORM public.save_general_settings_section(gen_random_uuid(),home,'branding','{"slogan":"Not authorized"}');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
  IF NOT blocked THEN RAISE EXCEPTION 'Manager used CEO save API';END IF;
  blocked:=false;BEGIN UPDATE public.system_config SET slogan='Not authorized' WHERE id=before_cfg.id;EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
  IF NOT blocked THEN RAISE EXCEPTION 'Manager directly changed slogan';END IF;
  blocked:=false;BEGIN UPDATE public.system_config SET country_configs=jsonb_set(after_cfg.country_configs,ARRAY[home,'legalBusinessName'],'"Not authorized"'::jsonb,true) WHERE id=before_cfg.id;EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
  IF NOT blocked THEN RAISE EXCEPTION 'Manager bypassed country legal field protection';END IF;
  EXECUTE 'RESET ROLE';
 END IF;
 IF has_function_privilege('anon','public.save_general_settings_section(uuid,text,text,jsonb)','EXECUTE') OR has_table_privilege('authenticated','private.general_settings_receipts','INSERT') THEN RAISE EXCEPTION 'Settings evidence grants are exposed';END IF;
END $test$;
ROLLBACK;
