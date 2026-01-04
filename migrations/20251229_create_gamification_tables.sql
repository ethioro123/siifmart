-- Migration: Create gamification tables for worker and store points
-- These tables track the points, achievements, and bonus info for gamification
-- NOTE: Foreign key constraints removed for flexibility - validate at app level

-- ============================================================
-- WORKER POINTS TABLE (Individual warehouse worker points)
-- ============================================================
CREATE TABLE IF NOT EXISTS worker_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    employee_avatar TEXT,
    
    -- Points breakdown
    total_points INTEGER DEFAULT 0 NOT NULL,
    weekly_points INTEGER DEFAULT 0 NOT NULL,
    monthly_points INTEGER DEFAULT 0 NOT NULL,
    today_points INTEGER DEFAULT 0 NOT NULL,
    
    -- Job stats
    total_jobs_completed INTEGER DEFAULT 0 NOT NULL,
    total_items_picked INTEGER DEFAULT 0 NOT NULL,
    average_accuracy DECIMAL(5,2) DEFAULT 0 NOT NULL,
    average_time_per_job DECIMAL(10,2) DEFAULT 0 NOT NULL,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    
    -- Time tracking
    last_job_completed_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Achievements (stored as JSONB array)
    achievements JSONB DEFAULT '[]'::jsonb NOT NULL,
    
    -- Rank and level
    rank INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    level_title TEXT DEFAULT 'Rookie' NOT NULL,
    
    -- Bonus info
    current_bonus_tier TEXT,
    estimated_bonus DECIMAL(12,2) DEFAULT 0,
    bonus_period_points INTEGER DEFAULT 0,
    
    -- Constraints
    UNIQUE(employee_id, site_id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_worker_points_employee ON worker_points(employee_id);
CREATE INDEX IF NOT EXISTS idx_worker_points_site ON worker_points(site_id);
CREATE INDEX IF NOT EXISTS idx_worker_points_total ON worker_points(total_points DESC);

-- ============================================================
-- STORE POINTS TABLE (Team-based POS store points)
-- ============================================================
CREATE TABLE IF NOT EXISTS store_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id TEXT NOT NULL UNIQUE,
    site_name TEXT NOT NULL,
    
    -- Points breakdown
    total_points INTEGER DEFAULT 0 NOT NULL,
    weekly_points INTEGER DEFAULT 0 NOT NULL,
    monthly_points INTEGER DEFAULT 0 NOT NULL,
    today_points INTEGER DEFAULT 0 NOT NULL,
    
    -- Store stats
    total_transactions INTEGER DEFAULT 0 NOT NULL,
    total_revenue DECIMAL(15,2) DEFAULT 0 NOT NULL,
    average_ticket_size DECIMAL(12,2) DEFAULT 0 NOT NULL,
    customer_satisfaction DECIMAL(5,2) DEFAULT 0 NOT NULL,
    
    -- Time tracking
    last_transaction_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Current tier and bonus
    current_tier TEXT,
    estimated_bonus DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_store_points_site ON store_points(site_id);
CREATE INDEX IF NOT EXISTS idx_store_points_total ON store_points(total_points DESC);

-- ============================================================
-- POINTS TRANSACTIONS TABLE (Audit log of all point awards)
-- ============================================================
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who received points
    employee_id TEXT,
    site_id TEXT,
    
    -- Transaction details
    points INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    job_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_points_trans_employee ON points_transactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_points_trans_site ON points_transactions(site_id);
CREATE INDEX IF NOT EXISTS idx_points_trans_created ON points_transactions(created_at DESC);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE worker_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Read policy for authenticated users
CREATE POLICY "Allow authenticated read access to worker_points" ON worker_points
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Allow authenticated read access to store_points" ON store_points
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "Allow authenticated read access to points_transactions" ON points_transactions
    FOR SELECT TO authenticated USING (true);

-- Write policy for authenticated users
CREATE POLICY "Allow authenticated write access to worker_points" ON worker_points
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
    
CREATE POLICY "Allow authenticated write access to store_points" ON store_points
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
    
CREATE POLICY "Allow authenticated write access to points_transactions" ON points_transactions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================
COMMENT ON TABLE worker_points IS 'Tracks individual warehouse worker points for gamification';
COMMENT ON TABLE store_points IS 'Tracks team-based store points for POS gamification';
COMMENT ON TABLE points_transactions IS 'Audit log of all point awards and adjustments';
