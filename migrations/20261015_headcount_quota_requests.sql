-- Migration: Headcount Quota Increase Requests
-- Purpose: Allows Regional Managers & Regional HR to formally submit requests for 
-- temporary or permanent facility headcount quota adjustments to Corporate HQ.
-- HQ reviews, approves, and automatically updates the approved quota in facility_headcount_quotas.

CREATE TABLE IF NOT EXISTS headcount_quota_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id TEXT NOT NULL,
    site_name TEXT,
    region_code TEXT NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    role TEXT NOT NULL,
    current_quota INTEGER NOT NULL DEFAULT 5,
    requested_quota INTEGER NOT NULL,
    increase_amount INTEGER NOT NULL,
    request_type TEXT NOT NULL DEFAULT 'TEMPORARY_SURGE' CHECK (request_type IN ('TEMPORARY_SURGE', 'PERMANENT_EXPANSION')),
    reason TEXT NOT NULL,
    justification_metrics JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    requested_by TEXT NOT NULL,
    requested_by_role TEXT NOT NULL DEFAULT 'regional_manager',
    requested_at TIMESTAMPTZ DEFAULT now(),
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quota_req_site ON headcount_quota_requests(site_id);
CREATE INDEX IF NOT EXISTS idx_quota_req_region ON headcount_quota_requests(region_code);
CREATE INDEX IF NOT EXISTS idx_quota_req_country ON headcount_quota_requests(country_code);
CREATE INDEX IF NOT EXISTS idx_quota_req_status ON headcount_quota_requests(status);

-- Enable Row-Level Security
ALTER TABLE headcount_quota_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'headcount_quota_requests' AND policyname = 'Allow authenticated read on headcount_quota_requests'
    ) THEN
        CREATE POLICY "Allow authenticated read on headcount_quota_requests"
        ON headcount_quota_requests FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'headcount_quota_requests' AND policyname = 'Allow authenticated insert on headcount_quota_requests'
    ) THEN
        CREATE POLICY "Allow authenticated insert on headcount_quota_requests"
        ON headcount_quota_requests FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'headcount_quota_requests' AND policyname = 'Allow authenticated update on headcount_quota_requests'
    ) THEN
        CREATE POLICY "Allow authenticated update on headcount_quota_requests"
        ON headcount_quota_requests FOR UPDATE TO authenticated USING (true);
    END IF;
END $$;
