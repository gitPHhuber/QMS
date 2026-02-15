#!/bin/bash
# scan_placeholders.sh — Scan QMS .docx (text/UTF-8) files for unfilled placeholders
# Usage: ./tools/scan_placeholders.sh [directory]
# Default directory: docs/qms/

DIR="${1:-docs/qms}"
TOTAL_FILES=0
TOTAL_HITS=0

echo "============================================="
echo "  DOC-003: Placeholder Scan Report"
echo "  Directory: $DIR"
echo "  Date: $(date '+%Y-%m-%d %H:%M')"
echo "============================================="
echo ""

for f in "$DIR"/*.docx; do
  [ -f "$f" ] || continue
  TOTAL_FILES=$((TOTAL_FILES + 1))
  FNAME=$(basename "$f")
  HITS=$(grep -cn 'ФИО\|___\|202_г\|________' "$f" 2>/dev/null || echo 0)

  if [ "$HITS" -gt 0 ]; then
    echo "Файл: $FNAME"
    grep -n 'ФИО\|___\|202_г\|________' "$f" | while IFS= read -r line; do
      echo "  - Строка $line"
      TOTAL_HITS=$((TOTAL_HITS + 1))
    done
    echo ""
  fi
  TOTAL_HITS=$((TOTAL_HITS + HITS))
done

echo "============================================="
echo "  Итого: $TOTAL_FILES файлов просканировано"
echo "  Найдено строк с плейсхолдерами: $TOTAL_HITS"
echo "============================================="
