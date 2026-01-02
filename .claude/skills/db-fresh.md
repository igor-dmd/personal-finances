# Database Fresh Skill

Resets the database and reseeds it with sample data. Useful during development to get a clean state.

## Usage

```
/db-fresh
```

## Steps

1. Run the database reset script to clear all tables:
   ```bash
   npm run db:reset
   ```

2. Run the database seed script to populate with sample data:
   ```bash
   npm run db:seed
   ```

3. Confirm success to the user with a summary of seeded data.
