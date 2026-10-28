-- Server-owned evidence: no cost, private snapshots or sales line details are exposed to preparers.
CREATE TABLE private.markdown_plans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL, product_id uuid NOT NULL,
 site_id uuid NOT NULL, country_code text NOT NULL, deadline date NOT NULL, snapshot jsonb NOT NULL,
 plan jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), request_id uuid,
 UNIQUE(employee_id,product_id)
);
ALTER TABLE private.markdown_plans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.markdown_plans FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.markdown_scope(p_site uuid,p_country text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.employees e JOIN public.sites s ON s.id=p_site
 WHERE e.id=auth.uid() AND lower(coalesce(e.status,''))='active' AND upper(s.country)=upper(p_country)
 AND public.is_country_in_my_authorized_scope(upper(p_country))
 AND e.role IN('group_ceo','group_cfo','country_managing_director','country_operations_director','country_finance_director',
 'country_commercial_director','country_supply_chain_director','regional_operations_manager','regional_supply_chain_manager',
 'regional_merchandising_manager','regional_procurement_manager','regional_finance_manager','vendor_relations_manager','merchandising_specialist','merchandiser')
 AND CASE WHEN e.role IN('merchandising_specialist','merchandiser','regional_merchandising_manager','country_commercial_director')
 THEN private.merchandising_site_scope(p_site::text,upper(p_country)) ELSE public.is_site_in_my_authorized_scope(p_site::text,upper(p_country)) END);
$$;
REVOKE ALL ON FUNCTION private.markdown_scope(uuid,text) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.generate_markdown_plan(p_product uuid,p_country text,p_deadline date) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.products%ROWTYPE; today date; days integer; count_stages integer; i integer;
 units numeric; unit7 numeric; daily numeric; opening numeric; sold numeric; closing numeric; cum numeric:=0;
 begin_day integer; end_day integer; prev_demand numeric:=0; demand numeric; stage_price numeric; current_price numeric;
 total_sold numeric; cogs numeric; price_regular numeric; targets integer[]:=ARRAY[0,10,20,35,50,60,70,75];
 stages jsonb:='[]'; result jsonb; token uuid; show_margin boolean; as_of timestamptz:=statement_timestamp();
