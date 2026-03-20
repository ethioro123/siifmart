#!/bin/bash
# Auto-Save Daemon - Watches for file changes and backs them up automatically
# Run in background: ./scripts/auto-save-daemon.sh &
# Or add to package.json scripts

WATCH_DIR="${1:-.}"
BACKUP_BASE=".backups/auto"
INTERVAL=60  # Check every 60 seconds

echo "🔄 Auto-Save Daemon Started"
echo "   Watching: $WATCH_DIR"
echo "   Backup location: $BACKUP_BASE"
echo "   Interval: ${INTERVAL}s"
echo ""

# Create initial snapshot
LAST_HASH=""

save_snapshot() {
    local TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    local BACKUP_DIR="$BACKUP_BASE/$TIMESTAMP"
    
    # Get list of modified files (compared to last commit)
    local CHANGES=$(git status --porcelain 2>/dev/null | grep -E '^.M|^M.|^\?\?' | awk '{print $2}')
    
    if [ -z "$CHANGES" ]; then
        return 0
    fi
    
    # Calculate hash of current state
    local CURRENT_HASH=$(echo "$CHANGES" | xargs -I {} sh -c 'cat {} 2>/dev/null' | md5 2>/dev/null || md5sum 2>/dev/null | cut -d' ' -f1)
    
    # Only save if something changed
    if [ "$CURRENT_HASH" = "$LAST_HASH" ]; then
        return 0
    fi
    
    LAST_HASH="$CURRENT_HASH"
    
    mkdir -p "$BACKUP_DIR"
    
    echo "[$TIMESTAMP] 💾 Saving snapshot..."
    
    echo "$CHANGES" | while read -r file; do
        if [ -f "$file" ]; then
            mkdir -p "$BACKUP_DIR/$(dirname "$file")"
            cp "$file" "$BACKUP_DIR/$file"
        fi
    done
    
    # Keep a manifest
    echo "$CHANGES" > "$BACKUP_DIR/MANIFEST.txt"
    echo "   ✓ Backed up $(echo "$CHANGES" | wc -l | tr -d ' ') files"
    
    # Cleanup old backups (keep last 50)
    ls -dt "$BACKUP_BASE"/*/ 2>/dev/null | tail -n +51 | xargs rm -rf 2>/dev/null
}

cleanup() {
    echo ""
    echo "🛑 Auto-Save Daemon stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main loop
while true; do
    save_snapshot
    sleep $INTERVAL
done
