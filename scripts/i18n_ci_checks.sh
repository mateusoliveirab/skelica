#!/usr/bin/env bash
set -euo pipefail

echo "Running i18n CI checks..."

GL_LOCALE_FILE="glossary/en_glossary.json"
if [[ ! -f "$GL_LOCALE_FILE" ]]; then
  GL_LOCALE_FILE="../../glossary/en_glossary.json"
fi
if [[ ! -f "$GL_LOCALE_FILE" ]]; then
  echo "Glossary file $GL_LOCALE_FILE not found. Failing CI."
  exit 1
fi

# Collect keys used in code (extracts strings like t('key') from TS/TSX)
USED_KEYS=$(grep -R --include="*.ts" --include="*.tsx" -n -o "t('[^']*')" skelica/frontend/src | sed -E "s/.*t\('([^']*)'\).*/\1/" | tr '\n' ' ')

MISSING=()
for k in ${USED_KEYS}; do
  if ! grep -q "\"${k}\"" "$GL_LOCALE_FILE"; then
    MISSING+=("$k")
  fi
done

if [ ${#MISSING[@]} -ne 0 ]; then
  echo "Missing glossary keys: ${MISSING[*]}"
  exit 1
fi

echo "i18n CI checks passed."
exit 0