BEGIN
 SELECT * INTO p FROM public.products WHERE id=p_product;
 IF p.id IS NULL OR NOT private.markdown_scope(p.site_id,p_country) THEN RAISE EXCEPTION 'Product is outside your authorized merchandising scope' USING ERRCODE='42501'; END IF;
 IF upper(p_country) NOT IN('ET','KE') THEN RAISE EXCEPTION 'Unsupported planning country'; END IF;
 today:=(as_of AT TIME ZONE CASE upper(p_country) WHEN 'ET' THEN 'Africa/Addis_Ababa' ELSE 'Africa/Nairobi' END)::date;
 days:=p_deadline-today;
 IF days IS NULL OR days<1 OR days>365 THEN RAISE EXCEPTION 'Choose a future deadline within 365 days'; END IF;
 IF p.expiry_date IS NOT NULL AND (p.expiry_date<=today OR p_deadline>p.expiry_date) THEN RAISE EXCEPTION 'Deadline must be on or before recorded expiry; expired stock cannot be planned'; END IF;
 IF p.status='archived' OR p.stock IS NULL OR p.price IS NULL OR p.cost_price IS NULL
 OR p.stock::text IN('NaN','Infinity','-Infinity') OR p.price::text IN('NaN','Infinity','-Infinity') OR p.cost_price::text IN('NaN','Infinity','-Infinity')
 OR round(p.stock)<1 OR round(p.price)<1 OR round(p.cost_price)<1 OR round(p.cost_price)>round(p.price) THEN
 RAISE EXCEPTION 'Recorded stock, regular price and cost must be valid before planning'; END IF;
 current_price:=round(CASE WHEN p.is_on_sale THEN p.sale_price ELSE p.price END);
 IF current_price IS NULL OR current_price::text IN('NaN','Infinity','-Infinity') OR current_price<round(p.cost_price) OR current_price>round(p.price) THEN RAISE EXCEPTION 'Current selling price is invalid for clearance'; END IF;
 -- Aggregate the complete window on the server: no receipt-page limits and no shared cache.
 SELECT round(coalesce(sum(si.quantity),0)),round(coalesce(sum(si.quantity) FILTER(WHERE s.sale_date>=as_of-interval '7 days'),0))
 INTO units,unit7 FROM public.sale_items si JOIN public.sales s ON s.id=si.sale_id
 WHERE si.product_id=p.id AND s.site_id=p.site_id AND s.country_code=upper(p_country) AND s.status='Completed'
 AND s.sale_date>=as_of-interval '30 days' AND s.sale_date<=as_of AND si.quantity>0 AND si.quantity::text NOT IN('NaN','Infinity','-Infinity');
 SELECT e.role NOT IN('merchandising_specialist','merchandiser') INTO show_margin FROM public.employees e WHERE e.id=auth.uid();
 opening:=round(p.stock); daily:=units/30; price_regular:=round(p.price); cogs:=round(p.cost_price);
 count_stages:=CASE WHEN days<=7 THEN days ELSE least(8,greatest(2,round(days::numeric/7)::integer)) END;
 FOR i IN 0..count_stages-1 LOOP
  begin_day:=round(i*days::numeric/count_stages); end_day:=round((i+1)*days::numeric/count_stages);
  stage_price:=least(current_price,greatest(cogs,round(price_regular*(1-(CASE WHEN count_stages=1 THEN 10 ELSE targets[i+1] END)::numeric/100))));
  demand:=round(daily*end_day); sold:=least(opening,greatest(0,demand-prev_demand)); prev_demand:=demand;
  closing:=opening-sold; cum:=cum+sold*stage_price;
  total_sold:=least(round(p.stock),round(daily*days));
  stages:=stages||jsonb_build_array(jsonb_build_object('stageIndex',i,'week','Stage '||(i+1),'dateRangeLabel',(today+begin_day)::text||' – '||(today+end_day)::text,
   'openingStock',opening,'projectedSales',sold,'closingStock',closing,'stock',closing,'price',stage_price,
   'targetDiscountPct',CASE WHEN count_stages=1 THEN 10 ELSE targets[i+1] END,'actualDiscountPct',round((price_regular-stage_price)/price_regular*100),
   'discount',round((price_regular-stage_price)/price_regular*100)||'%','stageRevenue',sold*stage_price,'revenue',cum,
   'selectedImpact',jsonb_build_object('units',total_sold,'remaining',round(p.stock)-total_sold,'revenue',total_sold*stage_price,
   'revenueAtCurrentPrice',total_sold*current_price,'marginPct',CASE WHEN show_margin THEN round((stage_price-cogs)/stage_price*100) END)));
  opening:=closing;
 END LOOP;
 total_sold:=round(p.stock)-opening;
 result:=jsonb_build_object('stages',stages,'initialStock',round(p.stock),'totalProjectedSales',total_sold,'finalRemainingStock',opening,'isFullyCleared',opening=0,
 'clearancePercentage',round(total_sold/round(p.stock)*100),'projectedTotalRevenue',cum,'totalLandedCost',CASE WHEN show_margin THEN total_sold*cogs END,
 'projectedMarginPct',CASE WHEN show_margin THEN CASE WHEN cum>0 THEN round((cum-total_sold*cogs)/cum*100) ELSE 0 END END,'durationDays',days,'numStages',count_stages,
 'asOf',as_of,'windowStart',as_of-interval '30 days','unitsSold30d',units,'unitsSold7d',unit7,'currentPrice',current_price,'expiryDate',p.expiry_date,'deadline',p_deadline,'costProtected',true);
 INSERT INTO private.markdown_plans(employee_id,product_id,site_id,country_code,deadline,snapshot,plan)
 VALUES(auth.uid(),p.id,p.site_id,upper(p_country),p_deadline,to_jsonb(p),result)
 ON CONFLICT(employee_id,product_id) DO UPDATE SET id=gen_random_uuid(),site_id=excluded.site_id,country_code=excluded.country_code,deadline=excluded.deadline,
 snapshot=excluded.snapshot,plan=excluded.plan,created_at=now(),request_id=NULL RETURNING id INTO token;
 RETURN result||jsonb_build_object('token',token);
