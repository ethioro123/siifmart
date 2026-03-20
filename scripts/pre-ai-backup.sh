#!/bin/bash
# Pre-AI Session Backup Script
# Run this before starting any AI coding session

set -e

BACKUP_DIR=".backups/$(date +%Y%m%d-%H%M%S)"
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

echo "🛡️  Pre-AI Session Backup"
echo "========================="

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not a git repository. Please run from project root."
    exit 1
fi

# Check for uncommitted changes
CHANGES=$(git status --porcelain)
if [ -z "$CHANGES" ]; then
    echo "✅ No uncommitted changes detected. Safe to proceed!"
    exit 0
fi

echo ""
echo "⚠️  Uncommitted changes detected:"
echo "$CHANGES"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup all modified files
echo "📦 Creating backups in $BACKUP_DIR..."
git status --porcelain | while read -r status file; do
    if [ -f "$file" ]; then
        # Create directory structure in backup
        mkdir -p "$BACKUP_DIR/$(dirname "$file")"
        cp "$file" "$BACKUP_DIR/$file"
        echo "   ✓ Backed up: $file"
    fi
done

# Create a git stash as additional protection
STASH_NAME="pre-ai-backup-$(date +%Y%m%d-%H%M%S)"
echo ""
echo "📚 Creating git stash: $STASH_NAME"
git stash push -m "$STASH_NAME" --keep-index

# Pop the stash immediately to keep working (but it's saved)
git stash pop --quiet

echo ""
echo "✅ Backup complete!"
echo ""
echo "📍 File backups: $BACKUP_DIR"
echo "📍 Git stash: $STASH_NAME (use 'git stash list' to see)"
echo ""
echo "🚀 Safe to proceed with AI session!"
echo ""
echo "To restore if needed:"
echo "   cp $BACKUP_DIR/path/to/file path/to/file"
echo "   OR"
echo "   git stash apply stash@{0}"
