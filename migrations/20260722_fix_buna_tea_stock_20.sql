-- Migration: Complete 100% WMS Job & Movement Log History Alignment for Buna Tea (PA0001)

-- 1. Harar Logistics Hub (Warehouse): 300 units (Putaway Job OISF5F by Abebe Yilma on Jul 21 to A-02-02)
INSERT INTO products (id, site_id, sku, name, category, unit, size, brand, price, cost_price, stock, location, status)
VALUES ('8e5ef26f-2023-4b1b-8bf8-1b9701d96163', '96719be0-77de-4445-a8fe-e9713111255a', 'PA0001', 'Buna Tea', 'Pantry & Dry Goods', 'UNIT', '400', 'Buna', 500, 360, 300, 'A-02-02', 'active')
ON CONFLICT (site_id, sku) DO UPDATE SET stock = 300, unit = 'UNIT', size = '400', location = 'A-02-02';

-- 2. Adama Distribution Center (Warehouse): 310 units (Putaway Job HL0LHO by Helen Getachew on Jul 22: +330 - 20)
UPDATE products
SET stock = 310, unit = 'UNIT', size = '400', brand = 'Buna', location = 'E-02-01'
WHERE sku = 'PA0001' AND site_id = '97452359-705d-44dd-b2de-1002d6c19a81';

-- 3. BEDENO (Retail Store): 20 units (Transferred via Job QEGW31 from Adama DC on Jul 22)
UPDATE products
SET stock = 20, unit = 'UNIT', size = '400', brand = 'Buna', location = 'B-01-01'
WHERE sku = 'PA0001' AND site_id = 'e1db6eda-6c54-476d-9669-e7bfe3749c30';

-- 4. Dire Dawa Storage Facility (Warehouse): 30 units (Putaway Job DX5Q by Shukri Kamal on Feb 18 to A-05-04)
UPDATE products
SET stock = 30, unit = 'UNIT', size = '400', brand = 'Buna', location = 'A-05-04'
WHERE sku = 'PA0001' AND site_id = '1a76065e-fd57-4344-b2fe-9f7f0eb347a6';

-- 5. AMBO (Distribution Center): 2 units (Putaway Job VUQZ by Shukri Kamal, minus 28 via Pick Job IGFMB5)
UPDATE products
SET stock = 2, unit = 'UNIT', size = '400', brand = 'Buna', location = 'A-09-10'
WHERE sku = 'PA0001' AND site_id = 'b2293359-9b3b-4468-9c2f-8a6e288791e3';

-- 6. Merkato retail store (Store): 20 units (Registered Jul 17)
INSERT INTO products (id, site_id, sku, name, category, unit, size, brand, price, cost_price, stock, location, status)
VALUES ('7a1f3e98-d34a-4b13-94c7-b724b976a31b', '0e27440b-d6a3-40dc-b140-d7dbd5935de5', 'PA0001', 'Buna Tea', 'Pantry & Dry Goods', 'UNIT', '400', 'Buna', 500, 360, 20, 'General Area', 'active')
ON CONFLICT (site_id, sku) DO UPDATE SET stock = 20, unit = 'UNIT', size = '400';
