-- Prevent POS sales and routine stock movements from bumping products.updated_at
-- so sold products do not falsely appear as "Product updates" in POS / POS Command.
BEGIN;

CREATE OR REPLACE FUNCTION public.update_products_catalog_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF (to_jsonb(NEW) - ARRAY['stock', 'status', 'stock_updated_at', 'sales_velocity', 'updated_at'])
     IS DISTINCT FROM
     (to_jsonb(OLD) - ARRAY['stock', 'status', 'stock_updated_at', 'sales_velocity', 'updated_at']) THEN
    NEW.updated_at = NOW();
  ELSE
    NEW.updated_at = OLD.updated_at;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_products_catalog_updated_at();

-- Reset false-positive updated_at values that were bumped by POS sales / stock movements
UPDATE public.products p
SET updated_at = GREATEST(
  p.created_at,
  COALESCE(p.price_updated_at, p.created_at),
  COALESCE(p.approved_at, p.created_at)
)
WHERE p.updated_at > GREATEST(
  p.created_at,
  COALESCE(p.price_updated_at, p.created_at),
  COALESCE(p.approved_at, p.created_at)
)
AND EXISTS (
  SELECT 1
  FROM public.stock_movements sm
  WHERE sm.product_id = p.id
);

COMMIT;
