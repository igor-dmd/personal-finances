---
name: db-fresh
description: Reset and reseed the SQLite database for a clean local development state.
---

# DB Fresh

Use this skill when the user asks for a clean database state.

## Steps

1. Run `scripts/run.sh`.
2. Report command outcomes and any failures.

## Output Contract

Report:
- `db:reset` status
- `db:seed` status
- Any next command needed if one step failed
