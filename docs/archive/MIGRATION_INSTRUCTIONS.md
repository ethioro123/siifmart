# 🚀 Job Assignments Migration - Manual Steps

## ⚠️ Automatic Migration Not Possible

The Supabase JavaScript client doesn't support executing raw DDL SQL statements.
You need to run the migration manually in the Supabase SQL Editor.

---

## 📋 Step-by-Step Instructions

### 1. Open Supabase Dashboard
🔗 **URL**: https://zdgzpxvorwinugjufkvb.supabase.co

### 2. Navigate to SQL Editor
- Click on **"SQL Editor"** in the left sidebar
- Or go to: https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql

### 3. Create New Query
- Click **"New Query"** button
- Give it a name: "Create Job Assignments Table"

### 4. Copy the SQL
- Open file: `create_job_assignments_table.sql`
- Select all (Cmd+A)
- Copy (Cmd+C)

### 5. Paste and Run
- Paste into the SQL Editor
- Click **"Run"** button (or press Cmd+Enter)

### 6. Verify Success
You should see messages like:
```
CREATE TABLE
CREATE INDEX
CREATE TRIGGER
CREATE POLICY
...
Success. No rows returned
```

---

## ✅ Quick Copy-Paste

**File Location:**
```
/Users/shukriidriss/Downloads/siifmart 80/create_job_assignments_table.sql
```

**Or use this command to copy to clipboard:**
```bash
cat create_job_assignments_table.sql | pbcopy
```

Then just paste in Supabase SQL Editor and click Run!

---

## 🔍 Verification

After running, verify the table exists:

```sql
SELECT * FROM job_assignments LIMIT 1;
```

Should return: "Success. No rows returned" (table is empty but exists)

---

## 🎯 What This Creates

1. **Table**: `job_assignments`
   - Tracks who is assigned to which job
   - Records start/completion times
   - Stores performance metrics

2. **Indexes**: 
   - Fast lookups by job_id, employee_id, status
   - Optimized date sorting

3. **Triggers**:
   - Auto-update `updated_at` timestamp
   - Auto-calculate `actual_duration` when completed

4. **RLS Policies**:
   - Site-based access control
   - Role-based permissions

5. **Views**:
   - `active_job_assignments` - Real-time active jobs
   - `employee_performance_metrics` - Performance analytics

---

## 🚨 Troubleshooting

### Error: "relation already exists"
The table already exists! You're good to go.

### Error: "permission denied"
Make sure you're logged in as the project owner or have admin access.

### Error: "syntax error"
Make sure you copied the entire SQL file, including all statements.

---

## ✨ After Migration

Once successful, you can:

1. **Test assignment in code:**
   ```typescript
   await assignJob(jobId, employeeId);
   ```

2. **View assignments in database:**
   - Go to Table Editor → job_assignments

3. **Query performance metrics:**
   ```sql
   SELECT * FROM employee_performance_metrics;
   ```

---

**Ready?** Open the Supabase dashboard and paste the SQL! 🚀
