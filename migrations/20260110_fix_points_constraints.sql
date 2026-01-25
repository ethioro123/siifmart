-- ============================================================================
-- FIX POINTS SYSTEM CONSTRAINTS
-- This migration fixes the type constraint on points_transactions table
-- and ensures proper handling of worker_points updates
-- ============================================================================

-- Drop existing constraint if it exists
ALTER TABLE IF EXISTS points_transactions
DROP CONSTRAINT IF EXISTS points_transactions_type_check;

-- Add correct constraint matching TypeScript types
ALTER TABLE points_transactions
ADD CONSTRAINT points_transactions_type_check
CHECK (type IN (
    'JOB_COMPLETE',
    'BONUS',
    'ACHIEVEMENT',
    'SPEED_BONUS',
    'ACCURACY_BONUS',
    'STREAK_BONUS'
));

-- Add site_id to worker_points if not already indexed properly
-- This helps with faster lookups and upserts
CREATE INDEX IF NOT EXISTS idx_worker_points_lookup
ON worker_points(employee_id, site_id);

-- Verification
DO $$
BEGIN
    RAISE NOTICE '✅ Points transaction type constraint updated';
    RAISE NOTICE '✅ Allowed types: JOB_COMPLETE, BONUS, ACHIEVEMENT, SPEED_BONUS, ACCURACY_BONUS, STREAK_BONUS';
    RAISE NOTICE '✅ Worker points index optimized';
END $$;
