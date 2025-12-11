import { BillParser, TransactionDraft } from './types';
import { CsvBankParser } from './parsers/csv-bank-parser';
import { PdfCardParser } from './parsers/pdf-card-parser';

export class ExtractionProcessor {
    private parsers: BillParser[] = [
        new CsvBankParser(),
        new PdfCardParser(),
    ];

    async process(filename: string, content: Buffer): Promise<TransactionDraft[]> {
        for (const parser of this.parsers) {
            if (parser.supports(filename, content)) {
                return parser.parse(content);
            }
        }
        throw new Error(`No parser found for file: ${filename}`);
    }
}
