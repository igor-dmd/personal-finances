# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and Antigravity agents when working with code in this repository.

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

### Frontend (frontend/ directory)

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

## Skills

Custom slash commands available in `.claude/skills/`:

- `/add-parser` - Scaffold a new bank statement parser
- `/add-route` - Scaffold a new API route
- `/db-fresh` - Reset and reseed database
- `/dev` - Start both backend and frontend servers
- `/migrate` - Generate and apply database migrations
- `/test-all` - Run full test suite (backend + frontend)
- `/validate-feature` - Record video demonstration of frontend functionality (requires Chrome plugin)

## Architecture

This is a full-stack TypeScript personal finance tracking application with separate backend and frontend.

### Backend (`src/`)

- **API Framework**: Hono with Node.js adapter
- **Database**: SQLite via `better-sqlite3` with Drizzle ORM
- **Validation**: Zod schemas for request validation

Key components:
- `src/api/app.ts` - Hono app setup, routes mounted here
- `src/api/routes/` - API route handlers (transactions, import-jobs)
- `src/db/schema.ts` - Drizzle table definitions (accounts, categories, transactions, importJobs)
- `src/db/repository.ts` - Data access layer (FinanceRepository class)
- `src/extraction/processor.ts` - ExtractionProcessor routes files to parsers
- `src/extraction/parsers/` - File parsers implement BillParser interface

### Frontend (`frontend/src/`)

- **Framework**: React 19 with React Router
- **Styling**: Tailwind CSS
- **Build**: Vite

Key components:
- `views/` - Page components (Transactions, Import)
- `components/` - Reusable UI components
- `lib/api.ts` - Typed API client functions

### Data Flow

1. File upload -> Parser -> TransactionDraft objects -> Repository -> Database
2. Frontend fetch -> API route -> Repository -> Database -> Response

### Database Schema

- **transactions**: Core financial records, linked to accounts, categories, and import jobs
- **accounts**: Bank accounts/credit cards
- **categories**: Hierarchical transaction categories (parentId for nesting)
- **importJobs**: Tracks file imports; deleting cascades to associated transactions

### Adding New Parsers

1. Create parser in `src/extraction/parsers/` implementing BillParser interface
2. Add to `ExtractionProcessor.parsers` array in `src/extraction/processor.ts`
3. Use the parser's `identifier` as the type in upload requests

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
- Test files live alongside their components or in the same directory as views

### Feature Validation (Chrome Plugin)

**REQUIRED**: When the Chrome browser plugin is enabled and any frontend functionality is implemented or modified:
- **MUST** use the `/validate-feature` skill to demonstrate the functionality
- Create a GIF recording showing the feature in action
- This applies to all UI changes, new workflows, or modified user interactions
- The validation should happen after implementation and testing are complete
- This provides visual documentation of features and ensures they work as expected

## Environment Variables

- `DATABASE_URL` - Database file path (default: `sqlite.db`)
- `VITE_API_URL` - Frontend API base URL (default: `http://localhost:3000`)
