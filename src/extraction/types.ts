export const TRANSACTION_TYPES = {
    CREDIT_CARD: 'credit_card',
    CHECKING: 'checking',
    // INVESTMENT: 'investment', // Future
} as const;

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];

export interface TransactionDraft {
    date: Date;
    amount: number;
    description: string;
    originalDescription?: string;
}

export interface BillParser {
    name: string;
    identifier: string;
    transactionType: TransactionType;
    supports(filename: string, content: Buffer): boolean;
    parse(content: Buffer): Promise<TransactionDraft[]>;
}
