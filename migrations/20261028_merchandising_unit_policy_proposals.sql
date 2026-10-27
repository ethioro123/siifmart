-- Specialists may propose selling-unit and stock-policy edits; three regional approvals still apply.
DO $migration$
DECLARE definition text; previous text;
BEGIN
 definition:=pg_get_functiondef('private.guard_merchandising_preparation()'::regprocedure);
 previous:=$previous$allowed_fields := ARRAY['name','category','brand','description','image','shelfPosition'];$previous$;
 IF position(previous IN definition)=0 THEN RAISE EXCEPTION 'Unexpected merchandising proposal guard'; END IF;
 EXECUTE replace(definition,previous,
 $replacement$allowed_fields := ARRAY['name','category','brand','description','image','shelfPosition',
 'unit','size','packQuantity','customAttributes','minStock','maxStock'];$replacement$);
END;
$migration$;
