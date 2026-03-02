
import { parse } from 'csv-parse/sync';
import { BillParser, TransactionDraft, TRANSACTION_TYPES } from '../types';
import { normalizeDescription } from '../normalizers/description-normalizer';
import { parseInstallmentFromDescription } from '../utils/installment-parser';

interface NubankCheckingRecord {
    Data: string;
    Valor: string;
    Identificador: string;
    Descrição: string;
}

export class NubankCheckingParser implements BillParser {
    name = 'Nubank Checking Account CSV';
    identifier = 'nubank-checking-csv';
    transactionType = TRANSACTION_TYPES.CHECKING;

    supports(filename: string, content: Buffer): boolean {
        return filename.toLowerCase().endsWith('.csv');
    }

    async parse(content: Buffer): Promise<TransactionDraft[]> {
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as NubankCheckingRecord[];

        return records
            .filter(record => record.Descrição !== 'Movimento automático para realização de transação compartilhada')
            .map(record => {
                const amount = parseFloat(record.Valor);
                const description = normalizeDescription(record.Descrição);
                const installmentInfo = parseInstallmentFromDescription(record.Descrição);

                // Parse date: DD/MM/YYYY
                const [day, month, year] = record.Data.split('/').map(Number);
                const date = new Date(year, month - 1, day);

                return {
                    date,
                    amount,
                    description,
                    originalDescription: record.Descrição,
                    installmentInfo,
                };
            });
    }
}
