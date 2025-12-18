import { BillParser, TransactionDraft } from './types';
import { CsvBankParser } from './parsers/csv-bank-parser';

export class ExtractionProcessor {
    private parsers: BillParser[] = [
        new CsvBankParser(),
    ];



    async processByType(filename: string, content: Buffer, type: string): Promise<TransactionDraft[]> {
        const parser = this.parsers.find(p => p.identifier === type);
        if (!parser) {
            throw new Error(`No parser found for type: ${type}`);
        }
        return parser.parse(content);
    }
}
