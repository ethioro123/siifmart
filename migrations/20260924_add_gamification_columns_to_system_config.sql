-- Migration: Add gamification and bonus configuration columns to system_config
-- These store global settings for warehouse worker points rules, POS store bonus tiers, and role distributions.

ALTER TABLE system_config ADD COLUMN IF NOT EXISTS bonus_enabled BOOLEAN DEFAULT true;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS bonus_tiers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS bonus_payout_frequency TEXT DEFAULT 'monthly';
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS warehouse_points_eligible_roles JSONB DEFAULT '[]'::jsonb;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS warehouse_point_rules JSONB DEFAULT '[]'::jsonb;

ALTER TABLE system_config ADD COLUMN IF NOT EXISTS pos_bonus_enabled BOOLEAN DEFAULT true;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS pos_bonus_tiers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS pos_bonus_payout_frequency TEXT DEFAULT 'monthly';
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS pos_role_distribution JSONB DEFAULT '[]'::jsonb;
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS pos_point_rules JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN system_config.bonus_enabled IS 'Global toggle for warehouse worker gamification and bonuses';
COMMENT ON COLUMN system_config.bonus_tiers IS 'JSON array of warehouse worker bonus tiers';
COMMENT ON COLUMN system_config.bonus_payout_frequency IS 'Warehouse bonus payout cycle: weekly, biweekly, monthly';
COMMENT ON COLUMN system_config.warehouse_points_eligible_roles IS 'Roles eligible for warehouse gamification points';
COMMENT ON COLUMN system_config.warehouse_point_rules IS 'Custom point rules for warehouse job actions (PICK, PACK, ACCURACY, etc.)';

COMMENT ON COLUMN system_config.pos_bonus_enabled IS 'Global toggle for POS store team bonuses';
COMMENT ON COLUMN system_config.pos_bonus_tiers IS 'JSON array of POS store team bonus tiers';
COMMENT ON COLUMN system_config.pos_bonus_payout_frequency IS 'POS bonus payout cycle: weekly, biweekly, monthly';
COMMENT ON COLUMN system_config.pos_role_distribution IS 'Percentage distribution of store bonus across staff roles';
COMMENT ON COLUMN system_config.pos_point_rules IS 'Custom point rules for POS transactions, categories, and revenue';
