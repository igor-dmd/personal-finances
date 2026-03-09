import { InstallmentsRepository } from '../../installments/data/installments-repository';
import { RecurringTransactionsRepository } from '../../recurring/data/recurring-transactions-repository';

export class FuturePlanningRepository {
    constructor(
        private readonly installmentsRepository = new InstallmentsRepository(),
        private readonly recurringRepository = new RecurringTransactionsRepository()
    ) {}

    async getData(months = 6): Promise<{
        futureInstallments: Array<{
            groupId: number;
            description: string;
            installmentNumber: number;
            dueDate: Date | null;
            amount: number;
            remainingInstallments: number;
        }>;
        recurringExpenses: Array<{
            id: number;
            description: string;
            categoryName: string | null;
            averageAmount: number;
        }>;
        monthlyTotals: Array<{
            year: number;
            month: number;
            recurringTotal: number;
            installmentTotal: number;
        }>;
    }> {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        const groups = await this.installmentsRepository.listGroups();
        const futureInstallments: Array<{
            groupId: number;
            description: string;
            installmentNumber: number;
            dueDate: Date | null;
            amount: number;
            remainingInstallments: number;
        }> = [];

        for (const group of groups) {
            if (group.paidInstallments < group.totalInstallments) {
                const remainingInstallments = group.totalInstallments - group.paidInstallments;
                const installmentAmount = group.totalAmount / group.totalInstallments;

                for (
                    let installmentNumber = group.paidInstallments + 1;
                    installmentNumber <= group.totalInstallments;
                    installmentNumber += 1
                ) {
                    const monthsAhead = installmentNumber - group.paidInstallments - 1;
                    const dueDate = new Date(today);
                    dueDate.setMonth(dueDate.getMonth() + monthsAhead);

                    futureInstallments.push({
                        groupId: group.id,
                        description: group.description,
                        installmentNumber,
                        dueDate,
                        amount: installmentAmount,
                        remainingInstallments,
                    });
                }
            }
        }

        const recurring = await this.recurringRepository.list();
        const recurringExpenses = recurring.map((item) => ({
            id: item.id,
            description: item.description,
            categoryName: item.categoryName,
            averageAmount: item.averageAmount,
        }));

        const monthlyTotals: Array<{
            year: number;
            month: number;
            recurringTotal: number;
            installmentTotal: number;
        }> = [];

        for (let monthIndex = 0; monthIndex < months; monthIndex += 1) {
            const year = currentYear + Math.floor((currentMonth + monthIndex) / 12);
            const month = (currentMonth + monthIndex) % 12;
            const recurringTotal = recurringExpenses.reduce((sum, item) => sum + item.averageAmount, 0);

            let installmentTotal = 0;
            for (const installment of futureInstallments) {
                if (!installment.dueDate) {
                    continue;
                }
                const dueDate = new Date(installment.dueDate);
                if (dueDate.getFullYear() === year && dueDate.getMonth() === month) {
                    installmentTotal += installment.amount;
                }
            }

            monthlyTotals.push({
                year,
                month,
                recurringTotal,
                installmentTotal,
            });
        }

        return {
            futureInstallments,
            recurringExpenses,
            monthlyTotals,
        };
    }
}
