#!/bin/bash
# check-file-size.sh — Enforces the 500-line file limit from RULES.md
# Usage: npm run lint:size
# Exit code: 0 if all files pass, 1 if any file exceeds limit

set -euo pipefail

MAX_LINES=500
FAILED=0
COUNT=0
PASS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo "${BOLD}📏 SIIFMART File Size Check${NC}"
echo "${BOLD}   Max allowed: ${MAX_LINES} lines per file${NC}"
echo "───────────────────────────────────────────────────────"

while IFS= read -r file; do
    LINES=$(wc -l < "$file")
    COUNT=$((COUNT + 1))

    if [ "$LINES" -gt "$MAX_LINES" ]; then
        OVER=$((LINES - MAX_LINES))
        echo -e "${RED}  ✗ FAIL${NC}  ${file} — ${BOLD}${LINES} lines${NC} (${OVER} over limit)"
        FAILED=$((FAILED + 1))
    else
        PASS=$((PASS + 1))
    fi
done < <(find . \( -name '*.ts' -o -name '*.tsx' \) \
    ! -path '*/node_modules/*' \
    ! -path '*/dist/*' \
    ! -path '*/dev-dist/*' \
    ! -path '*/scratch/*' \
    ! -path '*/.agent/*' \
    ! -path '*/.agents/*' \
    ! -path '*/.claude/*' \
    ! -path '*/.backups/*' \
    | sort)

echo "───────────────────────────────────────────────────────"
echo "  Checked: ${COUNT} files"
echo -e "  ${GREEN}Passed:  ${PASS}${NC}"

if [ "$FAILED" -gt 0 ]; then
    echo -e "  ${RED}Failed:  ${FAILED}${NC}"
    echo ""
    echo -e "${RED}${BOLD}❌ ${FAILED} file(s) exceed the 500-line limit.${NC}"
    echo "   Split them per .agent/RULES.md:"
    echo "   • Modals → separate component files"
    echo "   • Tab content → separate component files"
    echo "   • Forms > 100 lines → extracted components"
    echo "   • Shared logic → hooks or utils"
    echo ""
    exit 1
else
    echo ""
    echo -e "${GREEN}${BOLD}✅ All files are within the 500-line limit!${NC}"
    echo ""
    exit 0
fi
