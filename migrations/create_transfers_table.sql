-- ============================================================================
-- TRANSFERS TABLE
-- ============================================================================
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_site_id UUID REFERENCES sites(id),
  dest_site_id UUID REFERENCES sites(id),
  status VARCHAR(20) DEFAULT 'Requested' CHECK (status IN ('Requested', 'In-Transit', 'Completed', 'Rejected')),
  transfer_date DATE DEFAULT CURRENT_DATE,
  items JSONB NOT NULL, -- Storing items as JSONB for simplicity
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transfers_source ON transfers(source_site_id);
CREATE INDEX idx_transfers_dest ON transfers(dest_site_id);
CREATE INDEX idx_transfers_status ON transfers(status);

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON transfers FOR ALL USING (auth.role() = 'authenticated');
