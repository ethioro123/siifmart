-- Replace all legacy POS receipt numbers with the canonical region/site sequence.
-- Sale dates and financial values remain unchanged. The prior reference is retained
-- in offline_receipt_number so old printed receipts remain searchable.
LOCK TABLE public.sales IN SHARE ROW EXCLUSIVE MODE;

ALTER TABLE public.sales DISABLE TRIGGER guard_sale_financial_mutation;
ALTER TABLE public.sales DISABLE TRIGGER update_sales_updated_at;

DO $backfill$
DECLARE
    sale_row record;
    next_number bigint;
BEGIN
    -- Seed each site counter from any receipt already using the regional format.
    INSERT INTO private.pos_receipt_sequences (country_code, site_id, last_number)
    SELECT upper(site.country), sale.site_id,
           max((regexp_match(
               sale.receipt_number,
               '^' || upper(region.code) || '-' || site.site_number::text || '([0-9]{6,})$'
           ))[1]::bigint)
    FROM public.sales AS sale
    JOIN public.sites AS site ON site.id = sale.site_id
    JOIN public.regions AS region
      ON upper(region.code) = upper(site.region_code)
     AND upper(region.country) = upper(site.country)
    WHERE sale.receipt_number ~ ('^' || upper(region.code) || '-' || site.site_number::text || '[0-9]{6,}$')
    GROUP BY upper(site.country), sale.site_id
    ON CONFLICT (country_code, site_id)
    DO UPDATE SET last_number = GREATEST(
        private.pos_receipt_sequences.last_number,
        EXCLUDED.last_number
    );

    -- Process each noncanonical number in a stable order and allocate a new number
    -- from that site's existing counter. Keep its former reference searchable.
    FOR sale_row IN
        SELECT sale.id,
               sale.site_id,
               upper(site.country) AS country_code,
               upper(region.code) AS region_code,
               site.site_number,
               sale.receipt_number AS old_receipt_number
        FROM public.sales AS sale
        JOIN public.sites AS site ON site.id = sale.site_id
        JOIN public.regions AS region
          ON upper(region.code) = upper(site.region_code)
         AND upper(region.country) = upper(site.country)
        WHERE sale.receipt_number IS NULL
           OR sale.receipt_number !~ ('^' || upper(region.code) || '-' || site.site_number::text || '[0-9]{6,}$')
        ORDER BY upper(site.country), sale.site_id, sale.sale_date NULLS LAST, sale.id
    LOOP
        INSERT INTO private.pos_receipt_sequences (country_code, site_id, last_number)
        VALUES (sale_row.country_code, sale_row.site_id, 1)
        ON CONFLICT (country_code, site_id)
        DO UPDATE SET last_number = private.pos_receipt_sequences.last_number + 1
        RETURNING last_number INTO next_number;

        UPDATE public.sales
        SET receipt_number = sale_row.region_code || '-' || sale_row.site_number::text || lpad(next_number::text, 6, '0'),
            offline_receipt_number = COALESCE(offline_receipt_number, sale_row.old_receipt_number)
        WHERE id = sale_row.id;
    END LOOP;
END;
$backfill$;

ALTER TABLE public.sales ENABLE TRIGGER guard_sale_financial_mutation;
ALTER TABLE public.sales ENABLE TRIGGER update_sales_updated_at;
