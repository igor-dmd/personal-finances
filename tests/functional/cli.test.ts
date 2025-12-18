import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const CLI_PATH = path.join(__dirname, '../../src/index.ts');
const DUMMY_FILE = path.join(__dirname, 'fixtures/dummy_nubank.csv');

describe('CLI Functional Test', () => {

    it('should process the dummy csv file via CLI', async () => {
        // Using npx tsx to run the typescript file directly
        const command = `npx tsx ${CLI_PATH} process-file ${DUMMY_FILE} nubank-cc-bill-csv`;

        const { stdout, stderr } = await execAsync(command);

        expect(stderr).toBe('');
        expect(stdout).toContain('Processing file:');
        expect(stdout).toContain('Transactions extracted:');
        expect(stdout).toContain('"amount": 12');
        expect(stdout).toContain('"description": "Super Express"');
        expect(stdout).toContain('"amount": 302.07');
        expect(stdout).toContain('"description": "Posto Reis Magos"');
    }, 10000); // increase timeout for cli execution
});
