#!/usr/bin/env bash
# Smoke-test Better Auth via @playground/auth-core on compare + steps Workers.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STEPS_PORT="${STEPS_PORT:-8787}"
COMPARE_PORT="${COMPARE_PORT:-8788}"
STEPS_COOKIE="/tmp/smoke-steps-cookies.txt"
COMPARE_COOKIE="/tmp/smoke-compare-cookies.txt"
STEPS_USER_COOKIE="/tmp/smoke-steps-user-cookies.txt"
STEPS_CONTRIB_COOKIE="/tmp/smoke-steps-contrib-cookies.txt"
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

wait_health() {
  local port="$1" name="$2"
  for _ in $(seq 1 40); do
    if curl -sf "http://127.0.0.1:${port}/api/health" >/dev/null 2>&1; then
      pass "$name health"
      return
    fi
    sleep 0.25
  done
  fail "$name did not become healthy on :$port"
}

echo "=== Steps API (port $STEPS_PORT) ==="
cd "$ROOT/apps/steps/worker"
pnpm db:migrate:local >/dev/null 2>&1 || true
pnpm exec wrangler dev --port "$STEPS_PORT" >/tmp/smoke-steps-wrangler.log 2>&1 &
wait_health "$STEPS_PORT" "steps-api"

rm -f "$STEPS_COOKIE" "$STEPS_USER_COOKIE" "$STEPS_CONTRIB_COOKIE"

