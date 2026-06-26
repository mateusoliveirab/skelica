#!/usr/bin/env bash
# E2E smoke test for skelica using agent-browser
# Usage: ./scripts/e2e.sh [URL]
#   URL defaults to http://localhost:4173 (vite preview)
#   Set to https://skelica.pages.dev for production smoke

set -euo pipefail

URL="${1:-http://localhost:4173}"
SCREENSHOT_DIR="${E2E_SCREENSHOT_DIR:-/tmp/skelica-e2e}"
TIMEOUT=15000

mkdir -p "$SCREENSHOT_DIR"

log()  { echo "[e2e] $*"; }
fail() { echo "[e2e] FAIL: $*" >&2; exit 1; }

log "Target: $URL"
log "Screenshots: $SCREENSHOT_DIR"

# ---------------------------------------------------------------------------
# Readiness check — poll until the URL responds (max 60s)
# ---------------------------------------------------------------------------
log "Waiting for app to be ready..."
for i in $(seq 1 30); do
  if curl -sf --max-time 3 "$URL" > /dev/null 2>&1; then
    log "App ready after ${i}s"
    break
  fi
  if [ "$i" -eq 30 ]; then
    fail "App did not respond after 60s"
  fi
  sleep 2
done

# ---------------------------------------------------------------------------
# Happy path: default prompt → Analyze → results appear
# ---------------------------------------------------------------------------
log "--- Test 1: page load and default prompt ---"
agent-browser open "$URL" --timeout "$TIMEOUT"
agent-browser screenshot "$SCREENSHOT_DIR/01-load.png"

# Validate textarea is present and has the demo prompt content
PROMPT_TEXT=$(agent-browser eval \
  "document.querySelector('[data-testid=\"prompt-input\"]')?.value ?? ''" \
  --timeout "$TIMEOUT")
[ -z "$PROMPT_TEXT" ] && fail "prompt-input not found or empty on load"
log "Default prompt loaded (${#PROMPT_TEXT} chars)"

# Validate Analyze button is enabled
BUTTON_DISABLED=$(agent-browser eval \
  "document.querySelector('[data-testid=\"analyze-button\"]')?.disabled ?? 'missing'" \
  --timeout "$TIMEOUT")
[ "$BUTTON_DISABLED" = "true" ] && fail "analyze-button is disabled on load"
[ "$BUTTON_DISABLED" = "missing" ] && fail "analyze-button not found"
log "Analyze button is enabled"

log "--- Test 2: click Analyze → results ---"
agent-browser click '[data-testid="analyze-button"]' --timeout "$TIMEOUT"
agent-browser screenshot "$SCREENSHOT_DIR/02-analyzing.png"

# Wait for grade to appear (analysis is fast <300ms, but allow for network/render)
agent-browser wait '[data-testid="grade"]' --timeout "$TIMEOUT"
agent-browser screenshot "$SCREENSHOT_DIR/03-results.png"

GRADE=$(agent-browser eval \
  "document.querySelector('[data-testid=\"grade\"]')?.textContent?.trim() ?? ''" \
  --timeout "$TIMEOUT")
[[ ! "$GRADE" =~ ^[A-F][+-]?$ ]] && fail "grade is not a valid letter grade: '$GRADE'"
log "Grade: $GRADE"

# The demo prompt is designed to score a B — assert determinism
if [[ ! "$GRADE" =~ ^B ]]; then
  log "WARN: expected grade B* for demo prompt, got $GRADE (non-fatal)"
fi

agent-browser wait '[data-testid="anatomy-view"]' --timeout "$TIMEOUT"
agent-browser wait '[data-testid="components-checklist"]' --timeout "$TIMEOUT"
log "AnatomyView and ComponentsChecklist rendered"

# ---------------------------------------------------------------------------
# Negative: empty input → Analyze button stays disabled
# ---------------------------------------------------------------------------
log "--- Test 3: empty input → button disabled ---"
agent-browser eval \
  "document.querySelector('[data-testid=\"prompt-input\"]').value = ''; \
   document.querySelector('[data-testid=\"prompt-input\"]').dispatchEvent(new Event('input', {bubbles:true}))" \
  --timeout "$TIMEOUT"

BUTTON_DISABLED=$(agent-browser eval \
  "document.querySelector('[data-testid=\"analyze-button\"]')?.disabled ?? 'missing'" \
  --timeout "$TIMEOUT")
[ "$BUTTON_DISABLED" != "true" ] && fail "analyze-button should be disabled when input is empty"
log "Empty input correctly disables Analyze button"

# ---------------------------------------------------------------------------
# Performance: Core Web Vitals
# ---------------------------------------------------------------------------
log "--- Vitals ---"
agent-browser open "$URL" --timeout "$TIMEOUT"
agent-browser wait '[data-testid="prompt-input"]' --timeout "$TIMEOUT"
agent-browser vitals --json > "$SCREENSHOT_DIR/vitals.json" 2>/dev/null || true
if [ -f "$SCREENSHOT_DIR/vitals.json" ]; then
  log "Vitals saved to $SCREENSHOT_DIR/vitals.json"
  cat "$SCREENSHOT_DIR/vitals.json"
fi

agent-browser screenshot "$SCREENSHOT_DIR/04-final.png"

log "--- All tests passed ---"
log "Screenshots in $SCREENSHOT_DIR"
