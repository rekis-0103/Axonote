#!/usr/bin/env bash
# Run lint + tests across the monorepo.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> web lint"
( cd "$root" && npm run lint:web )

echo "==> api lint + test"
( cd "$root/apps/api" && ruff check . && pytest )

echo "==> worker lint + test"
( cd "$root/apps/worker" && ruff check . && pytest )

echo "==> All checks passed."
