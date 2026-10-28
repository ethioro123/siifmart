CREATE OR REPLACE FUNCTION public.list_product_price_history(p_site_id uuid,p_country_code text,p_product_id uuid,p_since timestamptz DEFAULT NULL,p_search text DEFAULT NULL,p_offset integer DEFAULT 0,p_limit integer DEFAULT 10)
RETURNS SETOF public.product_price_history LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT h.* FROM public.product_price_history h
 WHERE h.site_id=p_site_id AND h.country_code=upper(p_country_code) AND h.product_id=p_product_id
 AND (p_since IS NULL OR h.changed_at>=p_since)
 AND (nullif(btrim(p_search),'') IS NULL OR strpos(lower(concat_ws(' ',h.product_name,h.sku,h.actor_name,h.requester_name,h.finance_approver_name,h.reason,h.currency)),lower(btrim(left(p_search,200))))>0)
 ORDER BY h.changed_at DESC,h.id DESC OFFSET greatest(0,least(coalesce(p_offset,0),100000)) LIMIT greatest(1,least(coalesce(p_limit,10),50));
$$;
REVOKE ALL ON FUNCTION public.list_product_price_history(uuid,text,uuid,timestamptz,text,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_product_price_history(uuid,text,uuid,timestamptz,text,integer,integer) TO authenticated;
