-- Staging rollback-only regression: the reported PO has 60 + 180 audited placements.
BEGIN;
SET LOCAL statement_timeout='5s';
SELECT set_config('request.jwt.claim.sub','43866fc8-7fe0-4ffe-b406-22b74b8f8157',true),set_config('request.jwt.claims','{"sub":"43866fc8-7fe0-4ffe-b406-22b74b8f8157","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE result jsonb; again jsonb;
BEGIN
 IF EXISTS(SELECT 1 FROM public.purchase_orders WHERE id='73eb2d25-e909-45dd-8fd4-c157f973a6fa') THEN RAISE EXCEPTION 'Floor worker unexpectedly has procurement access'; END IF;
 result:=public.finalize_po_from_putaway('a611549b-6523-492c-b68b-066e45b09563');
 IF result->>'state'<>'synced' OR result->>'status'<>'Received' THEN RAISE EXCEPTION 'Full audited PO did not synchronize: %',result; END IF;
 IF result ? 'line_items' OR result ? 'expectedQty' OR result ? 'received_qty' THEN RAISE EXCEPTION 'Blind quantities leaked'; END IF;
 again:=public.finalize_po_from_putaway('a611549b-6523-492c-b68b-066e45b09563');
 IF again->>'changed'<>'false' THEN RAISE EXCEPTION 'Repeat synchronization was not idempotent'; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT received_qty FROM public.po_items WHERE id='16255784-f8fe-470f-832b-71d0e7d729a5')<>240 THEN RAISE EXCEPTION 'Audited receipt count was not persisted'; END IF;
END $$;
-- A partial receipt must not be promoted to fully Received.
UPDATE public.po_items SET quantity=25 WHERE id='16255784-f8fe-470f-832b-71d0e7d729a5';
SET LOCAL ROLE authenticated;
DO $$ DECLARE result jsonb; BEGIN
 result:=public.finalize_po_from_putaway('a611549b-6523-492c-b68b-066e45b09563');
 IF result->>'status'<>'Partially Received' THEN RAISE EXCEPTION 'Short order was closed as fully received'; END IF;
END $$;
RESET ROLE;
UPDATE public.po_items SET quantity=24 WHERE id='16255784-f8fe-470f-832b-71d0e7d729a5';
UPDATE public.wms_jobs SET status='In-Progress' WHERE id='a098fffd-bad6-442d-9e96-36309317ac35';
SET LOCAL ROLE authenticated;
DO $$ DECLARE result jsonb; BEGIN
 result:=public.finalize_po_from_putaway('a611549b-6523-492c-b68b-066e45b09563');
 IF result->>'state'<>'awaiting_putaway' THEN RAISE EXCEPTION 'Unfinished related job was ignored'; END IF;
END $$;
RESET ROLE;
UPDATE public.wms_jobs SET status='Completed' WHERE id='a098fffd-bad6-442d-9e96-36309317ac35';
UPDATE public.stock_movements SET reason=reason||' [rollback test]' WHERE reason='Putaway job a611549b-6523-492c-b68b-066e45b09563 line 0 to A-01-02';
SET LOCAL ROLE authenticated;
DO $$ DECLARE result jsonb; BEGIN
 result:=public.finalize_po_from_putaway('a611549b-6523-492c-b68b-066e45b09563');
 IF result->>'state'<>'needs_review' THEN RAISE EXCEPTION 'Unverified placement was trusted'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','af5081f6-d2a9-4fd4-9617-7fad9c4f91f9',true),set_config('request.jwt.claims','{"sub":"af5081f6-d2a9-4fd4-9617-7fad9c4f91f9","role":"authenticated"}',true);
DO $$ DECLARE denied boolean:=false; BEGIN
 BEGIN PERFORM public.finalize_po_from_putaway('a611549b-6523-492c-b68b-066e45b09563');
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Unassigned worker could finalize another job'; END IF;
END $$;
ROLLBACK;
