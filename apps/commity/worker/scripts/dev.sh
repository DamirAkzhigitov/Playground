#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

LOG_PID=""
LOG_URL="${LOCAL_LOG_URL:-http://127.0.0.1:8799/log}"
HEALTH_URL="${LOG_URL%/log}/health"

log_server_running() {
  node -e "
    fetch('${HEALTH_URL}')
      .then((r) => process.exit(r.ok ? 0 : 1))
      .catch(() => process.exit(1));
  " 2>/dev/null
}

if log_server_running; then
  echo "[dev] localLogServer already running (${HEALTH_URL})"
else
  node scripts/localLogServer.mjs &
  LOG_PID=$!
  sleep 0.2
  if ! log_server_running; then
    echo "[dev] failed to start localLogServer on ${HEALTH_URL}" >&2
    exit 1
  fi
fi

wrangler dev --port 8788
