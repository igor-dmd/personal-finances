import pdf from 'pdf-parse';
import { BillParser, TransactionDraft } from '../types';

export class PdfCardParser implements BillParser {
    name = 'Generic PDF Card Parser';

    supports(filename: string): boolean {
        return filename.toLowerCase().endsWith('.pdf');
    }

    async parse(content: Buffer): Promise<TransactionDraft[]> {
        const data = await pdf(content);
        const text = data.text;
        const lines = text.split('\n');
        const transactions: TransactionDraft[] = [];

        // Simple regex for lines like: "2023-10-25  Starbucks  12.50"
        // This is a placeholder logic. Real PDF parsing is brittle.
        // Matches YYYY-MM-DD followed by text and then a number (positive or negative)
        const regex = /(\d{4}-\d{2}-\d{2})\s+(.+)\s+(-?\d+\.\d{2})/;

        for (const line of lines) {
            const match = line.match(regex);
            if (match) {
                transactions.push({
                    date: new Date(match[1]),
                    description: match[2].trim(),
                    amount: parseFloat(match[3]),
                });
            }
        }

        return transactions;
    }
}
