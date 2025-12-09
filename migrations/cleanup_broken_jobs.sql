-- Cleanup broken WMS jobs that have no line items
-- These jobs were created before the line_items column existed

DELETE FROM wms_jobs WHERE line_items IS NULL OR jsonb_array_length(line_items) = 0;
