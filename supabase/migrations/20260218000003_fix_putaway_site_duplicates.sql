-- Fix products that have the wrong site_id (inherited from source product during putaway)
-- Handles unique constraint violations by merging duplicates
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    r RECORD;
    target_id UUID;
    moved_count INT := 0;
BEGIN
    -- Loop through products linked to Putaway IN movements where site_id is mismatched
    FOR r IN 
        SELECT p.id, p.sku, p.location, p.stock, sm.site_id as target_site_id
        FROM products p
        JOIN stock_movements sm ON p.id = sm.product_id
        WHERE sm.reason LIKE 'Putaway%' 
          AND sm.type = 'IN' 
          AND p.site_id != sm.site_id
    LOOP
        BEGIN
            -- Try to update site_id directly (Simple Case)
            UPDATE products SET site_id = r.target_site_id WHERE id = r.id;
            RAISE NOTICE 'Fixed site_id for % (No collision)', r.sku;
            
        EXCEPTION WHEN unique_violation THEN
            -- Collision! A record already exists at Target Site + Location
            -- Find that existing record
            SELECT id INTO target_id 
            FROM products 
            WHERE sku = r.sku 
              AND site_id = r.target_site_id 
              AND location = r.location
            LIMIT 1;
            
            IF target_id IS NOT NULL THEN
                -- Merge stock: Add wrong-record stock to correct-record stock
                UPDATE products SET stock = stock + r.stock WHERE id = target_id;
                
                -- Move the stock movement history to point to the correct product
                UPDATE stock_movements SET product_id = target_id WHERE product_id = r.id;
                
                -- Delete the duplicate/wrong record
                DELETE FROM products WHERE id = r.id;
                
                moved_count := moved_count + 1;
                RAISE NOTICE 'Merged duplicate product % (Stock: %) into existing record %', r.sku, r.stock, target_id;
            ELSE
                RAISE WARNING 'Unique violation for % but could not find target record. Skipping.', r.sku;
            END IF;
        END;
    END LOOP;
    
    RAISE NOTICE 'Completed. Merged % duplicates.', moved_count;
END $$;
