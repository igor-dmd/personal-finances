# Deployment

This app can run as a single Node service in production:

- Hono serves the API routes.
- Hono also serves the built React/Vite frontend from `frontend/dist`.
- SQLite is stored in the path configured by `DATABASE_URL`.
- Migrations run automatically before the production server starts.

## Recommended Option: Railway

1. Create a new Railway project from this repository.
2. Let Railway build with the repository `Dockerfile`. The `railway.json` file pins the Dockerfile builder and configures `/health` as the deployment healthcheck.
3. Add a persistent volume mounted at:

```text
/data
```

4. Configure environment variables:

```text
DATABASE_URL=/data/sqlite.db
NODE_ENV=production
```

Railway provides `PORT` automatically. The Docker image defaults `DATABASE_URL` to `/data/sqlite.db`, but keeping it explicit in Railway makes the deployment easier to inspect later.

If the frontend and backend are served by the same Railway service, do not set `VITE_API_URL`. The production frontend will call the API on the same origin.

## Optional CORS

For a separate frontend domain, set:

```text
CORS_ORIGIN=https://your-frontend-domain.example
```

You can allow multiple origins with comma-separated values:

```text
CORS_ORIGIN=https://app.example.com,https://preview.example.com
```

## Production Commands

Build everything locally:

```bash
npm run build:all
```

Run migrations and start the API/static server:

```bash
npm run start:prod
```

## Docker

Build the production image:

```bash
docker build -t personal-finances .
```

Run it locally with a persistent SQLite directory:

```bash
docker run --rm -p 3000:3000 -v "$PWD/.data:/data" personal-finances
```

Then open:

```text
http://localhost:3000
```