# Sign up (Origin = Vite dev URL — must be in BETTER_AUTH_TRUSTED_ORIGINS when cookies exist)
reg_body=$(curl -sS -w '\n%{http_code}' -X POST "http://127.0.0.1:${STEPS_PORT}/api/auth/sign-up/email" \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3003' \
  -H 'Cookie: better-auth.session_token=smoke-stale' \
  -d "{\"email\":\"${NEW_EMAIL}\",\"password\":\"${NEW_PW}\",\"name\":\"Smoke User\"}")
reg_code=$(echo "$reg_body" | tail -n1)
reg_json=$(echo "$reg_body" | sed '$d')
assert_status_one_of "$reg_code" "steps sign-up" 200 201
assert_json "$reg_json" '"user"' "steps sign-up returns user"
pass "steps sign-up"

# Sign in (new user)
login_body=$(curl -sS -w '\n%{http_code}' -c "$STEPS_COOKIE" -X POST "http://127.0.0.1:${STEPS_PORT}/api/auth/sign-in/email" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${NEW_EMAIL}\",\"password\":\"${NEW_PW}\"}")
login_code=$(echo "$login_body" | tail -n1)
login_json=$(echo "$login_body" | sed '$d')
assert_status "$login_code" "200" "steps sign-in (new user)"
assert_json "$login_json" '"user"' "steps sign-in returns user"
pass "steps sign-in (new user)"

# Session
me_code=$(curl -sS -o /tmp/smoke-steps-me.json -w '%{http_code}' -b "$STEPS_COOKIE" \
  "http://127.0.0.1:${STEPS_PORT}/api/auth/get-session")
assert_status "$me_code" "200" "steps get-session"
assert_json "$(cat /tmp/smoke-steps-me.json)" "\"email\":\"${NEW_EMAIL}\"" "steps session email"
pass "steps GET /get-session"

# Protected route (enrollments) — authed user OK
enr_code=$(curl -sS -o /tmp/smoke-steps-enr.json -w '%{http_code}' -b "$STEPS_COOKIE" \
  "http://127.0.0.1:${STEPS_PORT}/api/enrollments")
assert_status "$enr_code" "200" "steps enrollments (authed)"
pass "steps GET /api/enrollments (authed)"

# Role gate: seed user cannot access contributor API
user_login=$(curl -sS -w '\n%{http_code}' -c "$STEPS_USER_COOKIE" -X POST \
  "http://127.0.0.1:${STEPS_PORT}/api/auth/sign-in/email" \
  -H 'Content-Type: application/json' \
  -d '{"email":"seed+user@local.test","password":"'"$SEED_PW"'"}')
user_code=$(echo "$user_login" | tail -n1)
assert_status "$user_code" "200" "steps seed user sign-in"
contrib_code=$(curl -sS -o /dev/null -w '%{http_code}' -b "$STEPS_USER_COOKIE" \
  "http://127.0.0.1:${STEPS_PORT}/api/contributor/actions")
assert_status "$contrib_code" "403" "steps contributor API blocks user role"
pass "steps role gate: user → contributor API 403"

# Role gate: contributor can access contributor API
contrib_login=$(curl -sS -w '\n%{http_code}' -c "$STEPS_CONTRIB_COOKIE" -X POST \
  "http://127.0.0.1:${STEPS_PORT}/api/auth/sign-in/email" \
  -H 'Content-Type: application/json' \
  -d '{"email":"seed+contributor@local.test","password":"'"$SEED_PW"'"}')
contrib_login_code=$(echo "$contrib_login" | tail -n1)
assert_status "$contrib_login_code" "200" "steps seed contributor sign-in"
contrib_ok=$(curl -sS -o /dev/null -w '%{http_code}' -b "$STEPS_CONTRIB_COOKIE" \
  "http://127.0.0.1:${STEPS_PORT}/api/contributor/actions")
assert_status "$contrib_ok" "200" "steps contributor API allows contributor"
pass "steps role gate: contributor → contributor API 200"

# Unauthed protected → 401
unauth_code=$(curl -sS -o /dev/null -w '%{http_code}' \
  "http://127.0.0.1:${STEPS_PORT}/api/enrollments")
assert_status "$unauth_code" "401" "steps enrollments without cookie"
pass "steps unauthed /api/enrollments → 401"

# Sign out
logout_code=$(curl -sS -o /dev/null -w '%{http_code}' -b "$STEPS_COOKIE" -X POST \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3003' \
  -d '{}' \
  "http://127.0.0.1:${STEPS_PORT}/api/auth/sign-out")
assert_status_one_of "$logout_code" "steps sign-out" 200 204
me_after=$(curl -sS -o /tmp/smoke-steps-after.json -w '%{http_code}' -b "$STEPS_COOKIE" \
  "http://127.0.0.1:${STEPS_PORT}/api/auth/get-session")
assert_status "$me_after" "200" "steps get-session after sign-out"
me_after_body=$(cat /tmp/smoke-steps-after.json)
if [[ "$me_after_body" != "null" ]] && ! echo "$me_after_body" | grep -q '"session":null'; then
  fail "steps session cleared (body: $me_after_body)"
fi
pass "steps sign-out clears session"

cleanup
sleep 1

echo ""
echo "=== Compare API (port $COMPARE_PORT) ==="
cd "$ROOT/apps/compare/worker"
pnpm db:migrate:local >/dev/null 2>&1 || true
pnpm exec wrangler dev --port "$COMPARE_PORT" >/tmp/smoke-compare-wrangler.log 2>&1 &
wait_health "$COMPARE_PORT" "compare-api"

rm -f "$COMPARE_COOKIE"
COMPARE_EMAIL="smoke-compare+${TS}@local.test"

reg_body=$(curl -sS -w '\n%{http_code}' -X POST "http://127.0.0.1:${COMPARE_PORT}/api/auth/sign-up/email" \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3002' \
  -H 'Cookie: better-auth.session_token=smoke-stale' \
  -d "{\"email\":\"${COMPARE_EMAIL}\",\"password\":\"${NEW_PW}\",\"name\":\"Compare User\"}")
reg_code=$(echo "$reg_body" | tail -n1)
reg_json=$(echo "$reg_body" | sed '$d')
assert_status_one_of "$reg_code" "compare sign-up" 200 201
assert_json "$reg_json" '"user"' "compare sign-up returns user"
pass "compare sign-up"

login_body=$(curl -sS -w '\n%{http_code}' -c "$COMPARE_COOKIE" -X POST \
  "http://127.0.0.1:${COMPARE_PORT}/api/auth/sign-in/email" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${COMPARE_EMAIL}\",\"password\":\"${NEW_PW}\"}")
login_code=$(echo "$login_body" | tail -n1)
assert_status "$login_code" "200" "compare sign-in"
pass "compare sign-in → 200"

me_code=$(curl -sS -o /tmp/smoke-compare-me.json -w '%{http_code}' -b "$COMPARE_COOKIE" \
  "http://127.0.0.1:${COMPARE_PORT}/api/auth/get-session")
assert_status "$me_code" "200" "compare get-session"
pass "compare GET /get-session"

# Protected listings API
list_code=$(curl -sS -o /dev/null -w '%{http_code}' -b "$COMPARE_COOKIE" \
  "http://127.0.0.1:${COMPARE_PORT}/api/listings")
assert_status "$list_code" "200" "compare listings (authed)"
pass "compare GET /api/listings (authed)"

unauth_list=$(curl -sS -o /dev/null -w '%{http_code}' \
  "http://127.0.0.1:${COMPARE_PORT}/api/listings")
assert_status "$unauth_list" "401" "compare listings without cookie"
pass "compare unauthed /api/listings → 401"

logout_code=$(curl -sS -o /dev/null -w '%{http_code}' -b "$COMPARE_COOKIE" -X POST \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3002' \
  -d '{}' \
  "http://127.0.0.1:${COMPARE_PORT}/api/auth/sign-out")
assert_status_one_of "$logout_code" "compare sign-out" 200 204
me_after=$(curl -sS -o /tmp/smoke-compare-after.json -w '%{http_code}' -b "$COMPARE_COOKIE" \
  "http://127.0.0.1:${COMPARE_PORT}/api/auth/get-session")
assert_status "$me_after" "200" "compare get-session after sign-out"
me_after_body=$(cat /tmp/smoke-compare-after.json)
if [[ "$me_after_body" != "null" ]] && ! echo "$me_after_body" | grep -q '"session":null'; then
  fail "compare session cleared (body: $me_after_body)"
fi
pass "compare sign-out clears session"

echo ""
echo "All auth smoke tests passed."
