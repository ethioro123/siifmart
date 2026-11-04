-- Restore the user-confirmed saved ADA-WH-01 layout to the production facility.
-- Source: staging ADA-WH-01, inspected 4 November 2026. No employee/product data copied.
-- Existing zones are preserved; re-running adds no duplicate names.
LOCK TABLE public.warehouse_zones IN SHARE ROW EXCLUSIVE MODE;
DO $$
BEGIN
  IF (SELECT count(*) FROM public.sites WHERE code='ADA-WH-01' AND country='ET' AND type='Warehouse') <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one ET warehouse with code ADA-WH-01';
  END IF;
END $$;
WITH layout AS (
  SELECT * FROM jsonb_to_recordset($layout$[{"name":"Zone A","type":"Dry","zone_type":"RECEIVING","temperature":null,"capacity":5000,"picking_priority":1,"allow_picking":true,"allow_putaway":true,"is_locked":false,"lock_reason":null,"specialization":null,"aisle_specializations":{},"accepted_categories":[],"aisle_categories":{}},{"name":"Zone B","type":"Dry","zone_type":"BULK","temperature":null,"capacity":25000,"picking_priority":10,"allow_picking":true,"allow_putaway":true,"is_locked":false,"lock_reason":null,"specialization":null,"aisle_specializations":{},"accepted_categories":[],"aisle_categories":{}},{"name":"Zone C","type":"Dry","zone_type":"STANDARD","temperature":null,"capacity":10000,"picking_priority":3,"allow_picking":true,"allow_putaway":true,"is_locked":false,"lock_reason":null,"specialization":null,"aisle_specializations":{},"accepted_categories":[],"aisle_categories":{}},{"name":"Zone D","type":"Dry","zone_type":"STANDARD","temperature":null,"capacity":15000,"picking_priority":5,"allow_picking":true,"allow_putaway":true,"is_locked":false,"lock_reason":null,"specialization":null,"aisle_specializations":{},"accepted_categories":[],"aisle_categories":{}},{"name":"Zone E","type":"Cold","zone_type":"CHILLED","temperature":"4°C","capacity":8000,"picking_priority":6,"allow_picking":true,"allow_putaway":true,"is_locked":false,"lock_reason":null,"specialization":null,"aisle_specializations":{},"accepted_categories":[],"aisle_categories":{}},{"name":"Zone F","type":"Cold","zone_type":"FREEZER","temperature":"-18°C","capacity":6000,"picking_priority":8,"allow_picking":true,"allow_putaway":true,"is_locked":false,"lock_reason":null,"specialization":null,"aisle_specializations":{},"accepted_categories":[],"aisle_categories":{}},{"name":"Zone G","type":"Secure","zone_type":"HIGH_VALUE","temperature":null,"capacity":2000,"picking_priority":4,"allow_picking":true,"allow_putaway":true,"is_locked":false,"lock_reason":null,"specialization":null,"aisle_specializations":{},"accepted_categories":[],"aisle_categories":{}},{"name":"Zone H","type":"Dry","zone_type":"QUARANTINE","temperature":null,"capacity":3000,"picking_priority":9,"allow_picking":true,"allow_putaway":true,"is_locked":false,"lock_reason":null,"specialization":null,"aisle_specializations":{},"accepted_categories":[],"aisle_categories":{}},{"name":"Zone I","type":"Dry","zone_type":"STAGING","temperature":null,"capacity":5000,"picking_priority":2,"allow_picking":true,"allow_putaway":true,"is_locked":false,"lock_reason":null,"specialization":null,"aisle_specializations":{},"accepted_categories":[],"aisle_categories":{}},{"name":"Zone J","type":"Dry","zone_type":"SHIPPING","temperature":null,"capacity":4000,"picking_priority":1,"allow_picking":true,"allow_putaway":true,"is_locked":false,"lock_reason":null,"specialization":null,"aisle_specializations":{},"accepted_categories":[],"aisle_categories":{}}]$layout$::jsonb)
  AS value(name text,type text,zone_type text,temperature text,capacity integer,picking_priority integer,
    allow_picking boolean,allow_putaway boolean,is_locked boolean,lock_reason text,
    specialization text,aisle_specializations jsonb,accepted_categories text[],aisle_categories jsonb)
)
INSERT INTO public.warehouse_zones
(name,site_id,type,zone_type,temperature,capacity,occupied,picking_priority,allow_picking,allow_putaway,
 is_locked,lock_reason,specialization,aisle_specializations,accepted_categories,aisle_categories)
SELECT l.name,s.id,l.type,l.zone_type,l.temperature,l.capacity,
  COALESCE((SELECT sum(p.stock) FROM public.products p
    WHERE p.site_id=s.id AND p.location LIKE right(l.name,1)||'-%' AND p.stock>0),0),
  l.picking_priority,l.allow_picking,l.allow_putaway,l.is_locked,l.lock_reason,
  l.specialization,l.aisle_specializations,l.accepted_categories,l.aisle_categories
FROM layout l
JOIN public.sites s ON s.code='ADA-WH-01' AND s.country='ET' AND s.type='Warehouse'
WHERE NOT EXISTS (SELECT 1 FROM public.warehouse_zones z WHERE z.site_id=s.id AND z.name=l.name);

