#!/usr/bin/env bash
# Lifecycle hook: runs when an AI turn finishes.
# Removes .ai-working.lock so Vite can trigger a single clean reload of the finished work.

cat > /dev/null 2>&1 || true

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -n "$REPO_ROOT" ] && [ -d "$REPO_ROOT" ]; then
  LOCK_FILE="$REPO_ROOT/.ai-working.lock"
  if [ -f "$LOCK_FILE" ]; then
    rm -f "$LOCK_FILE" 2>/dev/null || true
  fi
fi

printf '{"decision":"allow"}\n'
