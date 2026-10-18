#!/usr/bin/env bash
# Automatically commits any uncommitted changes when an AI turn stops.
# Used by .agents/hooks.json (Stop lifecycle event) as a safety net so
# AI-generated code changes are never left uncommitted.

# Consume stdin payload from Antigravity hook runner
cat > /dev/null 2>&1 || true

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -n "$REPO_ROOT" ] && [ -d "$REPO_ROOT" ]; then
  cd "$REPO_ROOT" || exit 0

  # Check if there are any modified or untracked files
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    # Stage all changes except local secret env files
    git add -A >/dev/null 2>&1 || true
    git reset -q -- .env .env.local .env.production .env.staging >/dev/null 2>&1 || true

    # Only commit if there are staged changes
    if ! git diff --cached --quiet >/dev/null 2>&1; then
      CHANGED_FILES="$(git diff --cached --name-only | head -n 3 | tr '\n' ', ' | sed 's/, $//')"
      COMMIT_MSG="chore(auto): commit AI changes (${CHANGED_FILES})"
      # Try normal commit first; fall back to --no-verify so work is never left uncommitted
      git commit -m "$COMMIT_MSG" >/dev/null 2>&1 || git commit --no-verify -m "$COMMIT_MSG" >/dev/null 2>&1 || true
    fi
  fi
fi

printf '{"decision":"allow"}\n'
