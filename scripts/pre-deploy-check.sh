#!/usr/bin/env bash
# ======================================================================
# pre-deploy-check.sh — run before every `git push` to production.
# Catches broken imports and dangerous prop threading at build time so a
# UI change can never silently take down the product grid.
#
#   bash scripts/pre-deploy-check.sh
# ======================================================================
set -euo pipefail

echo "→ Running pre-deploy safety checks..."

# 1. Build must pass
echo "  [1/4] Building..."
npm run build > /dev/null 2>&1
echo "  ✓ Build passed"

# 2. Grep for dangerous patterns
echo "  [2/4] Checking for dangerous prop threading..."
if grep -q "startProject" src/pages/stea-code/SteaCodeHomeV2.jsx 2>/dev/null; then
  echo "  ⚠ startProject prop present in SteaCodeHomeV2.jsx — verify grid still renders"
fi

# 3. Check that the critical preview imports are still present
echo "  [3/4] Verifying critical imports..."
for file in src/pages/stea-code/SteaCodeHomeV2.jsx; do
  for sym in "SteaCodeProductLivePreview" "SteaCodeProductSkeleton" "PreviewErrorBoundary"; do
    if ! grep -q "$sym" "$file"; then
      echo "  ✗ Missing critical import: $sym in $file"
      exit 1
    fi
  done
done
echo "  ✓ Critical imports present"

# 4. Bundle size sanity
echo "  [4/4] Checking bundle size..."
MAIN_JS=$(ls -t dist/assets/index-*.js 2>/dev/null | head -1)
if [ -n "$MAIN_JS" ]; then
  SIZE=$(du -k "$MAIN_JS" | cut -f1)
  if [ "$SIZE" -gt 1500 ]; then
    echo "  ⚠ Main bundle is ${SIZE} KB — usually under 1200 KB. Investigate."
  else
    echo "  ✓ Bundle size normal (${SIZE} KB)"
  fi
fi

echo "✓ Pre-deploy checks complete."
