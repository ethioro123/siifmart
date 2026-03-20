-- Add movement rule columns if they don't exist
ALTER TABLE warehouse_zones 
ADD COLUMN IF NOT EXISTS allow_picking BOOLEAN DEFAULT TRUE;

ALTER TABLE warehouse_zones 
ADD COLUMN IF NOT EXISTS allow_putaway BOOLEAN DEFAULT TRUE;

-- Add capacity tracking columns if they don't exist
ALTER TABLE warehouse_zones 
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0;

ALTER TABLE warehouse_zones 
ADD COLUMN IF NOT EXISTS occupied INTEGER DEFAULT 0;

-- Ensure constraints (optional but good practice)
-- ALTER TABLE warehouse_zones ADD CONSTRAINT check_capacity_positive CHECK (capacity >= 0);
-- ALTER TABLE warehouse_zones ADD CONSTRAINT check_occupied_positive CHECK (occupied >= 0);
