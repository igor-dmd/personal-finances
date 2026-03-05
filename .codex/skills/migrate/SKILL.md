---
name: migrate
description: Generate and apply Drizzle migrations after schema changes.
---

# Migrate

Use this skill after editing `src/db/schema.ts`.

## Steps

1. Run `scripts/run.sh`.
2. List any newly generated files in `drizzle/`.

## Output Contract

Report:
- `db:generate` status
- `db:migrate` status
- New migration files detected
