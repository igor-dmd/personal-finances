---
name: dev
description: Starts both the backend API server and frontend development server. Use to start local development.
---

# Dev Skill

Starts both the backend API server and frontend development server for local development.

## Usage

```
/dev
```

## Steps

1. Start the backend API server in the background (port 3000):
   ```bash
   npm run api:dev
   ```

2. Start the frontend Vite dev server in the background (port 5173):
   ```bash
   cd frontend && npm run dev
   ```

3. Inform the user:
   - Backend API: http://localhost:3000
   - Frontend: http://localhost:5173

Note: Both servers run with hot reload enabled. Use the TaskOutput tool or check running tasks to monitor their output.
