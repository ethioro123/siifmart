#!/bin/bash
# scripts/setup-hooks.sh
# Sets up the git pre-commit hook in the repository.

set -euo pipefail

HOOK_SRC="scripts/git-pre-commit.sh"
HOOK_DEST=".git/hooks/pre-commit"

if [ ! -d ".git" ]; then
  echo "⚠️ Not a git repository or running from wrong directory. Skipping hook setup."
  exit 0
fi

echo "📦 Setting up git pre-commit hooks..."
cp "$HOOK_SRC" "$HOOK_DEST"
chmod +x "$HOOK_DEST"
echo "✅ Git pre-commit hook installed successfully at $HOOK_DEST"
