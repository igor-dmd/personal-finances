import { Hono } from 'hono';
import { FinanceRepository } from '../../db/repository';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { readFileSync } from 'fs';
import { join } from 'path';

const installments = new Hono();
const repo = new FinanceRepository();

// Load institutions config
const institutionsConfigPath = join(process.cwd(), 'config', 'institutions.json');
const institutionsConfig = JSON.parse(readFileSync(institutionsConfigPath, 'utf-8'));

const createInstallmentSchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    totalInstallments: z.number().int().min(2, 'Mínimo de 2 parcelas').max(120, 'Máximo de 120 parcelas'),
    totalAmount: z.number().positive('Valor total deve ser positivo'),
    firstInstallmentDate: z.coerce.date(),
    institutionId: z.string().min(1, 'Instituição é obrigatória'),
    type: z.enum(['credit_card', 'checking'], {
        errorMap: () => ({ message: 'Tipo deve ser credit_card ou checking' })
    }),
    categoryId: z.number().int().positive().nullable().optional(),
});

const updateInstallmentSchema = z.object({
    description: z.string().min(1).optional(),
    totalInstallments: z.number().int().min(2).max(120).optional(),
    totalAmount: z.number().positive().optional(),
});

// GET /installments - List all installment groups with progress
installments.get('/', async (c) => {
    try {
        console.log('[API] Fetching installment groups...');
        const groups = await repo.getInstallmentGroups();
        return c.json(groups);
    } catch (error: any) {
        console.error('[API] Error fetching installment groups:', error);
        return c.json({ error: error.message }, 500);
    }
});

// GET /installments/:id - Get single installment group with details and future projections
installments.get('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        if (isNaN(id)) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        console.log(`[API] Fetching installment group ${id}...`);
        const group = await repo.getInstallmentGroup(id);

        if (!group) {
            return c.json({ error: 'Parcelamento não encontrado' }, 404);
        }

        const futureInstallments = await repo.getFutureInstallments(id);

        return c.json({ ...group, futureInstallments });
    } catch (error: any) {
        console.error(`[API] Error fetching installment group:`, error);
        return c.json({ error: error.message }, 500);
    }
});

// POST /installments - Create installment group with all transactions
installments.post('/', zValidator('json', createInstallmentSchema), async (c) => {
    try {
        const data = c.req.valid('json');
        console.log('[API] Creating installment group...', data);

        // Find institution in config
        const institution = institutionsConfig.institutions.find((i: any) => i.id === data.institutionId);
        if (!institution) {
            return c.json({ error: 'Instituição não encontrada' }, 400);
        }

        // Create account name from institution name + type label
        const typeLabel = institutionsConfig.accountTypeLabels[data.type];
        const accountName = `${institution.name} ${typeLabel}`;

        // Find or create account
        const account = await repo.getOrCreateAccount(accountName, data.type);

        // Create installment group
        const groupId = await repo.createInstallmentGroup(
            data.description,
            data.totalInstallments,
            data.totalAmount
        );

        // Create individual transactions for all installments
        const installmentAmount = data.totalAmount / data.totalInstallments;

        for (let i = 1; i <= data.totalInstallments; i++) {
            const installmentDate = new Date(data.firstInstallmentDate);
            installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

            await repo.createTransaction({
                accountId: account.id,
                categoryId: data.categoryId || null,
                date: installmentDate,
                amount: -installmentAmount, // Negative for expenses
                description: `${data.description} - Parcela ${i}/${data.totalInstallments}`,
                type: data.type,
            });

            // Update the created transaction with installment info
            const allTransactions = await repo.getTransactions();
            const lastTransaction = allTransactions[allTransactions.length - 1];

            if (lastTransaction) {
                await repo.updateTransaction(lastTransaction.id, {
                    installmentGroupId: groupId,
                    installmentNumber: i,
                });
            }
        }

        console.log(`[API] Created installment group ${groupId} with ${data.totalInstallments} transactions`);
        return c.json({
            success: true,
            groupId,
            created: data.totalInstallments,
        });
    } catch (error: any) {
        console.error('[API] Error creating installment group:', error);
        return c.json({ error: error.message }, 500);
    }
});

// PATCH /installments/:id - Update installment group metadata
installments.patch('/:id', zValidator('json', updateInstallmentSchema), async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        if (isNaN(id)) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        const body = c.req.valid('json');
        console.log(`[API] Updating installment group ${id}...`, body);

        await repo.updateInstallmentGroup(id, body);

        return c.json({ success: true });
    } catch (error: any) {
        console.error(`[API] Error updating installment group:`, error);
        return c.json({ error: error.message }, 500);
    }
});

// DELETE /installments/:id - Delete installment group (cascade deletes transactions)
installments.delete('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        if (isNaN(id)) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        console.log(`[API] Deleting installment group ${id}...`);
        await repo.deleteInstallmentGroup(id);

        return c.json({
            success: true,
            message: 'Parcelamento excluído com sucesso',
        });
    } catch (error: any) {
        console.error(`[API] Error deleting installment group:`, error);
        return c.json({ error: error.message }, 500);
    }
});

export default installments;
