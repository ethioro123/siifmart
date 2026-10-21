CREATE TABLE IF NOT EXISTS public.product_price_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL,
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
    country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
    product_name text NOT NULL,
    sku text NOT NULL,
    old_regular_price numeric NOT NULL,
    new_regular_price numeric NOT NULL,
    old_sale_price numeric,
    new_sale_price numeric,
    old_is_on_sale boolean NOT NULL,
    new_is_on_sale boolean NOT NULL,
    old_effective_price numeric NOT NULL,
    new_effective_price numeric NOT NULL,
    actor_id uuid,
    actor_name text,
    changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_price_history_site_changed
    ON public.product_price_history (site_id, changed_at DESC);

ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_price_history FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.product_price_history TO authenticated;

DROP POLICY IF EXISTS product_price_history_read_scoped ON public.product_price_history;
CREATE POLICY product_price_history_read_scoped
    ON public.product_price_history
    FOR SELECT
    TO authenticated
    USING ((SELECT public.is_site_in_my_authorized_scope(site_id::text, country_code)));

CREATE TABLE IF NOT EXISTS public.product_price_history_reviews (
    history_id uuid NOT NULL REFERENCES public.product_price_history(id) ON DELETE CASCADE,
    reviewer_id uuid NOT NULL,
    reviewed_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (history_id, reviewer_id)
);

ALTER TABLE public.product_price_history_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_price_history_reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.product_price_history_reviews TO authenticated;

DROP POLICY IF EXISTS product_price_history_reviews_read_self ON public.product_price_history_reviews;
CREATE POLICY product_price_history_reviews_read_self
    ON public.product_price_history_reviews
    FOR SELECT
    TO authenticated
    USING (
        reviewer_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1
            FROM public.product_price_history h
            WHERE h.id = history_id
              AND public.is_site_in_my_authorized_scope(h.site_id::text, h.country_code)
        )
    );

DROP POLICY IF EXISTS product_price_history_reviews_insert_self ON public.product_price_history_reviews;
CREATE POLICY product_price_history_reviews_insert_self
    ON public.product_price_history_reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (
        reviewer_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1
            FROM public.product_price_history h
            WHERE h.id = history_id
              AND public.is_site_in_my_authorized_scope(h.site_id::text, h.country_code)
        )
    );

CREATE OR REPLACE FUNCTION public.stamp_product_effective_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_old_effective numeric;
    v_new_effective numeric;
BEGIN
    v_old_effective := CASE
        WHEN OLD.is_on_sale IS TRUE AND COALESCE(OLD.sale_price, 0) > 0 THEN OLD.sale_price
        ELSE OLD.price
    END;
    v_new_effective := CASE
        WHEN NEW.is_on_sale IS TRUE AND COALESCE(NEW.sale_price, 0) > 0 THEN NEW.sale_price
        ELSE NEW.price
    END;

    IF v_old_effective IS DISTINCT FROM v_new_effective THEN
        NEW.old_price := v_old_effective;
        NEW.price_updated_at := now();
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_product_effective_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_old_effective numeric;
    v_new_effective numeric;
    v_country text;
    v_actor_name text;
BEGIN
    v_old_effective := CASE
        WHEN OLD.is_on_sale IS TRUE AND COALESCE(OLD.sale_price, 0) > 0 THEN OLD.sale_price
        ELSE OLD.price
    END;
    v_new_effective := CASE
        WHEN NEW.is_on_sale IS TRUE AND COALESCE(NEW.sale_price, 0) > 0 THEN NEW.sale_price
        ELSE NEW.price
    END;

    IF v_old_effective IS NOT DISTINCT FROM v_new_effective OR NEW.site_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT upper(s.country) INTO v_country
    FROM public.sites s
    WHERE s.id = NEW.site_id;

    IF v_country IS NULL THEN
        RAISE EXCEPTION 'Cannot record product price history without a valid site country';
    END IF;

    SELECT e.name INTO v_actor_name
    FROM public.employees e
    WHERE e.id = auth.uid()
    LIMIT 1;

    INSERT INTO public.product_price_history (
        product_id, site_id, country_code, product_name, sku,
        old_regular_price, new_regular_price, old_sale_price, new_sale_price,
        old_is_on_sale, new_is_on_sale, old_effective_price, new_effective_price,
        actor_id, actor_name, changed_at
    ) VALUES (
        NEW.id, NEW.site_id, v_country, NEW.name, NEW.sku,
        OLD.price, NEW.price, OLD.sale_price, NEW.sale_price,
        COALESCE(OLD.is_on_sale, false), COALESCE(NEW.is_on_sale, false),
        v_old_effective, v_new_effective, auth.uid(),
        COALESCE(v_actor_name, auth.jwt() ->> 'email', 'System update'), now()
    );

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.stamp_product_effective_price_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_product_effective_price_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS products_stamp_effective_price_change ON public.products;
CREATE TRIGGER products_stamp_effective_price_change
    BEFORE UPDATE OF price, sale_price, is_on_sale ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.stamp_product_effective_price_change();

DROP TRIGGER IF EXISTS products_record_effective_price_change ON public.products;
CREATE TRIGGER products_record_effective_price_change
    AFTER UPDATE OF price, sale_price, is_on_sale ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.record_product_effective_price_change();

CREATE OR REPLACE FUNCTION public.count_unreviewed_product_price_history(
    p_site_id uuid,
    p_since timestamptz
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT count(*)::bigint
    FROM public.product_price_history h
    WHERE h.site_id = p_site_id
      AND h.changed_at >= p_since
      AND NOT EXISTS (
          SELECT 1
          FROM public.product_price_history_reviews r
          WHERE r.history_id = h.id
            AND r.reviewer_id = auth.uid()
      );
$$;

REVOKE ALL ON FUNCTION public.count_unreviewed_product_price_history(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.count_unreviewed_product_price_history(uuid, timestamptz) TO authenticated;
