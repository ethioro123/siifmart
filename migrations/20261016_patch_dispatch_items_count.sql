-- Data patch: Update items_count on wms_jobs of type 'DISPATCH' to match the total units of their line_items
UPDATE wms_jobs
SET items_count = (
    SELECT COALESCE(SUM((elem->>'expectedQty')::numeric), 0)::integer
    FROM jsonb_array_elements(line_items) AS elem
)
WHERE type = 'DISPATCH'
  AND line_items IS NOT NULL
  AND jsonb_array_length(line_items) > 0;
