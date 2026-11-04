-- Match configured low-stock thresholds and the existing default of ten units.
CREATE OR REPLACE VIEW public.inventory_product_summary WITH (security_invoker=true) AS
WITH totals AS (
 SELECT site_id,country_code,inventory_key,is_archived,sum(coalesce(stock,0)) AS total_stock,
 count(DISTINCT location) FILTER(WHERE stock>0 AND nullif(btrim(location),'') IS NOT NULL AND location<>'On Order') AS location_count,
 string_agg(DISTINCT coalesce(location,''),' ') AS location_search
 FROM public.inventory_stock_locations GROUP BY site_id,country_code,inventory_key,is_archived
), representatives AS (
 SELECT DISTINCT ON(site_id,country_code,inventory_key,is_archived) l.*
 FROM public.inventory_stock_locations l
 ORDER BY site_id,country_code,inventory_key,is_archived,(coalesce(stock,0)>0) DESC,
 (nullif(btrim(location),'') IS NOT NULL AND location<>'On Order') DESC,created_at,id
)
SELECT r.id,
 r.site_id,
 r.name,
 r.sku,
 r.category,
 r.price,
 r.cost_price,
 r.sale_price,
 r.is_on_sale,
 t.total_stock AS stock,
 CASE WHEN r.is_archived THEN 'archived' WHEN t.total_stock<=0 THEN 'out_of_stock' WHEN t.total_stock<(CASE WHEN coalesce(r.min_stock,0)>0 THEN r.min_stock ELSE 10 END) THEN 'low_stock' ELSE 'active' END AS status,
 r.location,
 r.expiry_date,
 r.batch_number,
 r.shelf_position,
 r.competitor_price,
 r.sales_velocity,
 r.image,
 r.created_at,
 r.updated_at,
 r.barcode,
 r.barcode_type,
 r.brand,
 r.size,
 r.unit,
 r.pack_quantity,
 r.approval_status,
 r.barcodes,
 r.price_updated_at,
 r.old_price,
 r.product_id,
 r.custom_attributes,
 r.description,
 r.min_stock,
 r.max_stock,
 r.pos_received_at,
 r.pos_received_by,
 r.stock AS location_stock,t.location_count,t.location_search,r.country_code,r.inventory_key
FROM representatives r JOIN totals t USING(site_id,country_code,inventory_key,is_archived);
