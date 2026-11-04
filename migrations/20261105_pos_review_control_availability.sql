-- Add explicit native-control availability; a review note must not substitute for missing approval RPCs.
DO $$
DECLARE definition text; marker text:=$marker$'can_note',coalesce(summary.actor_id,'') NOT IN(actor.id::text,actor.name),$marker$;
BEGIN
 definition:=pg_get_functiondef('public.pos_manager_review_detail(uuid,text,text,uuid,integer)'::regprocedure);
 IF position(marker IN definition)=0 THEN RAISE EXCEPTION 'Unexpected POS review detail definition'; END IF;
 EXECUTE replace(definition,marker,marker||$insert$
 'can_controls',CASE WHEN p_source IN('shift','drop') THEN
 actor.role IN('store_manager','assistant_store_manager','head_cashier','shift_supervisor','regional_operations_manager','area_operations_manager','country_operations_director')
 AND to_regprocedure('public.counter_review_queue(uuid,text)') IS NOT NULL
 AND to_regprocedure('public.review_counter_shift(uuid,text,text,text)') IS NOT NULL
 AND to_regprocedure('public.approve_counter_drop(uuid)') IS NOT NULL
 WHEN p_source='receiving' THEN to_regprocedure('public.get_transfer_receipt_verification(uuid)') IS NOT NULL
 WHEN p_source='sale' THEN true
 ELSE false END,
$insert$);
END $$;
