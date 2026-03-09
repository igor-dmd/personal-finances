
import { db } from '..';
import {
    accounts,
    categories,
    ignoredDescriptions,
    importJobs,
    installmentGroups,
    investmentMovements,
    investments,
    recurringTransactions,
    transactions,
} from '../schema';

interface SeedTransactionInput {
    accountId: number;
    categoryId: number | null;
    importJobId: number | null;
    date: Date;
    amount: number;
    description: string;
    type: 'credit_card' | 'checking' | 'investment';
    installmentGroupId?: number | null;
    installmentNumber?: number | null;
    isInvestment?: boolean;
}

const TODAY_HOUR = 12;

function dateAtMonthOffset(monthOffset: number, day: number): Date {
    const date = new Date();
    date.setHours(TODAY_HOUR, 0, 0, 0);
    date.setDate(1);
    date.setMonth(date.getMonth() + monthOffset);

    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(day, lastDayOfMonth));
    return date;
}

function toNameIdMap(items: Array<{ id: number; name: string }>): Map<string, number> {
    return new Map(items.map((item) => [item.name, item.id]));
}

function requireId(map: Map<string, number>, key: string): number {
    const value = map.get(key);
    if (!value) {
        throw new Error(`Missing required seed key: ${key}`);
    }
    return value;
}

function buildRecurringSeed(
    description: string,
    categoryId: number | null,
    seededTransactions: SeedTransactionInput[]
) {
    const matches = seededTransactions
        .filter((transaction) => transaction.description === description)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (matches.length === 0) {
        throw new Error(`Cannot create recurring seed for "${description}" without matching transactions`);
    }

    const totalAmount = matches.reduce((sum, transaction) => sum + transaction.amount, 0);
    const averageAmount = Math.abs(totalAmount / matches.length);

    return {
        description,
        categoryId,
        averageAmount,
        occurrenceCount: matches.length,
        firstSeenDate: matches[0].date,
        lastSeenDate: matches[matches.length - 1].date,
    };
}

