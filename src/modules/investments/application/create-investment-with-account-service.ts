import { getInstitutionsConfig } from '../../../shared/config/institutions';
import { resolveInstitutionAccountName } from '../../shared/application/institution-account-resolver';
import { AccountsRepository } from '../../shared/data/accounts-repository';
import { InvestmentsRepository } from '../data/investments-repository';

interface CreateInvestmentWithAccountInput {
    institutionId: string;
    type: string;
    name: string;
    currentValue?: number;
}

export class CreateInvestmentWithAccountService {
    private readonly institutionsConfig = getInstitutionsConfig();

    constructor(
        private readonly accountsRepository = new AccountsRepository(),
        private readonly investmentsRepository = new InvestmentsRepository()
    ) {}

    async execute(input: CreateInvestmentWithAccountInput) {
        const accountName = resolveInstitutionAccountName(
            this.institutionsConfig,
            input.institutionId,
            'investment'
        );

        const account = await this.accountsRepository.getOrCreate(accountName, 'investment');

        return this.investmentsRepository.create({
            accountId: account.id,
            type: input.type,
            name: input.name,
            currentValue: input.currentValue,
        });
    }
}
