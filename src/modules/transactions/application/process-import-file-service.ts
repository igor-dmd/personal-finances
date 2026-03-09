import { ExtractionProcessor } from '../../../extraction/processor';
import { ImportJobsRepository } from '../../imports/data/import-jobs-repository';
import { AccountsRepository } from '../../shared/data/accounts-repository';
import { TransactionsRepository } from '../data/transactions-repository';

interface ProcessImportFileInput {
    fileName: string;
    content: Buffer;
    parserType: string;
}

interface ProcessImportFileResult {
    count: number;
    jobId: number;
}

export class ProcessImportFileService {
    constructor(
        private readonly processor = new ExtractionProcessor(),
        private readonly accountsRepository = new AccountsRepository(),
        private readonly transactionsRepository = new TransactionsRepository(),
        private readonly importJobsRepository = new ImportJobsRepository()
    ) {}

    async execute(input: ProcessImportFileInput): Promise<ProcessImportFileResult> {
        const drafts = await this.processor.processByType(input.fileName, input.content, input.parserType);
        const transactionType = this.processor.getTransactionType(input.parserType);

        const accountDefinition = getAccountFromParserType(input.parserType);
        const account = await this.accountsRepository.getOrCreate(
            accountDefinition.name,
            accountDefinition.type
        );

        const importJob = await this.importJobsRepository.create(input.fileName, 'pending', input.parserType);

        try {
            await this.transactionsRepository.saveImportedTransactions(
                drafts,
                account.id,
                importJob.id,
                transactionType
            );
            await this.importJobsRepository.updateStatus(importJob.id, 'completed');
        } catch (error) {
            await this.importJobsRepository.updateStatus(importJob.id, 'failed');
            throw error;
        }

        return {
            count: drafts.length,
            jobId: importJob.id,
        };
    }
}

function getAccountFromParserType(parserType: string): { name: string; type: 'credit_card' | 'checking' } {
    if (parserType === 'nubank-checking-csv') {
        return {
            name: 'Nubank Checking Account',
            type: 'checking',
        };
    }

    return {
        name: 'Nubank Credit Card',
        type: 'credit_card',
    };
}
