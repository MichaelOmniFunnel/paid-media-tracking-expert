#!/usr/bin/env bash
# psi-fetch.sh — Fetch PageSpeed Insights API v5 data for a URL
# Usage: bash scripts/psi-fetch.sh <url> <strategy> <api_key> <output_path>
# Example: bash scripts/psi-fetch.sh "https://web.dev" "MOBILE" "AIza..." "test.json"

set -euo pipefail

# --- Arguments ---
URL="${1:?Usage: psi-fetch.sh <url> <strategy> <api_key> <output_path>}"
STRATEGY="${2:-MOBILE}"
API_KEY="${3:-}"
OUTPUT_PATH="${4:-psi-result.json}"

# --- Validate ---
if [[ -z "$API_KEY" ]]; then
  echo "ERROR: API key is required." >&2
  echo "Get one at: https://console.developers.google.com/" >&2
  echo "Enable 'PageSpeed Insights API' and create an API key." >&2
  exit 1
fi

if [[ ! "$URL" =~ ^https?:// ]]; then
  echo "ERROR: URL must start with http:// or https://" >&2
  exit 1
fi

STRATEGY_UPPER=$(echo "$STRATEGY" | tr '[:lower:]' '[:upper:]')
if [[ "$STRATEGY_UPPER" != "MOBILE" && "$STRATEGY_UPPER" != "DESKTOP" ]]; then
  echo "ERROR: Strategy must be MOBILE or DESKTOP (got: $STRATEGY)" >&2
  exit 1
fi

# --- API Call ---
ENDPOINT="https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed"
ENCODED_URL=$(py -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$URL" 2>/dev/null) || ENCODED_URL=$(printf '%s' "$URL" | sed 's/:/%3A/g; s/\//%2F/g; s/?/%3F/g; s/&/%26/g; s/=/%3D/g')
PARAMS="url=${ENCODED_URL}"
PARAMS="${PARAMS}&strategy=${STRATEGY_UPPER}"
PARAMS="${PARAMS}&category=PERFORMANCE"
PARAMS="${PARAMS}&key=${API_KEY}"

FULL_URL="${ENDPOINT}?${PARAMS}"

echo "Fetching PSI data for: $URL ($STRATEGY_UPPER)..."
echo "---"

HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" "$FULL_URL" 2>&1) || {
  echo "ERROR: curl failed. Check network connectivity." >&2
  exit 1
}

HTTP_BODY=$(echo "$HTTP_RESPONSE" | sed '$d')
HTTP_CODE=$(echo "$HTTP_RESPONSE" | tail -1)

# --- Handle HTTP errors ---
case "$HTTP_CODE" in
  200)
    ;;
  400)
    echo "ERROR: Bad request — check URL format." >&2
    echo "$HTTP_BODY" | head -5 >&2
    exit 1
    ;;
  403)
    echo "ERROR: API key invalid or API not enabled." >&2
    echo "Go to https://console.developers.google.com/ and enable 'PageSpeed Insights API'." >&2
    exit 1
    ;;
  429)
    echo "ERROR: Rate limited (429). Wait a moment and retry." >&2
    exit 1
    ;;
  500|502|503)
    echo "ERROR: PSI service error ($HTTP_CODE). Try again later." >&2
    exit 1
    ;;
  *)
    echo "ERROR: Unexpected HTTP $HTTP_CODE" >&2
    echo "$HTTP_BODY" | head -5 >&2
    exit 1
    ;;
esac

# --- Validate JSON ---
if ! echo "$HTTP_BODY" | py -m json.tool > /dev/null 2>&1; then
  echo "ERROR: Response is not valid JSON." >&2
  exit 1
fi

# --- Save raw JSON ---
echo "$HTTP_BODY" > "$OUTPUT_PATH"
echo "Raw JSON saved to: $OUTPUT_PATH"
echo "---"

# --- Extract & display key metrics ---
py <<'PYEOF'
import json, sys

