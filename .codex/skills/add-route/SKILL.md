---
name: add-route
description: Scaffold a new backend API route in this repository, register it in src/api/app.ts, and add a test skeleton.
---

# Add Route

Use this skill when the user asks for a new API endpoint group.

## Inputs

- `route_name` in kebab-case, for example `budgets`

## Steps

1. Run `scripts/scaffold.sh <route_name>`.
2. Confirm these artifacts were created/updated:
- `src/api/routes/<route_name>.ts`
- `src/api/app.ts`
- `tests/functional/<route_name>.test.ts`
3. Run `npm test -- tests/functional/<route_name>.test.ts` if the user asked for validation.

## Output Contract

Report:
- Route path registered
- Files changed
- Follow-up endpoints to implement inside the new router
