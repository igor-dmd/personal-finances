import { describe, it, expect } from 'vitest';
import { CsvBankParser } from './csv-bank-parser';

describe('CsvBankParser', () => {
    const parser = new CsvBankParser();

    it('should have the correct name and identifier', () => {
        expect(parser.name).toBe('Nubank Credit Card Bill CSV');
        expect(parser.identifier).toBe('nubank-cc-bill-csv');
    });

    it('should support .csv files', () => {
        expect(parser.supports('statement.csv')).toBe(true);
        expect(parser.supports('statement.CSV')).toBe(true);
        expect(parser.supports('statement.pdf')).toBe(false);
    });

    it('should parse valid nubank csv content', async () => {
        const csvContent = `date,title,amount
2023-12-01,Uber,24.90
2023-12-02,McDonalds,45.50`;
        const buffer = Buffer.from(csvContent);

        const transactions = await parser.parse(buffer);

        expect(transactions).toHaveLength(2);

        expect(transactions[0]).toEqual({
            date: new Date('2023-12-01T00:00:00.000Z'), // csv-parse/Date behavior might need UTC adjustment if not specified, but usually defaults to 00:00 UTC for date-only strings in JS Date parsing.
            amount: 24.90,
            description: 'Uber',
            originalDescription: 'Uber'
        });

        expect(transactions[1]).toEqual({
            date: new Date('2023-12-02T00:00:00.000Z'),
            amount: 45.50,
            description: 'McDonalds',
            originalDescription: 'McDonalds'
        });
    });

    it('should handle negative amounts', async () => {
        const csvContent = `date,title,amount
2023-12-04,Payment,-100.00`;
        const buffer = Buffer.from(csvContent);
        const transactions = await parser.parse(buffer);

        expect(transactions[0].amount).toBe(-100.00);
    });
});
