# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Commands

### Backend (root directory)

```bash
npm run api:dev          # Start API server with hot reload (port 3000)
npm test                 # Run all backend tests (Vitest)
npm run db:generate      # Generate migrations from schema changes
npm run db:migrate       # Apply pending migrations
npm run db:seed          # Populate database with sample data
npm run db:reset         # Clear all database tables
```

### Frontend (`frontend/` directory)

```bash
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Build for production (runs tsc then vite build)
npm run lint             # Run ESLint
npm test                 # Run frontend tests (Vitest)
```

### Running a single test

```bash
# Backend
npx vitest run tests/functional/api.test.ts

# Frontend
cd frontend && npx vitest run src/views/Import.test.tsx
```

### CLI for processing files

```bash
npx tsx src/index.ts process-file <path-to-csv> <parser-type>
# Example: npx tsx src/index.ts process-file ./statement.csv nubank-cc-bill-csv
```

## Architecture

This is a full-stack TypeScript personal finance tracking application with separate backend and frontend.

### Backend (`src/`)

- API framework: Hono with Node.js adapter
- Database: SQLite via `better-sqlite3` with Drizzle ORM
- Validation: Zod schemas for request validation

Key components:
- `src/api/app.ts` - Hono app setup, routes mounted here
- `src/api/routes/` - API route handlers (transactions, import-jobs)
- `src/db/schema.ts` - Drizzle table definitions (`accounts`, `categories`, `transactions`, `importJobs`)
- `src/db/repository.ts` - Data access layer (`FinanceRepository`)
- `src/extraction/processor.ts` - `ExtractionProcessor` routes files to parsers
- `src/extraction/parsers/` - File parsers implementing `BillParser`

### Frontend (`frontend/src/`)

- Framework: React 19 with React Router
- Styling: Tailwind CSS
- Build: Vite

Key components:
- `views/` - Page components (`Transactions`, `Import`)
- `components/` - Reusable UI components
- `lib/api.ts` - Typed API client functions

### Data Flow

1. File upload -> parser -> `TransactionDraft` objects -> repository -> database
2. Frontend fetch -> API route -> repository -> database -> response

### Database Schema

- `transactions`: Core financial records, linked to accounts, categories, and import jobs
- `accounts`: Bank accounts/credit cards
- `categories`: Hierarchical transaction categories (`parentId` for nesting)
- `importJobs`: Tracks file imports; deleting cascades to associated transactions

### Adding New Parsers

1. Create parser in `src/extraction/parsers/` implementing `BillParser`
2. Add parser to `ExtractionProcessor.parsers` in `src/extraction/processor.ts`
3. Use parser `identifier` as the type in upload requests

## Testing Requirements

### Backend

- All API endpoints must have tests covering success and error cases
- New parsers must include tests with sample fixture files in `tests/functional/fixtures/`
- Repository methods with business logic (beyond simple CRUD) should be tested
- Each test file must use an isolated test database (`test-<name>.db`) to avoid conflicts
- Tests live in `tests/functional/`

### Frontend

- All new components must have corresponding test files (`ComponentName.test.tsx`)
- Actions that trigger visual changes (button clicks, form submissions, state updates) must be tested
- Use React Testing Library with `userEvent` for interactions
- Test files live alongside components or in the same directory as views

## Feature Validation

When frontend functionality is implemented or modified, validate behavior manually in the browser after tests pass. Record a short GIF/video only when explicitly requested.

## Environment Variables

- `DATABASE_URL` - Database file path (default: `sqlite.db`)
- `VITE_API_URL` - Frontend API base URL (default: `http://localhost:3000`)

## Agent Workflow Expectations

- Prefer focused, minimal changes over broad refactors.
- Run targeted tests first, then broader suites as needed.
- Keep architecture consistency with existing route, repository, and parser patterns.
- If a task touches both backend and frontend, verify both layers.

## Skills

### Available skills

- `add-parser`: Scaffold a new CSV parser, register it in the extraction processor, and create fixture/test starters. (`.codex/skills/add-parser/SKILL.md`)
- `add-route`: Scaffold a new API route file, register it in the app router, and create a test skeleton. (`.codex/skills/add-route/SKILL.md`)
- `db-fresh`: Reset and reseed the local SQLite database. (`.codex/skills/db-fresh/SKILL.md`)
- `dev`: Start backend and frontend dev servers with log/PID reporting. (`.codex/skills/dev/SKILL.md`)
- `migrate`: Generate and apply Drizzle migrations. (`.codex/skills/migrate/SKILL.md`)
- `test-all`: Run backend and frontend test suites. (`.codex/skills/test-all/SKILL.md`)
- `validate-feature`: Run a repeatable manual frontend validation checklist and capture evidence when requested. (`.codex/skills/validate-feature/SKILL.md`)

### How to use skills

- Trigger a skill by name in a prompt (for example: `use add-parser`).
- Read the skill file first, then run its bundled script(s) where provided.
- Keep `.claude/skills/` as-is for Claude Code compatibility; Codex-oriented skills live in `.codex/skills/`.
