import { BillParser, TransactionDraft } from './types';
import { CsvBankParser } from './parsers/csv-bank-parser';
import { NubankCheckingParser } from './parsers/nubank-checking-parser';

export class ExtractionProcessor {
    private parsers: BillParser[] = [
        new CsvBankParser(),
        new NubankCheckingParser(),
    ];

    getAvailableParsers() {
        return this.parsers.map(p => ({
            name: p.name,
            identifier: p.identifier
        }));
    }

    async processByType(filename: string, content: Buffer, type: string): Promise<TransactionDraft[]> {
        const parser = this.parsers.find(p => p.identifier === type);
        if (!parser) {
            throw new Error(`No parser found for type: ${type}`);
        }
        return parser.parse(content);
    }
}
