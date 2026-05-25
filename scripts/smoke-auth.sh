#!/usr/bin/env bash
# Smoke-test @playground/auth-core via compare + steps Workers (plan steps 5–6).
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

# Register
reg_body=$(curl -sS -w '\n%{http_code}' -X POST "http://127.0.0.1:${STEPS_PORT}/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${NEW_EMAIL}\",\"password\":\"${NEW_PW}\"}")
reg_code=$(echo "$reg_body" | tail -n1)
reg_json=$(echo "$reg_body" | sed '$d')
assert_status "$reg_code" "201" "steps register"
assert_json "$reg_json" '"email"' "steps register returns user"
pass "steps register → 201"

# Login (new user)
login_body=$(curl -sS -w '\n%{http_code}' -c "$STEPS_COOKIE" -X POST "http://127.0.0.1:${STEPS_PORT}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${NEW_EMAIL}\",\"password\":\"${NEW_PW}\"}")
login_code=$(echo "$login_body" | tail -n1)
login_json=$(echo "$login_body" | sed '$d')
assert_status "$login_code" "200" "steps login (new user)"
assert_json "$login_json" '"role":"user"' "steps login role user"
pass "steps login (new user) → role user"

# Me
me_code=$(curl -sS -o /tmp/smoke-steps-me.json -w '%{http_code}' -b "$STEPS_COOKIE" \
  "http://127.0.0.1:${STEPS_PORT}/api/auth/me")
assert_status "$me_code" "200" "steps /me"
assert_json "$(cat /tmp/smoke-steps-me.json)" "\"email\":\"${NEW_EMAIL}\"" "steps /me email"
pass "steps GET /me"

# Protected route (enrollments) — authed user OK
enr_code=$(curl -sS -o /tmp/smoke-steps-enr.json -w '%{http_code}' -b "$STEPS_COOKIE" \
  "http://127.0.0.1:${STEPS_PORT}/api/enrollments")
assert_status "$enr_code" "200" "steps enrollments (authed)"
pass "steps GET /api/enrollments (authed)"

# Role gate: seed user cannot access contributor API
user_login=$(curl -sS -w '\n%{http_code}' -c "$STEPS_USER_COOKIE" -X POST \
  "http://127.0.0.1:${STEPS_PORT}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"seed+user@local.test","password":"'"$SEED_PW"'"}')
user_code=$(echo "$user_login" | tail -n1)
assert_status "$user_code" "200" "steps seed user login"
contrib_code=$(curl -sS -o /dev/null -w '%{http_code}' -b "$STEPS_USER_COOKIE" \
  "http://127.0.0.1:${STEPS_PORT}/api/contributor/actions")
assert_status "$contrib_code" "403" "steps contributor API blocks user role"
pass "steps role gate: user → contributor API 403"

# Role gate: contributor can access contributor API
contrib_login=$(curl -sS -w '\n%{http_code}' -c "$STEPS_CONTRIB_COOKIE" -X POST \
  "http://127.0.0.1:${STEPS_PORT}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"seed+contributor@local.test","password":"'"$SEED_PW"'"}')
contrib_login_code=$(echo "$contrib_login" | tail -n1)
assert_status "$contrib_login_code" "200" "steps seed contributor login"
contrib_ok=$(curl -sS -o /dev/null -w '%{http_code}' -b "$STEPS_CONTRIB_COOKIE" \
  "http://127.0.0.1:${STEPS_PORT}/api/contributor/actions")
assert_status "$contrib_ok" "200" "steps contributor API allows contributor"
pass "steps role gate: contributor → contributor API 200"

# Unauthed protected → 401
unauth_code=$(curl -sS -o /dev/null -w '%{http_code}' \
  "http://127.0.0.1:${STEPS_PORT}/api/enrollments")
assert_status "$unauth_code" "401" "steps enrollments without cookie"
pass "steps unauthed /api/enrollments → 401"

# Logout
logout_code=$(curl -sS -o /dev/null -w '%{http_code}' -b "$STEPS_COOKIE" -X POST \
  "http://127.0.0.1:${STEPS_PORT}/api/auth/logout")
assert_status_one_of "$logout_code" "steps logout" 200 204
me_after=$(curl -sS -o /dev/null -w '%{http_code}' -b "$STEPS_COOKIE" \
  "http://127.0.0.1:${STEPS_PORT}/api/auth/me")
assert_status "$me_after" "401" "steps /me after logout"
pass "steps logout clears session"

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

reg_body=$(curl -sS -w '\n%{http_code}' -X POST "http://127.0.0.1:${COMPARE_PORT}/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${COMPARE_EMAIL}\",\"password\":\"${NEW_PW}\"}")
reg_code=$(echo "$reg_body" | tail -n1)
reg_json=$(echo "$reg_body" | sed '$d')
assert_status "$reg_code" "201" "compare register"
assert_json "$reg_json" '"locale"' "compare register includes locale"
pass "compare register → 201 (locale seeded)"

login_body=$(curl -sS -w '\n%{http_code}' -c "$COMPARE_COOKIE" -X POST \
  "http://127.0.0.1:${COMPARE_PORT}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${COMPARE_EMAIL}\",\"password\":\"${NEW_PW}\"}")
login_code=$(echo "$login_body" | tail -n1)
assert_status "$login_code" "200" "compare login"
pass "compare login → 200"

me_code=$(curl -sS -o /tmp/smoke-compare-me.json -w '%{http_code}' -b "$COMPARE_COOKIE" \
  "http://127.0.0.1:${COMPARE_PORT}/api/auth/me")
assert_status "$me_code" "200" "compare /me"
pass "compare GET /me"

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
  "http://127.0.0.1:${COMPARE_PORT}/api/auth/logout")
assert_status_one_of "$logout_code" "compare logout" 200 204
me_after=$(curl -sS -o /dev/null -w '%{http_code}' -b "$COMPARE_COOKIE" \
  "http://127.0.0.1:${COMPARE_PORT}/api/auth/me")
assert_status "$me_after" "401" "compare /me after logout"
pass "compare logout clears session"

echo ""
echo "All auth smoke tests passed."
