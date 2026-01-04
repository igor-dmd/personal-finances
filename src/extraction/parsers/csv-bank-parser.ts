import { parse } from 'csv-parse/sync';
import { BillParser, TransactionDraft } from '../types';
import { validateCsvHeaders, KNOWN_HEADERS, suggestParser } from '../utils/header-validator';

interface NubankRecord {
    date: string;
    title: string;
    amount: string;
}

export class CsvBankParser implements BillParser {
    name = 'Nubank Credit Card Bill CSV';
    identifier = 'nubank-cc-bill-csv';

    supports(filename: string): boolean {
        return filename.toLowerCase().endsWith('.csv');
    }

    async parse(content: Buffer): Promise<TransactionDraft[]> {
        const fileContent = content.toString('utf-8');

        // Validation
        const expectedHeaders = KNOWN_HEADERS[this.identifier];
        if (expectedHeaders) {
            const { isValid, foundHeaders } = validateCsvHeaders(fileContent, expectedHeaders);
            if (!isValid) {
                let errorMsg = `Invalid headers for ${this.name}. Expected: ${expectedHeaders.join(', ')}. Found: ${foundHeaders.join(', ')}.`;
                const suggestion = suggestParser(foundHeaders);
                if (suggestion) {
                    errorMsg += ` Did you mean to use parser '${suggestion}'?`;
                }
                throw new Error(errorMsg);
            }
        }

        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as NubankRecord[];

        // Nubank format: date,title,amount
        return records.map((record) => {
            return {
                date: new Date(record.date),
                amount: parseFloat(record.amount),
                description: record.title,
                originalDescription: record.title,
            };
        });
    }
}
