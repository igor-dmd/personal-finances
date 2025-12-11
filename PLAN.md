# Project Plan: Personal Finances

## 1. Project Concept
The goal is to build a **Personal Finances Web Application** that helps users track their financial health.
Key use cases include:
-   **Automated Data Ingestion**: Extracting transaction data from various source formats (PDF bills, CSV bank exports) to minimize manual entry.
-   **Transaction Management**: Viewing, categorizing, and managing financial transactions.
-   **Insights & Reporting**: (Future) Visualizing spending habits and trends.

## 2. Technology Stack & Rationale
The project is built using a modern TypeScript stack focusing on type safety and developer experience.

-   **Runtime Environment**: Node.js
-   **Language**: TypeScript (Strict type checking for robust data handling)
-   **Database**: SQLite (via `better-sqlite3`)
    -   *Rationale*: Simple, serverless, file-based database ideal for personal/local applications.
-   **ORM**: Drizzle ORM
    -   *Rationale*: Lightweight, type-safe, and has great DX with migration generation (`drizzle-kit`).
-   **Parsers**:
    -   `pdf-parse`: For extracting text from PDF credit card bills.
    -   `csv-parse`: For processing CSV exports from bank accounts.
-   **Dev Tools**: `tsx` (TypeScript execution), Docker (Containerization).

## 3. Development Checklist

### Architecture & Setup
- [x] Initialize Project (package.json, tsconfig).
- [x] Set up Docker environment.
- [x] Configure Drizzle ORM & SQLite connection.

### Core Domain: Extraction
- [x] Define Transaction Types & Interfaces (`src/extraction/types.ts`).
- [x] Implement PDF Parser for Credit Card Bills (`src/extraction/parsers/pdf-card-parser.ts`).
- [x] Implement CSV Parser for Bank Exports (`src/extraction/parsers/csv-bank-parser.ts`).
- [x] Create Extraction Processor Logic (`src/extraction/processor.ts`).
- [x] Add Test Scripts for Extraction (`src/extraction/scripts/test-extraction.ts`).

### Data Persistence
- [ ] Implement Database Repository/Service for Transactions.
- [ ] Connect Extraction logic to Database (Save parsed data).

### Features: Web Application (Planned)
- [ ] Set up Web Framework (Next.js or React/Vite).
- [ ] Design System & UI Components (Tailwind/CSS).
- [ ] Dashboard Page (Overview of finances).
- [ ] Upload Interface (Drag & drop for bills/CSVs).
- [ ] Transaction List View.

### Next Steps
1.  Verify the end-to-end flow of parsing a file and inspecting the output (currently running via test scripts).
2.  Implement the persistence layer to save these parsed transactions to SQLite.
3.  Bootstrap the frontend application.
