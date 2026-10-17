#!/usr/bin/env bash
# ======================================================================
# smoke-test.sh — run after every production deploy to verify the live
# site (homepage + catalog + previews) is actually working. If it fails,
# revert immediately.
#
#   SITE_URL=https://steacode.com bash scripts/smoke-test.sh
# ======================================================================
set -euo pipefail

SITE="${SITE_URL:-https://steacode.com}"
echo "→ Smoke testing $SITE..."

# 1. Homepage responds
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/")
if [ "$HTTP" != "200" ]; then
  echo "  ✗ Homepage returned HTTP $HTTP"
  exit 1
fi
echo "  ✓ Homepage: 200"

# 2. Catalog API returns products
COUNT=$(curl -s "$SITE/api/stea-code/catalog?scope=homepage" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('products',[])))")
if [ "$COUNT" -lt 100 ]; then
  echo "  ✗ Catalog returned only $COUNT products (expected 100+)"
  exit 1
fi
echo "  ✓ Catalog: $COUNT products"

# 3. First product has a preview
HAS_PREVIEW=$(curl -s "$SITE/api/stea-code/catalog?scope=homepage" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d['products'][0]; print('yes' if (p.get('preview') or {}).get('fullDocument') else 'no')")
if [ "$HAS_PREVIEW" != "yes" ]; then
  echo "  ✗ First product has no preview.fullDocument"
  exit 1
fi
echo "  ✓ First product has preview"

echo "✓ Smoke test passed."
