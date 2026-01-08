---
name: add-route
description: Scaffolds a new API route with Hono. Use when adding new API endpoints.
---

# Add Route Skill

Scaffolds a new API route with Hono.

## Usage

```
/add-route <name>
```

Example: `/add-route accounts`

## Steps

1. Ask the user for:
   - Route name (kebab-case, e.g., "accounts")
   - Initial endpoints needed (GET, POST, PATCH, DELETE)

2. Create the route file at `src/api/routes/<name>.ts`:

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { FinanceRepository } from '../../db/repository';

const router = new Hono();
const repo = new FinanceRepository();

// GET /<name>
router.get('/', async (c) => {
    try {
        // TODO: Implement
        return c.json([]);
    } catch (error) {
        console.error('[API] Error:', error);
        return c.json({ error: 'Failed to fetch' }, 500);
    }
});

// Add other endpoints as needed...

export default router;
```

3. Register the route in `src/api/app.ts`:
   - Add import: `import <name> from './routes/<name>';`
   - Add route: `app.route('/<name>', <name>);`

4. Add corresponding repository methods to `src/db/repository.ts` if needed.

5. Inform user the route is available at `http://localhost:3000/<name>`.
