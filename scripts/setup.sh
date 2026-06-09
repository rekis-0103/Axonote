#!/usr/bin/env bash
# Axonote dev setup (macOS/Linux).
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Web + shared (npm workspaces)"
( cd "$root" && npm install )

echo "==> API venv"
( cd "$root/apps/api" && python -m venv .venv && ./.venv/bin/pip install --upgrade pip && ./.venv/bin/pip install -r requirements.txt )

echo "==> Worker venv"
( cd "$root/apps/worker" && python -m venv .venv && ./.venv/bin/pip install --upgrade pip && ./.venv/bin/pip install -r requirements.txt )

echo "==> Done. Copy .env.example to .env and start services (see README)."
