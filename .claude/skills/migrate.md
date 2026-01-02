# Migrate Skill

Generates and applies database migrations after schema changes.

## Usage

```
/migrate
```

## Steps

1. Generate new migrations from schema changes in `src/db/schema.ts`:
   ```bash
   npm run db:generate
   ```

2. Apply pending migrations to the database:
   ```bash
   npm run db:migrate
   ```

3. Confirm success and show any new migration files created in `drizzle/` directory.

## Notes

- Always review generated migrations in `drizzle/` before applying to production
- SQLite has limitations on ALTER TABLE operations; some changes may require manual migration adjustments
