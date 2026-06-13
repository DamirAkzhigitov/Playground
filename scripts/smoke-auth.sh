#!/usr/bin/env bash
# Smoke-test central auth (auth Worker) + session on compare/steps tool Workers.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Share local D1/sqlite across auth + tool Workers (each `wrangler dev` is isolated by default).
SMOKE_PERSIST="${SMOKE_PERSIST:-$ROOT/.wrangler/smoke-state}"
AUTH_PORT="${AUTH_PORT:-8789}"
STEPS_PORT="${STEPS_PORT:-8787}"
COMPARE_PORT="${COMPARE_PORT:-8788}"
COOKIE_JAR="/tmp/smoke-playground-auth-cookies.txt"
SEED_PW='SeedPass123!'
TS="$(date +%s)"
NEW_EMAIL="smoke+${TS}@local.test"
NEW_PW='SmokeTest99!'

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; exit 1; }

assert_json() {
  local body="$1" pattern="$2" msg="$3"
  echo "$body" | grep -q "$pattern" || fail "$msg (body: $body)"
}

assert_status() {
  local got="$1" want="$2" msg="$3"
  [[ "$got" == "$want" ]] || fail "$msg (expected HTTP $want, got $got)"
}

assert_status_one_of() {
  local got="$1" msg="$2"
  shift 2
  for want in "$@"; do
    [[ "$got" == "$want" ]] && return 0
  done
  fail "$msg (expected one of: $*, got $got)"
}

