
import { expect, test, describe } from 'vitest';
import { NubankCheckingParser } from '../../src/extraction/parsers/nubank-checking-parser';
import * as fs from 'fs';
import * as path from 'path';

describe('NubankCheckingParser', () => {
    test('parses sample file correctly', async () => {
        const parser = new NubankCheckingParser();
        // Adjust path if necessary, assuming test runner is executed from root or knows how to resolve
        const fixturePath = path.resolve(process.cwd(), 'tests/functional/fixtures/nubank-checking-sample.csv');
        const content = fs.readFileSync(fixturePath);

        const transactions = await parser.parse(content);

        expect(transactions).toHaveLength(3); // One row filtered out

        const t1 = transactions[0];
        expect(t1.description).toBe('Transferência - JOHN DOE');
        expect(t1.amount).toBe(-100.50);
        expect(t1.date).toEqual(new Date(2023, 0, 1));

        const t2 = transactions[1];
        expect(t2.description).toBe('Pix - JANE DOE');
        expect(t2.amount).toBe(500.00);

        const t3 = transactions[2];
        expect(t3.description).toBe('Compra no Mercado');

        // Ensure the filtered row is not present
        const filtered = transactions.find(t => t.originalDescription?.includes('Movimento automático'));
        expect(filtered).toBeUndefined();
    });
});
