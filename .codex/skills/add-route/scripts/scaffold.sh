#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <route-name-kebab-case>" >&2
  exit 1
fi

route_name="$1"
if [[ ! "$route_name" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Route name must be kebab-case" >&2
  exit 1
fi

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)
cd "$repo_root"

route_file="src/api/routes/${route_name}.ts"
test_file="tests/functional/${route_name}.test.ts"
app_file="src/api/app.ts"

if [ -f "$route_file" ]; then
  echo "Route file already exists: $route_file" >&2
  exit 1
fi

var_name=$(echo "$route_name" | awk -F- '{printf $1; for (i=2; i<=NF; i++) printf toupper(substr($i,1,1)) substr($i,2)}')

cat > "$route_file" <<ROUTE
import { Hono } from 'hono';

const ${var_name} = new Hono();

${var_name}.get('/', (c) => {
    return c.json({ message: '${route_name} route ready' });
});

export default ${var_name};
ROUTE

import_line="import ${var_name} from './routes/${route_name}';"
route_line="app.route('/${route_name}', ${var_name});"

if ! grep -Fq "$import_line" "$app_file"; then
  tmp_file=$(mktemp)
  awk -v line="$import_line" '
    /^const app = new Hono\(\);/ && !inserted { print line; inserted=1 }
    { print }
  ' "$app_file" > "$tmp_file"
  mv "$tmp_file" "$app_file"
fi

if ! grep -Fq "$route_line" "$app_file"; then
  tmp_file=$(mktemp)
  awk -v line="$route_line" '
    /^export default app;/ && !inserted { print line; inserted=1 }
    { print }
  ' "$app_file" > "$tmp_file"
  mv "$tmp_file" "$app_file"
fi

if [ ! -f "$test_file" ]; then
  cat > "$test_file" <<TEST
import { describe } from 'vitest';

describe.todo('${route_name} route');
TEST
fi

echo "Created $route_file"
echo "Updated $app_file"
echo "Created $test_file"