cleanup() {
  jobs -p 2>/dev/null | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT

free_port() {
  local port="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  fi
}

wait_health() {
  local port="$1" name="$2"
  local expect="${3:-}"
  for _ in $(seq 1 40); do
    local body
    body=$(curl -sf "http://127.0.0.1:${port}/api/health" 2>/dev/null) || body=""
    if [[ -n "$body" ]]; then
      if [[ -z "$expect" ]] || echo "$body" | grep -q "$expect"; then
        pass "$name health"
        return
      fi
    fi
    sleep 0.25
  done
  fail "$name did not become healthy on :$port"
}

if [[ ! -d "$ROOT/apps/auth/dist" ]]; then
  echo "Building @playground/auth (dist/ required for wrangler assets)…"
  (cd "$ROOT" && pnpm --filter @playground/auth build >/dev/null)
fi

free_port "$AUTH_PORT"
free_port "$STEPS_PORT"
free_port "$COMPARE_PORT"
mkdir -p "$SMOKE_PERSIST"

echo "=== Shared auth DB (playground-auth-db) ==="
cd "$ROOT/apps/auth/worker"
pnpm exec wrangler d1 migrations apply playground-auth-db --local --persist-to "$SMOKE_PERSIST" >/dev/null 2>&1 || true
pass "auth DB migrations (local, shared persist)"

echo ""
echo "=== Auth API (port $AUTH_PORT) — sign-up / sign-in ==="
cd "$ROOT/apps/auth/worker"
pnpm exec wrangler dev --port "$AUTH_PORT" --persist-to "$SMOKE_PERSIST" >/tmp/smoke-auth-wrangler.log 2>&1 &
wait_health "$AUTH_PORT" "playground-auth-api" "playground-auth-api"

rm -f "$COOKIE_JAR"

reg_body=$(curl -sS -w '\n%{http_code}' -X POST "http://127.0.0.1:${AUTH_PORT}/api/auth/sign-up/email" \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3004' \
  -d "{\"email\":\"${NEW_EMAIL}\",\"password\":\"${NEW_PW}\",\"name\":\"Smoke User\"}")
reg_code=$(echo "$reg_body" | tail -n1)
reg_json=$(echo "$reg_body" | sed '$d')
assert_status_one_of "$reg_code" "auth sign-up" 200 201
assert_json "$reg_json" '"user"' "auth sign-up returns user"
pass "auth sign-up"

login_body=$(curl -sS -w '\n%{http_code}' -c "$COOKIE_JAR" -X POST "http://127.0.0.1:${AUTH_PORT}/api/auth/sign-in/email" \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3004' \
  -d "{\"email\":\"${NEW_EMAIL}\",\"password\":\"${NEW_PW}\"}")
login_code=$(echo "$login_body" | tail -n1)
login_json=$(echo "$login_body" | sed '$d')
assert_status "$login_code" "200" "auth sign-in"
assert_json "$login_json" '"user"' "auth sign-in returns user"
pass "auth sign-in"

me_code=$(curl -sS -o /tmp/smoke-auth-me.json -w '%{http_code}' -b "$COOKIE_JAR" \
  "http://127.0.0.1:${AUTH_PORT}/api/auth/get-session")
assert_status "$me_code" "200" "auth get-session"
assert_json "$(cat /tmp/smoke-auth-me.json)" "\"email\":\"${NEW_EMAIL}\"" "auth session email"
pass "auth GET /get-session"

echo ""
echo "=== Steps API (port $STEPS_PORT) — shared session cookie ==="
cd "$ROOT/apps/steps/worker"
pnpm exec wrangler d1 migrations apply steps-db --local --persist-to "$SMOKE_PERSIST" >/dev/null 2>&1 || true
pnpm exec wrangler dev --port "$STEPS_PORT" --persist-to "$SMOKE_PERSIST" >/tmp/smoke-steps-wrangler.log 2>&1 &
wait_health "$STEPS_PORT" "steps-api" "steps-api"

enr_code=$(curl -sS -o /tmp/smoke-steps-enr.json -w '%{http_code}' -b "$COOKIE_JAR" \
  "http://127.0.0.1:${STEPS_PORT}/api/enrollments")
assert_status "$enr_code" "200" "steps enrollments (authed via central session)"
pass "steps GET /api/enrollments (authed)"

unauth_code=$(curl -sS -o /dev/null -w '%{http_code}' \
  "http://127.0.0.1:${STEPS_PORT}/api/enrollments")
assert_status "$unauth_code" "401" "steps enrollments without cookie"
pass "steps unauthed /api/enrollments → 401"

actions_code=$(curl -sS -o /tmp/smoke-steps-actions.json -w '%{http_code}' \
  "http://127.0.0.1:${STEPS_PORT}/api/actions")
assert_status "$actions_code" "200" "steps public catalog without cookie"
pass "steps guest GET /api/actions → 200"

user_login=$(curl -sS -w '\n%{http_code}' -c "$COOKIE_JAR" -X POST \
  "http://127.0.0.1:${AUTH_PORT}/api/auth/sign-in/email" \
  -H 'Content-Type: application/json' \
  -d '{"email":"seed+user@local.test","password":"'"$SEED_PW"'"}')
user_code=$(echo "$user_login" | tail -n1)
assert_status "$user_code" "200" "seed user sign-in via auth"
contrib_code=$(curl -sS -o /dev/null -w '%{http_code}' -b "$COOKIE_JAR" \
  "http://127.0.0.1:${STEPS_PORT}/api/contributor/actions")
assert_status "$contrib_code" "403" "steps contributor API blocks user role"
pass "steps role gate: user → contributor API 403"

contrib_login=$(curl -sS -w '\n%{http_code}' -c "$COOKIE_JAR" -X POST \
  "http://127.0.0.1:${AUTH_PORT}/api/auth/sign-in/email" \
  -H 'Content-Type: application/json' \
  -d '{"email":"seed+contributor@local.test","password":"'"$SEED_PW"'"}')
contrib_login_code=$(echo "$contrib_login" | tail -n1)
assert_status "$contrib_login_code" "200" "seed contributor sign-in via auth"
contrib_ok=$(curl -sS -o /dev/null -w '%{http_code}' -b "$COOKIE_JAR" \
  "http://127.0.0.1:${STEPS_PORT}/api/contributor/actions")
assert_status "$contrib_ok" "200" "steps contributor API allows contributor"
pass "steps role gate: contributor → contributor API 200"

echo ""
echo "=== Compare API (port $COMPARE_PORT) — shared session + lazy seed ==="
cd "$ROOT/apps/compare/worker"
pnpm exec wrangler d1 migrations apply apartments-db --local --persist-to "$SMOKE_PERSIST" >/dev/null 2>&1 || true
pnpm exec wrangler dev --port "$COMPARE_PORT" --persist-to "$SMOKE_PERSIST" >/tmp/smoke-compare-wrangler.log 2>&1 &
wait_health "$COMPARE_PORT" "compare-api" '"ok":true'

login_body=$(curl -sS -w '\n%{http_code}' -c "$COOKIE_JAR" -X POST \
  "http://127.0.0.1:${AUTH_PORT}/api/auth/sign-in/email" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${NEW_EMAIL}\",\"password\":\"${NEW_PW}\"}")
login_code=$(echo "$login_body" | tail -n1)
assert_status "$login_code" "200" "compare session via auth sign-in"

list_code=$(curl -sS -o /tmp/smoke-compare-list.json -w '%{http_code}' -b "$COOKIE_JAR" \
  "http://127.0.0.1:${COMPARE_PORT}/api/listings")
assert_status "$list_code" "200" "compare listings (authed)"
pass "compare GET /api/listings (authed, lazy seed)"

unauth_list=$(curl -sS -o /dev/null -w '%{http_code}' \
  "http://127.0.0.1:${COMPARE_PORT}/api/listings")
assert_status "$unauth_list" "401" "compare listings without cookie"
pass "compare unauthed /api/listings → 401"

logout_code=$(curl -sS -o /dev/null -w '%{http_code}' -b "$COOKIE_JAR" -X POST \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3004' \
  -d '{}' \
  "http://127.0.0.1:${AUTH_PORT}/api/auth/sign-out")
assert_status_one_of "$logout_code" "auth sign-out" 200 204
me_after=$(curl -sS -o /tmp/smoke-auth-after.json -w '%{http_code}' -b "$COOKIE_JAR" \
  "http://127.0.0.1:${AUTH_PORT}/api/auth/get-session")
assert_status "$me_after" "200" "auth get-session after sign-out"
me_after_body=$(cat /tmp/smoke-auth-after.json)
if [[ "$me_after_body" != "null" ]] && ! echo "$me_after_body" | grep -q '"session":null'; then
  fail "auth session cleared (body: $me_after_body)"
fi
pass "auth sign-out clears session"

echo ""
echo "All auth smoke tests passed."
