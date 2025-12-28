# Personal Finances Web App

A personal finance management application built with a modern TypeScript stack.

## Requirements

Ensure you have the following installed on your system:

-   **Node.js**: v18.0.0 or higher
-   **npm**: v9.0.0 or higher
-   **Git**

## Project Structure

-   **Backend**: Located in the root directory. Built with Hono, Better-SQLite3, and Drizzle ORM.
-   **Frontend**: Located in the `frontend/` directory. Built with React, Vite, and Tailwind CSS.

---

## 🚀 Getting Started

### 1. Backend Setup

The backend serves the API and handles database interactions.

1.  **Install Dependencies**:
    navigate to the root directory and install dependencies:
    ```bash
    npm install
    ```

2.  **Database Migration**:
    Initialize the SQLite database (`sqlite.db`) and apply migrations:
    ```bash
    npm run db:generate
    npm run db:migrate
    ```

3.  **Database Seeding (Optional)**:
    Populate the database with sample data for development:
    ```bash
    npm run db:seed
    ```

    To empty the database:
    ```bash
    npm run db:reset
    ```

5.  **Run the Backend Server**:
    Start the development server (runs on port 3000 by default):
    ```bash
    npm run api:dev
    ```
    The API will be accessible at `http://localhost:3000`.

### 2. Frontend Setup

The frontend provides the user interface for managing transactions.

1.  **Navigate to Frontend Directory**:
    ```bash
    cd frontend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run the Frontend**:
    Start the Vite development server:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

    > **Note**: The frontend is configured to communicate with the backend at `http://localhost:3000/transactions`. Ensure the backend server is running simultaneously.

---

## 🧪 Running Tests

The project includes functional tests for both the CLI and the API.

To run the tests, execute the following command in the **root** directory:
```bash
npm test
```

This commands runs `vitest` which will execute:
-   **CLI Tests**: `tests/functional/cli.test.ts`
-   **API Tests**: `tests/functional/api.test.ts`

---

## 🛠️ CLI Usage (Optional)

You can also use the CLI to process bank statement files directly.

```bash
# Process a CSV file
npx tsx src/index.ts process-file <path-to-csv> <parser-type>

# Example
npx tsx src/index.ts process-file ./statement.csv nubank-cc-bill-csv
```
