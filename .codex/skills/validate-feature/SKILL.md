---
name: validate-feature
description: Validate frontend changes with a repeatable manual checklist; optionally produce a short recording when tools are available.
---

# Validate Feature

Use this skill after frontend behavior changes.

## Steps

1. Ensure servers are running (`backend:3000`, `frontend:5173`).
2. Ask for the target flow: entry page, user actions, expected result.
3. Execute the flow manually in browser and verify:
- Initial state
- Main success path
- At least one relevant edge/error path
4. Capture evidence:
- Minimum: before/after screenshots
- Optional: short GIF/video if recording tools are available
5. Record findings and regressions.

## Output Contract

Report:
- Flow executed
- What passed
- What failed or looked risky
- Evidence paths (screenshots/video) when captured
