#!/usr/bin/env bash
set -euo pipefail

cat <<'TXT'
Frontend validation checklist:
1) Open target view and confirm initial render
2) Execute primary user flow
3) Verify visible state/result changes
4) Trigger one edge/error case
5) Capture evidence (screenshots or recording)
TXT
