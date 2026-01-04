-- Migration: Add warehouse_bonus_enabled and bonus_enabled columns to sites
-- These control whether each site participates in the gamification bonus programs

ALTER TABLE sites ADD COLUMN IF NOT EXISTS warehouse_bonus_enabled BOOLEAN DEFAULT true;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS bonus_enabled BOOLEAN DEFAULT true;

-- Comment for documentation
COMMENT ON COLUMN sites.warehouse_bonus_enabled IS 'Whether warehouse workers at this site can earn bonuses';
COMMENT ON COLUMN sites.bonus_enabled IS 'Whether POS staff at this site can earn bonuses';