try:
    with open(sys.argv[1] if len(sys.argv) > 1 else "psi-result.json") as f:
        data = json.load(f)
except Exception as e:
    print(f"ERROR: Failed to parse JSON: {e}", file=sys.stderr)
    sys.exit(1)

# Performance score
lr = data.get("lighthouseResult", {})
score = lr.get("categories", {}).get("performance", {}).get("score")
score_pct = int(score * 100) if score is not None else "N/A"

# Core Web Vitals from field data (CrUX)
field = data.get("loadingExperience", {}).get("metrics", {})

def get_field_metric(metrics, key):
    m = metrics.get(key, {})
    pct = m.get("percentile")
    cat = m.get("category", "N/A")
    return pct, cat

lcp_val, lcp_cat = get_field_metric(field, "LARGEST_CONTENTFUL_PAINT_MS")
cls_val, cls_cat = get_field_metric(field, "CUMULATIVE_LAYOUT_SHIFT_SCORE")
inp_val, inp_cat = get_field_metric(field, "INTERACTION_TO_NEXT_PAINT")
fcp_val, fcp_cat = get_field_metric(field, "FIRST_CONTENTFUL_PAINT_MS")

# Lab data from Lighthouse
audits = lr.get("audits", {})

def get_lab_metric(audits, key):
    a = audits.get(key, {})
    val = a.get("numericValue")
    display = a.get("displayValue", "N/A")
    return val, display

lab_lcp_val, lab_lcp_disp = get_lab_metric(audits, "largest-contentful-paint")
lab_cls_val, lab_cls_disp = get_lab_metric(audits, "cumulative-layout-shift")
lab_fcp_val, lab_fcp_disp = get_lab_metric(audits, "first-contentful-paint")
lab_si_val, lab_si_disp = get_lab_metric(audits, "speed-index")
lab_tbt_val, lab_tbt_disp = get_lab_metric(audits, "total-blocking-time")

# Print summary
print(f"{'='*50}")
print(f"  PageSpeed Insights Results")
print(f"  URL: {data.get('id', 'N/A')}")
print(f"{'='*50}")
print()
print(f"  Performance Score: {score_pct}/100")
print()

print(f"  --- Field Data (CrUX - Real Users) ---")
if lcp_val is not None:
    print(f"  LCP:  {lcp_val}ms  [{lcp_cat}]")
else:
    print(f"  LCP:  No field data available")
if cls_val is not None:
    cls_display = cls_val / 100 if cls_val > 1 else cls_val
    print(f"  CLS:  {cls_display}  [{cls_cat}]")
else:
    print(f"  CLS:  No field data available")
if inp_val is not None:
    print(f"  INP:  {inp_val}ms  [{inp_cat}]")
else:
    print(f"  INP:  No field data available")
if fcp_val is not None:
    print(f"  FCP:  {fcp_val}ms  [{fcp_cat}]")
else:
    print(f"  FCP:  No field data available")

print()
print(f"  --- Lab Data (Lighthouse Simulation) ---")
print(f"  LCP:  {lab_lcp_disp}")
print(f"  CLS:  {lab_cls_disp}")
print(f"  FCP:  {lab_fcp_disp}")
print(f"  SI:   {lab_si_disp}")
print(f"  TBT:  {lab_tbt_disp}")
print()

# Top opportunities
print(f"  --- Top Opportunities ---")
opps = []
for key, audit in audits.items():
    if audit.get("details", {}).get("type") == "opportunity":
        savings = audit.get("details", {}).get("overallSavingsMs", 0)
        if savings and savings > 0:
            opps.append((savings, audit.get("title", key), key))

opps.sort(reverse=True)
for i, (savings, title, key) in enumerate(opps[:8]):
    print(f"  {i+1}. {title} (save ~{int(savings)}ms)")

if not opps:
    print(f"  No significant opportunities found.")

print()
print(f"{'='*50}")
PYEOF
echo "$OUTPUT_PATH"
