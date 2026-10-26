-- Defer unreviewed discrepancy job awards and derive accuracy eligibility from reviewed evidence.
CREATE OR REPLACE FUNCTION private.award_completed_warehouse_job(p_job_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 j public.wms_jobs%ROWTYPE; e public.employees%ROWTYPE; actor public.employees%ROWTYPE;
 w public.worker_points%ROWTYPE; cfg jsonb; rules jsonb; tiers jsonb; tier jsonb; lvl record; ach record;
 pts integer; base integer; item_bonus integer; acc_bonus integer; accuracy numeric; count_items integer;
 jobs_done integer; streak integer; achievements jsonb; monthly integer; total integer; country text; clock timestamptz;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO j FROM public.wms_jobs WHERE id=p_job_id FOR SHARE;
 IF actor.id IS NULL OR j.id IS NULL OR j.status<>'Completed' OR j.type NOT IN ('PICK','PACK','PUTAWAY','TRANSFER','DISPATCH')
  OR j.completed_at IS NULL THEN RAISE EXCEPTION 'Completed warehouse job required' USING ERRCODE='42501'; END IF;
 SELECT * INTO e FROM public.employees WHERE id::text=j.completed_by AND site_id=j.site_id AND lower(status)='active';
 SELECT upper(s.country) INTO country FROM public.sites s WHERE s.id=j.site_id AND s.type IN ('Warehouse','Distribution Center');
 IF e.id IS NULL OR country IS DISTINCT FROM upper(j.country_code)
  OR NOT public.is_site_in_my_authorized_scope(j.site_id::text,j.country_code)
  OR NOT (public.is_manager() OR public.is_ceo() OR (actor.id=e.id AND actor.site_id=j.site_id
    AND j.assigned_to=e.id::text AND EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=j.id AND a.employee_id=e.id))) THEN
  RAISE EXCEPTION 'Only the completing worker or scoped supervisor may claim this award' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(j.line_items) i WHERE coalesce(i->>'status','Pending') NOT IN ('Completed','Picked','Short','Discontinued')) THEN
  RAISE EXCEPTION 'All job lines must be processed before points are awarded'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(e.id::text,0));
 SELECT * INTO w FROM public.worker_points WHERE employee_id=e.id::text FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.points_transactions WHERE employee_id=e.id::text AND job_id=j.id::text AND type='JOB_COMPLETE') THEN RETURN to_jsonb(w); END IF;
 IF EXISTS(SELECT 1 FROM private.floor_discrepancies d LEFT JOIN private.floor_discrepancy_reviews r ON r.discrepancy_id=d.id WHERE d.job_id=j.id AND r.discrepancy_id IS NULL) THEN RETURN jsonb_build_object('pending_review',true,'job_id',j.id); END IF;
 IF w.id IS NOT NULL AND w.site_id IS DISTINCT FROM j.site_id::text THEN RAISE EXCEPTION 'Worker points belong to another site' USING ERRCODE='42501'; END IF;
 SELECT coalesce(s.country_configs->country,'{}'::jsonb) INTO cfg FROM public.system_config s WHERE id='00000000-0000-0000-0000-000000000001';
 cfg:=coalesce(cfg,'{}'::jsonb);
 IF coalesce((cfg->>'bonusEnabled')::boolean,true)=false OR EXISTS(SELECT 1 FROM public.sites WHERE id=j.site_id AND warehouse_bonus_enabled=false) THEN RETURN NULL; END IF;
 rules:=cfg->'warehousePointRules'; tiers:=cfg->'bonusTiers';
 IF rules IS NULL OR jsonb_array_length(rules)=0 THEN rules:='[{"id":"wpr-1","action":"PICK","points":15,"description":"Base points for picking a job","enabled":true},{"id":"wpr-2","action":"PACK","points":10,"description":"Base points for packing a job","enabled":true},{"id":"wpr-3","action":"PUTAWAY","points":8,"description":"Base points for putaway a job","enabled":true},{"id":"wpr-4","action":"TRANSFER","points":10,"description":"Base points for transfer a job","enabled":true},{"id":"wpr-5","action":"DISPATCH","points":8,"description":"Base points for dispatch a job","enabled":true},{"id":"wpr-6","action":"ITEM_BONUS","points":2,"description":"Points per item processed","enabled":true},{"id":"wpr-7","action":"ACCURACY_100","points":50,"description":"Bonus for 100% accuracy","enabled":true},{"id":"wpr-8","action":"ACCURACY_95","points":25,"description":"Bonus for 95%+ accuracy","enabled":true},{"id":"wpr-9","action":"STREAK_3","points":25,"description":"Bonus for 3-day active streak","enabled":true},{"id":"wpr-10","action":"STREAK_7","points":75,"description":"Bonus for 7-day active streak","enabled":true},{"id":"wpr-11","action":"STREAK_30","points":300,"description":"Bonus for 30-day active streak","enabled":true}]'::jsonb; END IF;
 IF tiers IS NULL OR jsonb_array_length(tiers)=0 THEN tiers:='[{"id":"tier-1","minPoints":0,"maxPoints":99,"bonusAmount":0,"bonusPerPoint":0,"tierName":"Training","tierColor":"gray"},{"id":"tier-2","minPoints":100,"maxPoints":299,"bonusAmount":500,"bonusPerPoint":0.5,"tierName":"Bronze","tierColor":"amber"},{"id":"tier-3","minPoints":300,"maxPoints":599,"bonusAmount":1200,"bonusPerPoint":0.75,"tierName":"Silver","tierColor":"gray"},{"id":"tier-4","minPoints":600,"maxPoints":999,"bonusAmount":2500,"bonusPerPoint":1,"tierName":"Gold","tierColor":"yellow"},{"id":"tier-5","minPoints":1000,"maxPoints":1999,"bonusAmount":5000,"bonusPerPoint":1.25,"tierName":"Platinum","tierColor":"cyan"},{"id":"tier-6","minPoints":2000,"maxPoints":null,"bonusAmount":10000,"bonusPerPoint":1.5,"tierName":"Diamond","tierColor":"purple"}]'::jsonb; END IF;
 SELECT count(*),coalesce(round(100.0*count(*) FILTER(WHERE i->>'status'<>'Short')/nullif(count(*),0)),100)
 INTO count_items,accuracy FROM jsonb_array_elements(j.line_items) i;
 SELECT coalesce((r->>'points')::integer,10) INTO base FROM jsonb_array_elements(rules) r WHERE r->>'action'=j.type AND (r->>'enabled')::boolean LIMIT 1;
 base:=coalesce(base,10); IF j.priority IN ('High','Critical') THEN base:=round(base*1.5); END IF;
 SELECT coalesce((r->>'points')::integer,0) INTO item_bonus FROM jsonb_array_elements(rules) r WHERE r->>'action'='ITEM_BONUS' AND (r->>'enabled')::boolean LIMIT 1;
 SELECT coalesce((r->>'points')::integer,0) INTO acc_bonus FROM jsonb_array_elements(rules) r WHERE r->>'action'=CASE WHEN accuracy>=100 THEN 'ACCURACY_100' WHEN accuracy>=95 THEN 'ACCURACY_95' END AND (r->>'enabled')::boolean LIMIT 1;
 IF EXISTS(SELECT 1 FROM private.floor_discrepancy_reviews r JOIN private.floor_discrepancies d ON d.id=r.discrepancy_id JOIN public.wms_jobs s ON s.id=d.job_id WHERE r.finding='confirmed_handling_error' AND r.responsible_id=e.id AND s.site_id=j.site_id AND s.country_code=j.country_code AND (s.id=j.id OR (s.order_ref=j.order_ref AND nullif(j.order_ref,'') IS NOT NULL))) THEN acc_bonus:=0; END IF;
 pts:=greatest(1,base+count_items*greatest(0,coalesce(item_bonus,0))+coalesce(acc_bonus,0));
 clock:=j.completed_at; jobs_done:=coalesce(w.total_jobs_completed,0)+1;
 streak:=CASE WHEN w.last_job_completed_at::date=clock::date THEN greatest(1,coalesce(w.current_streak,0))
  WHEN w.last_job_completed_at::date=clock::date-1 THEN coalesce(w.current_streak,0)+1 ELSE 1 END;
 IF w.last_job_completed_at::date IS DISTINCT FROM clock::date THEN
  SELECT pts+coalesce((r->>'points')::integer,0) INTO total FROM jsonb_array_elements(rules) r
   WHERE r->>'action'='STREAK_'||streak AND (r->>'enabled')::boolean AND streak IN (3,7,30) LIMIT 1;
  pts:=coalesce(total,pts);
 END IF;
 achievements:=coalesce(w.achievements,'[]'::jsonb);
 FOR ach IN SELECT * FROM (VALUES
  ('first_job','First Mission','Rocket',25,jobs_done>=1),('centurion','Centurion','Award',150,jobs_done>=100),
  ('veteran','Warehouse Veteran','Medal',500,jobs_done>=500),('legend','Mythic Operator','Star',1000,jobs_done>=1000),
  ('streak_3','On Fire','Flame',25,streak>=3),('streak_7','Unstoppable','Shield',75,streak>=7),
  ('streak_30','Warehouse Legend','Crown',300,streak>=30),('perfect_accuracy','Eagle Eye','Target',75,accuracy>=100 AND acc_bonus>0 AND jobs_done>=3)
 ) AS a(kind,title,icon,points,unlocked) LOOP
  IF ach.unlocked AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(achievements) a WHERE a->>'type'=ach.kind) THEN
   achievements:=achievements||jsonb_build_array(jsonb_build_object('id','ach-'||ach.kind||'-'||j.id::text,'type',ach.kind,'name',ach.title,'icon',ach.icon,'description',ach.title,'unlockedAt',clock,'pointsAwarded',ach.points)); pts:=pts+ach.points;
  END IF;
 END LOOP;
 total:=coalesce(w.total_points,0)+pts; monthly:=coalesce(w.monthly_points,0)+pts;
 SELECT r INTO tier FROM jsonb_array_elements(tiers) r WHERE monthly>=(r->>'minPoints')::integer AND (r->>'maxPoints' IS NULL OR monthly<=(r->>'maxPoints')::integer) LIMIT 1;
 tier:=coalesce(tier,tiers->0);
 SELECT * INTO lvl FROM (VALUES (1,0,'Rookie'),(2,100,'Apprentice'),(3,300,'Worker'),(4,600,'Skilled'),(5,1000,'Expert'),(6,2000,'Pro'),(7,4000,'Master'),(8,7000,'Elite'),(9,12000,'Champion'),(10,20000,'Legend')) l(level,threshold,title) WHERE threshold<=total ORDER BY threshold DESC LIMIT 1;
 INSERT INTO public.worker_points(employee_id,site_id,employee_name,employee_avatar,total_points,weekly_points,monthly_points,today_points,total_jobs_completed,total_items_picked,average_accuracy,current_streak,longest_streak,last_job_completed_at,last_updated,achievements,level,level_title,current_bonus_tier,estimated_bonus,bonus_period_points)
 VALUES(e.id::text,j.site_id::text,e.name,e.avatar,total,coalesce(w.weekly_points,0)+pts,monthly,coalesce(w.today_points,0)+pts,jobs_done,
 coalesce(w.total_items_picked,0)+CASE WHEN j.type='PICK' THEN coalesce((SELECT sum((i->>'pickedQty')::numeric) FROM jsonb_array_elements(j.line_items)i),0) ELSE 0 END,
 accuracy,streak,greatest(streak,coalesce(w.longest_streak,0)),clock,now(),achievements,lvl.level,lvl.title,tier->>'tierName',coalesce((tier->>'bonusAmount')::numeric,0)+monthly*coalesce((tier->>'bonusPerPoint')::numeric,0),monthly)
 ON CONFLICT(employee_id) DO UPDATE SET total_points=excluded.total_points,weekly_points=excluded.weekly_points,monthly_points=excluded.monthly_points,today_points=excluded.today_points,total_jobs_completed=excluded.total_jobs_completed,total_items_picked=excluded.total_items_picked,average_accuracy=excluded.average_accuracy,current_streak=excluded.current_streak,longest_streak=excluded.longest_streak,last_job_completed_at=excluded.last_job_completed_at,last_updated=excluded.last_updated,achievements=excluded.achievements,level=excluded.level,level_title=excluded.level_title,current_bonus_tier=excluded.current_bonus_tier,estimated_bonus=excluded.estimated_bonus,bonus_period_points=excluded.bonus_period_points RETURNING * INTO w;
 INSERT INTO public.points_transactions(employee_id,job_id,points,type,description) VALUES(e.id::text,j.id::text,pts,'JOB_COMPLETE','Completed '||j.type||' job: '||coalesce(j.job_number,j.id::text));
 RETURN to_jsonb(w);
END;
$function$


