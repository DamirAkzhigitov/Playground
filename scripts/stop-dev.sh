#!/usr/bin/env bash
# Free local dev ports when wrangler/next survive Ctrl+C (common with turbo).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# compare-next (Next.js) + legacy Vite/Worker ports from older monorepo layouts
PORTS=(3000 3001 3002 3003 3004 3010 8787 8788 8789 9237 9238 9239)

free_port() {
  local port="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  elif command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti ":${port}" 2>/dev/null || true)
    if [[ -n "${pids}" ]]; then
      kill -9 ${pids} 2>/dev/null || true
    fi
  fi
}

for port in "${PORTS[@]}"; do
  free_port "$port"
done

pkill -f "wrangler.*dev --port 8787" 2>/dev/null || true
pkill -f "wrangler.*dev --port 8788" 2>/dev/null || true
pkill -f "wrangler.*dev --port 8789" 2>/dev/null || true
pkill -f "local-dev-persist|smoke-state" 2>/dev/null || true
pkill -f "${ROOT}/node_modules/.pnpm/@cloudflare+workerd" 2>/dev/null || true
pkill -f "${ROOT}/apps/.*/node_modules/.bin/vite" 2>/dev/null || true
pkill -f "${ROOT}/apps/compare-next.*next dev" 2>/dev/null || true

echo "Stopped local dev servers (freed ports: ${PORTS[*]})"
