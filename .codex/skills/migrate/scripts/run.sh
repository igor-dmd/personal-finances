#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)
cd "$repo_root"

before=$(find drizzle -maxdepth 1 -type f 2>/dev/null | sort || true)

npm run db:generate
npm run db:migrate

after=$(find drizzle -maxdepth 1 -type f 2>/dev/null | sort || true)

printf '%s
' "New migration files:"
comm -13 <(printf '%s
' "$before") <(printf '%s
' "$after") || true
