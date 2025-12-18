import { parse } from 'csv-parse/sync';
import { BillParser, TransactionDraft } from '../types';

export class CsvBankParser implements BillParser {
    name = 'Nubank Credit Card Bill CSV';
    identifier = 'nubank-cc-bill-csv';

    supports(filename: string): boolean {
        return filename.toLowerCase().endsWith('.csv');
    }

    async parse(content: Buffer): Promise<TransactionDraft[]> {
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        // Nubank format: date,title,amount
        return records.map((record: any) => {
            return {
                date: new Date(record.date),
                amount: parseFloat(record.amount),
                description: record.title,
                originalDescription: record.title,
            };
        });
    }
}
