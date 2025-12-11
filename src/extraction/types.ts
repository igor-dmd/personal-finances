export interface TransactionDraft {
    date: Date;
    amount: number;
    description: string;
    originalDescription?: string;
}

export interface BillParser {
    name: string;
    supports(filename: string, content: Buffer): boolean;
    parse(content: Buffer): Promise<TransactionDraft[]>;
}
