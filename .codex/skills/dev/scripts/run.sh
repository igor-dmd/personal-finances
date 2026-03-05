#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)
cd "$repo_root"

backend_log="/tmp/personal-finances-backend.log"
frontend_log="/tmp/personal-finances-frontend.log"
backend_pid_file="/tmp/personal-finances-backend.pid"
frontend_pid_file="/tmp/personal-finances-frontend.pid"

nohup npm run api:dev >"$backend_log" 2>&1 &
echo $! > "$backend_pid_file"

(
  cd frontend
  nohup npm run dev >"$frontend_log" 2>&1 &
  echo $! > "$frontend_pid_file"
)

echo "Backend: http://localhost:3000 (pid $(cat "$backend_pid_file"))"
echo "Frontend: http://localhost:5173 (pid $(cat "$frontend_pid_file"))"
echo "Logs: $backend_log, $frontend_log"
