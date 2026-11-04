-- Regression fixtures roll back; no existing stock is moved.
BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
SELECT set_config('request.jwt.claim.role','service_role',true);
DO $$
DECLARE site uuid; zone uuid; first_product uuid:=gen_random_uuid(); second_product uuid:=gen_random_uuid(); third_product uuid:=gen_random_uuid();
 prefix text:='ETSCAN'||replace(gen_random_uuid()::text,'-','');
BEGIN
 SELECT id INTO site FROM public.sites WHERE code='ADD-DC-01' AND country='ET';
 ASSERT site IS NOT NULL;
 ASSERT NOT EXISTS(SELECT 1 FROM public.warehouse_zones WHERE site_id=site AND name='Zone Z');
 INSERT INTO public.warehouse_zones(site_id,name,type,capacity,occupied) VALUES(site,'Zone Z','Dry',1000000,0) RETURNING id INTO zone;
 INSERT INTO public.products(id,site_id,name,sku,category,price,cost_price,stock,status,location,approval_status)
 VALUES(first_product,site,'Receiving fixture',prefix||'1','General',0,10,0,'active','On Order','pending'),
       (second_product,site,'Scanned fixture',prefix||'2','General',0,10,0,'active','Z-97-95','pending');
 ASSERT EXISTS(SELECT 1 FROM public.products WHERE id=first_product AND location='On Order' AND zone_id IS NULL), 'Receiving location must not be invented from category';
 ASSERT EXISTS(SELECT 1 FROM public.products WHERE id=second_product AND location='Z-97-95' AND zone_id=zone), 'Explicit scanned location must be preserved';
 UPDATE public.products SET name='Renamed fixture' WHERE id=second_product;
 ASSERT EXISTS(SELECT 1 FROM public.products WHERE id=second_product AND location='Z-97-95' AND zone_id=zone), 'Catalog edits must not move a product';
 INSERT INTO public.products(id,site_id,name,sku,category,price,cost_price,stock,status,location,approval_status,zone_id)
 VALUES(third_product,site,'Zone A fixture',prefix||'3','General',0,10,0,'active','A-97-95','pending',zone);
 ASSERT EXISTS(SELECT 1 FROM public.products WHERE id=third_product AND location='A-97-95'), 'Zone A must not be silently rerouted';
 ASSERT NOT EXISTS(SELECT 1 FROM public.products p JOIN public.warehouse_zones z ON z.id=p.zone_id
   WHERE p.id IN(first_product,second_product,third_product) AND p.site_id<>z.site_id), 'Zone metadata must remain in the facility';
END $$;
ROLLBACK;
