import { getInstitutionsConfig, type AccountType } from '../../../shared/config/institutions';
import { resolveInstitutionAccountName } from '../../shared/application/institution-account-resolver';
import { AccountsRepository } from '../../shared/data/accounts-repository';
import { TransactionsRepository } from '../data/transactions-repository';

interface CreateManualTransactionInput {
    institutionId: string;
    categoryId: number | null;
    date: Date;
    amount: number;
    description: string;
    type: AccountType;
    isInvestment?: boolean;
}

export class CreateManualTransactionService {
    private readonly institutionsConfig = getInstitutionsConfig();

    constructor(
        private readonly accountsRepository = new AccountsRepository(),
        private readonly transactionsRepository = new TransactionsRepository()
    ) {}

    async execute(input: CreateManualTransactionInput) {
        const accountName = resolveInstitutionAccountName(
            this.institutionsConfig,
            input.institutionId,
            input.type
        );

        const account = await this.accountsRepository.getOrCreate(accountName, input.type);

        return this.transactionsRepository.createManualTransaction({
            accountId: account.id,
            categoryId: input.categoryId,
            date: input.date,
            amount: input.amount,
            description: input.description,
            type: input.type,
            isInvestment: input.isInvestment,
        });
    }
}
