-- ============================================================================
-- Advanced Picking Control Enhancements
-- ============================================================================

BEGIN;

-- 1. ENUMS for Picking Strategies
DO $$ BEGIN
    CREATE TYPE fulfillment_strategy_type AS ENUM (
        'LOCAL_ONLY',   -- Only fulfill from the site where order was placed
        'NEAREST',      -- Fulfill from the nearest capable warehouse (current default)
        'SPLIT',        -- Split across multiple warehouses to fulfill the whole order
        'MANUAL'        -- Stay in "Pending Release" for human optimization
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update Sites Table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS "fulfillment_strategy" fulfillment_strategy_type DEFAULT 'NEAREST';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS "is_fulfillment_node" BOOLEAN DEFAULT true;

-- 3. Update Warehouse Zones Table
ALTER TABLE warehouse_zones ADD COLUMN IF NOT EXISTS "picking_priority" INTEGER DEFAULT 10; -- Lower = Higher Priority (Golden Zones)
ALTER TABLE warehouse_zones ADD COLUMN IF NOT EXISTS "zone_type" TEXT DEFAULT 'STANDARD'; -- e.g., 'COLD', 'HAZMAT', 'HIGH_VALUE'

-- 4. Update System Config Defaults
-- (Assuming system_config table or similar exists for global defaults)
-- If it doesn't exist, we skip or add it here.

-- 5. Add release_status to Sales for Manual workflow
ALTER TABLE sales ADD COLUMN IF NOT EXISTS "release_status" TEXT DEFAULT 'AUTOMATIC'; -- 'PENDING', 'RELEASED', 'AUTOMATIC'

COMMIT;
