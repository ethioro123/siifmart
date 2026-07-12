#!/bin/sh
# scripts/git-pre-commit.sh
# Git pre-commit hook to enforce the 500-line limit from RULES.md

echo "🔍 Running pre-commit file size check..."
npm run lint:size

RESULT=$?
if [ $RESULT -ne 0 ]; then
  echo "❌ Commit rejected! One or more files exceed the 500-line limit."
  exit 1
fi

exit 0