async function seed() {
    console.log('Seeding database...');

    try {
        console.log('Clearing existing data...');
        await db.delete(investmentMovements).run();
        await db.delete(investments).run();
        await db.delete(recurringTransactions).run();
        await db.delete(ignoredDescriptions).run();
        await db.delete(transactions).run();
        await db.delete(installmentGroups).run();
        await db.delete(importJobs).run();
        await db.delete(categories).run();
        await db.delete(accounts).run();

        const insertedAccounts = await db
            .insert(accounts)
            .values([
                { name: 'Nubank Cartao de Credito', type: 'credit_card', currency: 'BRL' },
                { name: 'Nubank Conta Corrente', type: 'checking', currency: 'BRL' },
                { name: 'Nubank Investimento', type: 'investment', currency: 'BRL' },
                { name: 'Mercado Pago Conta Corrente', type: 'checking', currency: 'BRL' },
            ])
            .returning();

        const accountMap = toNameIdMap(insertedAccounts);

        const insertedCategories = (await db
            .insert(categories)
            .values([
                { name: 'Salario' },
                { name: 'Aluguel' },
                { name: 'Academia' },
                { name: 'Supermercado' },
                { name: 'Restaurante' },
                { name: 'Combustivel' },
                { name: 'Eletronicos' },
                { name: 'Educacao' },
                { name: 'Lazer' },
                { name: 'Investimentos' },
            ])
            .returning()) as Array<{ id: number; name: string }>;

        const categoryMap = toNameIdMap(insertedCategories);

        const insertedJobs = await db
            .insert(importJobs)
            .values([
                {
                    filename: 'nubank-credit-card-current.csv',
                    type: 'nubank-cc-bill-csv',
                    status: 'completed',
                    createdAt: dateAtMonthOffset(0, 2),
                },
                {
                    filename: 'nubank-checking-last-month.csv',
                    type: 'nubank-checking-csv',
                    status: 'completed',
                    createdAt: dateAtMonthOffset(-1, 2),
                },
                {
                    filename: 'nubank-checking-pending.csv',
                    type: 'nubank-checking-csv',
                    status: 'pending',
                    createdAt: dateAtMonthOffset(0, 25),
                },
                {
                    filename: 'broken-credit-file.csv',
                    type: 'nubank-cc-bill-csv',
                    status: 'failed',
                    createdAt: dateAtMonthOffset(-2, 20),
                },
            ])
            .returning();

        const jobsByFilename = toNameIdMap(
            insertedJobs.map((job) => ({ id: job.id, name: job.filename }))
        );

        const [notebookInstallmentGroup, englishCourseInstallmentGroup] = await db
            .insert(installmentGroups)
            .values([
                {
                    description: 'Notebook gamer',
                    totalInstallments: 12,
                    totalAmount: 7200,
                    createdAt: dateAtMonthOffset(-3, 10),
                },
                {
                    description: 'Curso de ingles',
                    totalInstallments: 6,
                    totalAmount: 1200,
                    createdAt: dateAtMonthOffset(-6, 10),
                },
            ])
            .returning();

        const recurringDescriptions = new Set<string>(['Aluguel apartamento', 'Academia fit']);
        const ignoredDescription = 'Ajuste interno de saldo';

        const seededTransactions: SeedTransactionInput[] = [
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: requireId(categoryMap, 'Salario'),
                importJobId: requireId(jobsByFilename, 'nubank-checking-last-month.csv'),
                date: dateAtMonthOffset(-2, 5),
                amount: 6500,
                description: 'Salario ACME',
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: requireId(categoryMap, 'Salario'),
                importJobId: requireId(jobsByFilename, 'nubank-checking-last-month.csv'),
                date: dateAtMonthOffset(-1, 5),
                amount: 6500,
                description: 'Salario ACME',
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: requireId(categoryMap, 'Salario'),
                importJobId: null,
                date: dateAtMonthOffset(0, 5),
                amount: 6800,
                description: 'Salario ACME',
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: requireId(categoryMap, 'Aluguel'),
                importJobId: requireId(jobsByFilename, 'nubank-checking-last-month.csv'),
                date: dateAtMonthOffset(-2, 8),
                amount: -1800,
                description: 'Aluguel apartamento',
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: requireId(categoryMap, 'Aluguel'),
                importJobId: requireId(jobsByFilename, 'nubank-checking-last-month.csv'),
                date: dateAtMonthOffset(-1, 8),
                amount: -1800,
                description: 'Aluguel apartamento',
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: requireId(categoryMap, 'Aluguel'),
                importJobId: null,
                date: dateAtMonthOffset(0, 8),
                amount: -1800,
                description: 'Aluguel apartamento',
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: requireId(categoryMap, 'Academia'),
                importJobId: requireId(jobsByFilename, 'nubank-checking-last-month.csv'),
                date: dateAtMonthOffset(-3, 3),
                amount: -129.9,
                description: 'Academia fit',
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: requireId(categoryMap, 'Academia'),
                importJobId: requireId(jobsByFilename, 'nubank-checking-last-month.csv'),
                date: dateAtMonthOffset(-2, 3),
                amount: -129.9,
                description: 'Academia fit',
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: requireId(categoryMap, 'Academia'),
                importJobId: requireId(jobsByFilename, 'nubank-checking-last-month.csv'),
                date: dateAtMonthOffset(-1, 3),
                amount: -129.9,
                description: 'Academia fit',
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: requireId(categoryMap, 'Academia'),
                importJobId: null,
                date: dateAtMonthOffset(0, 3),
                amount: -129.9,
                description: 'Academia fit',
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Mercado Pago Conta Corrente'),
                categoryId: requireId(categoryMap, 'Supermercado'),
                importJobId: requireId(jobsByFilename, 'nubank-checking-last-month.csv'),
                date: dateAtMonthOffset(-1, 15),
                amount: -385.4,
                description: 'Supermercado central',
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Mercado Pago Conta Corrente'),
                categoryId: requireId(categoryMap, 'Supermercado'),
                importJobId: requireId(jobsByFilename, 'nubank-credit-card-current.csv'),
                date: dateAtMonthOffset(0, 15),
                amount: -420.65,
                description: 'Supermercado central',
                type: 'credit_card',
            },
            {
                accountId: requireId(accountMap, 'Nubank Cartao de Credito'),
                categoryId: requireId(categoryMap, 'Restaurante'),
                importJobId: requireId(jobsByFilename, 'nubank-credit-card-current.csv'),
                date: dateAtMonthOffset(0, 18),
                amount: -118.3,
                description: 'Jantar em familia',
                type: 'credit_card',
            },
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: null,
                importJobId: requireId(jobsByFilename, 'nubank-checking-last-month.csv'),
                date: dateAtMonthOffset(-1, 22),
                amount: 30,
                description: ignoredDescription,
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: null,
                importJobId: null,
                date: dateAtMonthOffset(0, 22),
                amount: -30,
                description: ignoredDescription,
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: null,
                importJobId: null,
                date: dateAtMonthOffset(0, 24),
                amount: -55,
                description: 'Pagamento avulso sem categoria',
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: requireId(categoryMap, 'Salario'),
                importJobId: null,
                date: dateAtMonthOffset(0, 26),
                amount: 1200,
                description: 'Freelance projeto Orion',
                type: 'checking',
            },
            {
                accountId: requireId(accountMap, 'Nubank Investimento'),
                categoryId: requireId(categoryMap, 'Investimentos'),
                importJobId: null,
                date: dateAtMonthOffset(-1, 12),
                amount: -1000,
                description: 'Aplicacao RDB reserva',
                type: 'investment',
                isInvestment: true,
            },
            {
                accountId: requireId(accountMap, 'Nubank Investimento'),
                categoryId: requireId(categoryMap, 'Investimentos'),
                importJobId: null,
                date: dateAtMonthOffset(0, 12),
                amount: 250,
                description: 'Resgate RDB reserva',
                type: 'investment',
                isInvestment: true,
            },
        ];

        for (let installmentNumber = 1; installmentNumber <= 4; installmentNumber += 1) {
            seededTransactions.push({
                accountId: requireId(accountMap, 'Nubank Cartao de Credito'),
                categoryId: requireId(categoryMap, 'Eletronicos'),
                importJobId: requireId(jobsByFilename, 'nubank-credit-card-current.csv'),
                date: dateAtMonthOffset(installmentNumber - 4, 13),
                amount: -600,
                description: `Notebook gamer - parcela ${installmentNumber}/12`,
                type: 'credit_card',
                installmentGroupId: notebookInstallmentGroup.id,
                installmentNumber,
            });
        }

        for (let installmentNumber = 1; installmentNumber <= 6; installmentNumber += 1) {
            seededTransactions.push({
                accountId: requireId(accountMap, 'Nubank Conta Corrente'),
                categoryId: requireId(categoryMap, 'Educacao'),
                importJobId: null,
                date: dateAtMonthOffset(installmentNumber - 6, 9),
                amount: -200,
                description: `Curso de ingles - parcela ${installmentNumber}/6`,
                type: 'checking',
                installmentGroupId: englishCourseInstallmentGroup.id,
                installmentNumber,
            });
        }

        await db
            .insert(transactions)
            .values(
                seededTransactions.map((item) => ({
                    accountId: item.accountId,
                    categoryId: item.categoryId,
                    importJobId: item.importJobId,
                    date: item.date,
                    amount: item.amount,
                    description: item.description,
                    originalDescription: item.description,
                    type: item.type,
                    installmentGroupId: item.installmentGroupId ?? null,
                    installmentNumber: item.installmentNumber ?? null,
                    isInvestment: item.isInvestment ?? false,
                    isIgnored: item.description === ignoredDescription,
                    isRecurring: recurringDescriptions.has(item.description),
                }))
            )
            .run();

        await db
            .insert(ignoredDescriptions)
            .values([
                {
                    description: ignoredDescription,
                    createdAt: dateAtMonthOffset(0, 1),
                },
            ])
            .run();

        await db
            .insert(recurringTransactions)
            .values([
                buildRecurringSeed(
                    'Aluguel apartamento',
                    requireId(categoryMap, 'Aluguel'),
                    seededTransactions
                ),
                buildRecurringSeed('Academia fit', null, seededTransactions),
            ])
            .run();

        const [cdbInvestment, treasuryInvestment] = await db
            .insert(investments)
            .values([
                {
                    accountId: requireId(accountMap, 'Nubank Investimento'),
                    type: 'CDB',
                    name: 'Reserva de emergencia CDB',
                    currentValue: 3900,
                },
                {
                    accountId: requireId(accountMap, 'Nubank Investimento'),
                    type: 'Tesouro Selic',
                    name: 'Tesouro Selic 2029',
                    currentValue: 5400,
                },
            ])
            .returning();

        await db
            .insert(investmentMovements)
            .values([
                {
                    investmentId: cdbInvestment.id,
                    type: 'deposit',
                    date: dateAtMonthOffset(-3, 7),
                    amount: 3000,
                    description: 'Aporte inicial',
                },
                {
                    investmentId: cdbInvestment.id,
                    type: 'deposit',
                    date: dateAtMonthOffset(-1, 7),
                    amount: 1000,
                    description: 'Aporte mensal',
                },
                {
                    investmentId: cdbInvestment.id,
                    type: 'withdrawal',
                    date: dateAtMonthOffset(0, 7),
                    amount: 500,
                    description: 'Resgate parcial',
                },
                {
                    investmentId: treasuryInvestment.id,
                    type: 'deposit',
                    date: dateAtMonthOffset(-4, 14),
                    amount: 5000,
                    description: 'Compra inicial',
                },
            ])
            .run();

        console.log('Seed completed successfully.');
        console.log(
            `Accounts: ${insertedAccounts.length}, Categories: ${insertedCategories.length}, Import jobs: ${insertedJobs.length}`
        );
        console.log(
            `Transactions: ${seededTransactions.length}, Installments groups: 2, Investments: 2`
        );
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();
