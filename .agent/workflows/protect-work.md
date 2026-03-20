---
description: Pre-AI session checklist to protect uncommitted work
---

# Pre-AI Session Checklist

Run this checklist **BEFORE** starting any AI coding session to protect your work.

## Quick Command (Copy & Paste)
```bash
# Run this single command before AI sessions:
./scripts/pre-ai-backup.sh
```

## Manual Checklist

### 1. Check for Uncommitted Work
```bash
git status
```
If you see modified files, proceed to step 2.

### 2. Commit or Stash Your Work
**Option A - Commit (Recommended):**
```bash
git add -A
git commit -m "WIP: [describe what you're working on]"
```

**Option B - Stash:**
```bash
git stash push -m "backup-$(date +%Y%m%d-%H%M%S)"
```

### 3. Create a Safety Branch (For Major Features)
```bash
git checkout -b backup/pre-ai-$(date +%Y%m%d-%H%M%S)
git checkout -  # Return to previous branch
```

### 4. Backup Critical Files Manually
```bash
cp pages/Fulfillment.tsx pages/Fulfillment.tsx.backup
cp services/supabase.service.ts services/supabase.service.ts.backup
```

## Recovery Commands

### If AI Breaks Something
```bash
# Undo all uncommitted changes
git checkout -- .

# Or restore from stash
git stash pop

# Or restore from backup branch
git checkout backup/pre-ai-TIMESTAMP -- path/to/file
```

### View Recent Stashes
```bash
git stash list
```

## Tell the AI
Always tell the AI assistant:
> "Check git status before making changes and warn me if there are uncommitted files."
