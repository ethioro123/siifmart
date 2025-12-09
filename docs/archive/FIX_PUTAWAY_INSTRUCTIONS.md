# 🚨 ACTION REQUIRED: Run SQL in Supabase

I attempted to run the migrations for you, but your Supabase project does not have the `exec_sql` helper function enabled, so I cannot modify the database structure remotely.

**You MUST run these 2 steps manually in your Supabase Dashboard:**

### 1. Open Supabase SQL Editor
Go to your Supabase Project → SQL Editor → New Query.

### 2. Run This SQL (Copy & Paste):

```sql
-- 1. Add the missing column (CRITICAL)
ALTER TABLE wms_jobs 
ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN wms_jobs.line_items IS 'Array of items to be processed in this job';

-- 2. Cleanup broken jobs
DELETE FROM wms_jobs WHERE line_items IS NULL OR jsonb_array_length(line_items) = 0;
```

### 3. Verify & Restart
1.  Click **RUN**.
2.  **Hard Refresh** your app (Cmd+Shift+R).
3.  Try receiving a PO again.

---

**Why this is needed:**
The "Putaway not working" issue is because the database was missing a place to store the items (`line_items` column). Without this, all jobs were being saved as empty, causing the crash.
