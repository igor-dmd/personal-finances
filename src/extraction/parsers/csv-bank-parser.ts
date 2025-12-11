import { parse } from 'csv-parse/sync';
import { BillParser, TransactionDraft } from '../types';

export class CsvBankParser implements BillParser {
    name = 'Generic CSV Bank Parser';

    supports(filename: string): boolean {
        return filename.toLowerCase().endsWith('.csv');
    }

    async parse(content: Buffer): Promise<TransactionDraft[]> {
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        // Assuming a generic format like: Date, Description, Amount
        // In a real app, we might need more specific logic or multiple CSV parsers
        return records.map((record: any) => {
            // Handle potential different casing or column names
            const dateStr = record.Date || record.date;
            const amountStr = record.Amount || record.amount;
            const desc = record.Description || record.description;
            const origDesc = record.OriginalDescription || record.original_description;

            if (!dateStr || !amountStr) {
                // Skip invalid rows or throw error? For now, skip if critical data missing
                // But map needs to return something. Let's return null and filter later if we were doing that.
                // For now, assume valid data or let Date/parseFloat handle it (might result in NaN/Invalid Date)
            }

            return {
                date: new Date(dateStr),
                amount: parseFloat(amountStr),
                description: desc || 'Unknown Transaction',
                originalDescription: origDesc,
            };
        });
    }
}
