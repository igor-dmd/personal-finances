import { getInstitutionsConfig } from '../../../shared/config/institutions';
import { resolveInstitutionAccountName } from '../../shared/application/institution-account-resolver';
import { AccountsRepository } from '../../shared/data/accounts-repository';
import { InstallmentsRepository } from '../data/installments-repository';

interface CreateInstallmentPlanInput {
    description: string;
    totalInstallments: number;
    totalAmount: number;
    firstInstallmentDate: Date;
    institutionId: string;
    type: 'credit_card' | 'checking';
    categoryId?: number | null;
}

interface CreateInstallmentPlanResult {
    groupId: number;
    created: number;
}

export class CreateInstallmentPlanService {
    private readonly institutionsConfig = getInstitutionsConfig();

    constructor(
        private readonly accountsRepository = new AccountsRepository(),
        private readonly installmentsRepository = new InstallmentsRepository()
    ) {}

    async execute(input: CreateInstallmentPlanInput): Promise<CreateInstallmentPlanResult> {
        const accountName = resolveInstitutionAccountName(
            this.institutionsConfig,
            input.institutionId,
            input.type
        );

        const account = await this.accountsRepository.getOrCreate(accountName, input.type);

        const groupId = await this.installmentsRepository.createGroup(
            input.description,
            input.totalInstallments,
            input.totalAmount
        );

        const installmentAmount = input.totalAmount / input.totalInstallments;

        for (let index = 1; index <= input.totalInstallments; index += 1) {
            const installmentDate = new Date(input.firstInstallmentDate);
            installmentDate.setMonth(installmentDate.getMonth() + (index - 1));

            await this.installmentsRepository.createInstallmentTransaction({
                accountId: account.id,
                categoryId: input.categoryId ?? null,
                date: installmentDate,
                amount: -installmentAmount,
                description: `${input.description} - Parcela ${index}/${input.totalInstallments}`,
                type: input.type,
                installmentGroupId: groupId,
                installmentNumber: index,
            });
        }

        return {
            groupId,
            created: input.totalInstallments,
        };
    }
}
