# Architecture Assessment

## Executive summary

The project already has a good baseline for a small modular monolith:

- clear split between backend (`src/`) and frontend (`frontend/src/`)
- route-level request validation with Zod
- a single data access layer using Drizzle
- parser subsystem isolated under `src/extraction/`

The main risk is **not lack of structure**, but **concentration of responsibilities** in a few places (especially `FinanceRepository` and some route handlers). This makes feature evolution slower and increases regression risk.

## Current organization (what is good)

- API entrypoint and route registration are centralized in [`src/api/app.ts`](/home/igor/dev/personal-finances/src/api/app.ts).
- Database schema is centralized in [`src/db/schema.ts`](/home/igor/dev/personal-finances/src/db/schema.ts).
- Parsing pipeline is clearly separated in [`src/extraction/processor.ts`](/home/igor/dev/personal-finances/src/extraction/processor.ts) and `src/extraction/parsers/*`.
- Frontend routing is centralized in [`frontend/src/App.tsx`](/home/igor/dev/personal-finances/frontend/src/App.tsx).

## Findings and improvement opportunities

### 1) Repository is a God Object (high impact)

[`src/db/repository.ts`](/home/igor/dev/personal-finances/src/db/repository.ts) mixes many bounded contexts:

- transactions/imports
- installments
- investments and movements
- ignored descriptions
- recurring planning

This file is currently handling both persistence and business logic, which increases coupling and makes local changes harder.

### 2) Route handlers contain business orchestration logic (high impact)

In [`src/api/routes/installments.ts:70`](/home/igor/dev/personal-finances/src/api/routes/installments.ts:70), the handler performs full use-case orchestration and issues multiple repository calls.

The loop at [`src/api/routes/installments.ts:98`](/home/igor/dev/personal-finances/src/api/routes/installments.ts:98) + [`src/api/routes/installments.ts:112`](/home/igor/dev/personal-finances/src/api/routes/installments.ts:112) can be race-prone and inefficient:

- creates transaction
- fetches all transactions
- assumes last transaction is the one just created

This should move to an application service and ideally to a transactionally-safe repository method.

### 3) Inconsistent API client boundary in frontend (medium impact)

Most frontend requests go through [`frontend/src/lib/api.ts`](/home/igor/dev/personal-finances/frontend/src/lib/api.ts), but [`frontend/src/views/Import.tsx:27`](/home/igor/dev/personal-finances/frontend/src/views/Import.tsx:27), [`frontend/src/views/Import.tsx:42`](/home/igor/dev/personal-finances/frontend/src/views/Import.tsx:42), and [`frontend/src/views/Import.tsx:94`](/home/igor/dev/personal-finances/frontend/src/views/Import.tsx:94) use hardcoded URLs directly.

This creates config drift and duplicated error handling behavior.

### 4) Config loading is duplicated across routes (medium impact)

`institutions.json` loading is repeated in:

- [`src/api/routes/transactions.ts:10`](/home/igor/dev/personal-finances/src/api/routes/transactions.ts:10)
- [`src/api/routes/installments.ts:11`](/home/igor/dev/personal-finances/src/api/routes/installments.ts:11)
- [`src/api/routes/investments.ts:11`](/home/igor/dev/personal-finances/src/api/routes/investments.ts:11)

This should be centralized in a single config module.

### 5) Type and contract drift signals (medium impact)

- `categories` schema uses `any` in self-reference at [`src/db/schema.ts:11`](/home/igor/dev/personal-finances/src/db/schema.ts:11)
- CLI call appears out-of-sync with repository signature at [`src/index.ts:40`](/home/igor/dev/personal-finances/src/index.ts:40) vs `saveTransactions(..., transactionType)` in repository

These are maintainability warnings that indicate contract ownership is diffused.

### 6) Query-level scalability concerns (medium impact)

Potential N+1 patterns:

- installments summary loop at [`src/db/repository.ts:285`](/home/igor/dev/personal-finances/src/db/repository.ts:285)
- investments summary loop at [`src/db/repository.ts:385`](/home/igor/dev/personal-finances/src/db/repository.ts:385)

Fine for small datasets, but likely to degrade when data grows.

## Recommended target architecture

Use a **modular monolith with vertical slices**. Keep one deployable app, split by feature module, and avoid collapsing unrelated concerns into a single `infrastructure` bucket.

Suggested backend structure:

```text
src/
  modules/
    transactions/
      api/
      application/
      domain/
      data/
    installments/
    investments/
    imports/
    recurring/
    planning/
  shared/
    api/
    application/
    domain/
    data/
    config/
    extraction/
    http/
    types/
```

Rules:

- `api/` only maps HTTP -> use-case input/output
- `application/` orchestrates use cases
- `domain/` contains business rules and policy
- `data/` handles Drizzle repositories and persistence adapters
- `config/` handles runtime/app configuration loading and validation
- `extraction/` is an independent technical/business capability (parsers, normalization, processing)
- `shared/` should mirror module layering when useful (`shared/api`, `shared/application`, `shared/domain`, `shared/data`) for cross-cutting concerns
- cross-module communication happens via application services or explicit interfaces, not direct table/feature leakage

Naming guidance:

- Prefer explicit names like `data`, `config`, and `extraction` over broad `infrastructure`.
- Keep `infrastructure` only if you strictly use it for adapter implementations behind ports.
- For this repository, `data + config + extraction` is clearer and better aligned with how code is expected to evolve.

## Phased refactor plan

1. Introduce shared modules without changing behavior
- add `shared/config/institutions.ts`
- add shared HTTP helpers (error mapping, id parsing)
- route files call helpers instead of local duplication

2. Split repository by module interfaces
- create `TransactionsRepository`, `InstallmentsRepository`, `InvestmentsRepository`, etc.
- keep a temporary adapter that proxies old `FinanceRepository` methods

3. Extract application services for complex flows
- `CreateInstallmentPlanService`
- `ProcessImportFileService`
- `CreateInvestmentWithAccountService`

4. Align frontend data boundary
- move Import view to `frontend/src/lib/api.ts`
- optionally split API client into feature files (`api/transactions.ts`, `api/imports.ts`)

5. Optimize hot query paths
- replace N+1 summaries with grouped SQL queries
- add pagination/filtering where needed

## Visual references

- Current architecture diagram: [`docs/architecture/current-architecture.mmd`](/home/igor/dev/personal-finances/docs/architecture/current-architecture.mmd)
- Target architecture diagram: [`docs/architecture/future-architecture.mmd`](/home/igor/dev/personal-finances/docs/architecture/future-architecture.mmd)

## External references (for decision framing)

- Modular Monolith concept (DDD strategic boundary applied in one deployable)
- Ports and Adapters (Hexagonal) as a pragmatic boundary tool, not dogma
- Vertical Slice Architecture for feature-oriented organization in TypeScript services
