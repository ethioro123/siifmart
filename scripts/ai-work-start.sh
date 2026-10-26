#!/usr/bin/env bash
# Lifecycle hook: runs before AI file write/edit tools.
# Creates .ai-working.lock so Vite pauses HMR/reloads while AI is modifying code.

cat > /dev/null 2>&1 || true

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -n "$REPO_ROOT" ] && [ -d "$REPO_ROOT" ]; then
  LOCK_FILE="$REPO_ROOT/.ai-working.lock"
  echo "{\"timestamp\":$(date +%s%3N),\"pid\":$$}" > "$LOCK_FILE" 2>/dev/null || true
fi

printf '{"decision":"allow"}\n'