END; $$;
REVOKE ALL ON FUNCTION private.generate_markdown_plan(uuid,text,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.generate_markdown_plan(uuid,text,date) TO authenticated;
CREATE FUNCTION public.generate_markdown_plan(p_product uuid,p_country text,p_deadline date) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.generate_markdown_plan(p_product,p_country,p_deadline); $$;
REVOKE ALL ON FUNCTION public.generate_markdown_plan(uuid,text,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.generate_markdown_plan(uuid,text,date) TO authenticated;

CREATE FUNCTION private.submit_markdown_plan(p_token uuid,p_stage integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE evidence private.markdown_plans%ROWTYPE; p public.products%ROWTYPE; stage jsonb; price_proposed numeric; request uuid; today date;
BEGIN
 SELECT * INTO evidence FROM private.markdown_plans WHERE id=p_token AND employee_id=auth.uid() FOR UPDATE;
 IF evidence.id IS NULL OR NOT private.markdown_scope(evidence.site_id,evidence.country_code) THEN RAISE EXCEPTION 'Plan is unavailable in your authorized scope' USING ERRCODE='42501'; END IF;
 IF evidence.request_id IS NOT NULL THEN RETURN jsonb_build_object('requestId',evidence.request_id,'saved',true); END IF;
 today:=(now() AT TIME ZONE CASE evidence.country_code WHEN 'ET' THEN 'Africa/Addis_Ababa' ELSE 'Africa/Nairobi' END)::date;
 IF evidence.created_at<now()-interval '15 minutes' OR evidence.deadline<=today THEN RAISE EXCEPTION 'Plan has expired. Generate a fresh plan'; END IF;
 SELECT * INTO p FROM public.products WHERE id=evidence.product_id FOR UPDATE;
 IF to_jsonb(p) IS DISTINCT FROM evidence.snapshot THEN RAISE EXCEPTION 'Product changed after planning. Refresh and generate a fresh plan' USING ERRCODE='40001'; END IF;
 IF p.expiry_date IS NOT NULL AND (p.expiry_date<=today OR evidence.deadline>p.expiry_date) THEN RAISE EXCEPTION 'Recorded expiry prevents this clearance plan'; END IF;
 IF p_stage IS NULL OR p_stage<0 OR p_stage>=jsonb_array_length(evidence.plan->'stages') THEN RAISE EXCEPTION 'Select a valid price stage'; END IF;
 stage:=evidence.plan->'stages'->p_stage; price_proposed:=(stage->>'price')::numeric;
 IF (stage->>'openingStock')::numeric<=0 OR price_proposed>=(evidence.plan->>'currentPrice')::numeric OR price_proposed<round(p.cost_price) THEN RAISE EXCEPTION 'Selected stage is not eligible for a markdown proposal'; END IF;
 -- Do not include hidden cost in the proposal. Existing approval logic loads the authoritative baseline.
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,proposed_changes,adjustment_reason)
 VALUES(p.id::text,p.name,p.sku,p.site_id::text,evidence.country_code,'edit','pending',
 jsonb_build_object('price',p.price,'salePrice',price_proposed,'isOnSale',true),
 'PRICE_CHANGE: Clearance proposal: price '||price_proposed||'; planning deadline '||evidence.deadline||'. Only this price is proposed; later stages are not scheduled.') RETURNING id INTO request;
 UPDATE private.markdown_plans SET request_id=request WHERE id=evidence.id;
 RETURN jsonb_build_object('requestId',request,'saved',true);
END; $$;
REVOKE ALL ON FUNCTION private.submit_markdown_plan(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.submit_markdown_plan(uuid,integer) TO authenticated;
CREATE FUNCTION public.submit_markdown_plan(p_token uuid,p_stage integer) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.submit_markdown_plan(p_token,p_stage); $$;
REVOKE ALL ON FUNCTION public.submit_markdown_plan(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_markdown_plan(uuid,integer) TO authenticated;
