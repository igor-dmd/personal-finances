import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import Database from 'better-sqlite3';

const execAsync = promisify(exec);
const CLI_PATH = path.join(__dirname, '../../src/index.ts');
const DUMMY_FILE = path.join(__dirname, 'fixtures/dummy_nubank.csv');
const TEST_DB = 'test.db';

describe('CLI Functional Test', () => {

    beforeAll(() => {
        // Ensure clean state
        if (fs.existsSync(TEST_DB)) {
            fs.unlinkSync(TEST_DB);
        }

    });

    afterAll(() => {
        if (fs.existsSync(TEST_DB)) {
            fs.unlinkSync(TEST_DB);
        }
    });

    it('should process the dummy csv file and save to DB', async () => {
        // 1. Run Migrations on Test DB
        await execAsync(`DATABASE_URL=${TEST_DB} npm run db:migrate`);

        // 2. Run CLI
        const command = `DATABASE_URL=${TEST_DB} npx tsx ${CLI_PATH} process-file ${DUMMY_FILE} nubank-cc-bill-csv`;
        const { stdout, stderr } = await execAsync(command);

        expect(stderr).toBe('');
        expect(stdout).toContain('Transações salvas com sucesso.');

        // 3. Verify DB Content
        const db = new Database(TEST_DB);
        const row: any = db.prepare("SELECT count(*) as count FROM transactions").get();
        expect(row.count).toBe(3); // 3 rows in dummy file

        // Clean up
        db.close();
    }, 20000);
});
