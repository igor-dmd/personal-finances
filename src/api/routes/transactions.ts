import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { ExtractionProcessor } from '../../extraction/processor';
import { getInstitutionsConfig } from '../../shared/config/institutions';
import { parseIdParam } from '../../shared/http/params';
import { AccountsRepository } from '../../modules/shared/data/accounts-repository';
import { CategoriesRepository } from '../../modules/transactions/data/categories-repository';
import { TransactionsRepository } from '../../modules/transactions/data/transactions-repository';
import { CreateManualTransactionService } from '../../modules/transactions/application/create-manual-transaction-service';
import { ProcessImportFileService } from '../../modules/transactions/application/process-import-file-service';

const transactions = new Hono();
const transactionsRepository = new TransactionsRepository();
const accountsRepository = new AccountsRepository();
const categoriesRepository = new CategoriesRepository();
const createManualTransactionService = new CreateManualTransactionService();
const processImportFileService = new ProcessImportFileService();
const processor = new ExtractionProcessor();
const institutionsConfig = getInstitutionsConfig();

const uploadSchema = z.object({
    type: z.string().min(1, 'Tipo é obrigatório'),
});

const updateTransactionSchema = z.object({
    categoryId: z.number().nullable().optional(),
    description: z.string().optional(),
    amount: z.number().optional(),
    date: z.coerce.date().optional(),
    isInvestment: z.boolean().optional(),
});

const bulkUpdateCategorySchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    categoryId: z.number().nullable(),
});

const createTransactionSchema = z.object({
    institutionId: z.string().min(1, 'Instituição é obrigatória'),
    categoryId: z.number().int().positive().nullable().optional(),
    date: z.coerce.date(),
    amount: z.number(),
    description: z.string().min(1, 'Descrição é obrigatória'),
    type: z.enum(['credit_card', 'checking', 'investment'], {
        errorMap: () => ({ message: 'Tipo deve ser credit_card, checking ou investment' }),
    }),
    isInvestment: z.boolean().optional().default(false),
});

transactions.get('/accounts', async (c) => {
    try {
        const data = await accountsRepository.list();
        return c.json(data);
    } catch (error: any) {
        console.error('[API] Error fetching accounts:', error);
        return c.json({ error: error.message }, 500);
    }
});

transactions.get('/institutions-config', (c) => {
    return c.json(institutionsConfig);
});

transactions.get('/parser-types', (c) => {
    return c.json(processor.getAvailableParsers());
});

transactions.get('/categories', async (c) => {
    try {
        const data = await categoriesRepository.list();
        return c.json(data);
    } catch (error: any) {
        console.error('[API] Error fetching categories:', error);
        return c.json({ error: error.message }, 500);
    }
});

transactions.get('/by-description/count', async (c) => {
    try {
        const description = c.req.query('description');
        if (!description) {
            return c.json({ error: 'Parâmetro query description é obrigatório' }, 400);
        }

        const count = await transactionsRepository.countByDescription(description);
        return c.json({ count, description });
    } catch (error: any) {
        console.error('[API] Error counting transactions:', error);
        return c.json({ error: error.message }, 500);
    }
});

transactions.patch('/by-description', zValidator('json', bulkUpdateCategorySchema), async (c) => {
    try {
        const { description, categoryId } = c.req.valid('json');
        const result = await transactionsRepository.bulkUpdateCategoryByDescription(description, categoryId);

        return c.json({
            success: true,
            updatedCount: result.count,
            description,
            categoryId,
        });
    } catch (error: any) {
        console.error('[API] Error bulk updating transactions:', error);
        return c.json({ error: error.message }, 500);
    }
});

transactions.patch('/:id', zValidator('json', updateTransactionSchema), async (c) => {
    try {
        const id = parseIdParam(c);
        if (id === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        const body = c.req.valid('json');
        await transactionsRepository.updateTransaction(id, body);

        return c.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating transaction:', error);
        return c.json({ error: error.message }, 500);
    }
});

transactions.delete('/:id', async (c) => {
    try {
        const id = parseIdParam(c);
        if (id === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        await transactionsRepository.deleteManualTransaction(id);

        return c.json({
            success: true,
            message: 'Transação excluída com sucesso',
        });
    } catch (error: any) {
        console.error('[API] Error deleting transaction:', error);
        const status = error.message.includes('not found')
            ? 404
            : error.message.includes('Cannot delete')
              ? 403
              : 500;

        return c.json({ error: error.message }, status);
    }
});

transactions.get('/', async (c) => {
    try {
        const data = await transactionsRepository.listTransactions();
        return c.json(data);
    } catch (error: any) {
        console.error('[API] Error fetching transactions:', error);
        return c.json({ error: error.message }, 500);
    }
});

transactions.post('/', zValidator('json', createTransactionSchema), async (c) => {
    try {
        const data = c.req.valid('json');
        const transaction = await createManualTransactionService.execute(data);

        return c.json({
            success: true,
            transaction,
        });
    } catch (error: any) {
        console.error('[API] Error creating transaction:', error);
        if (error.message === 'Instituição não encontrada' || error.message.includes('Tipo de conta')) {
            return c.json({ error: error.message }, 400);
        }
        return c.json({ error: error.message }, 500);
    }
});

transactions.post('/upload', zValidator('form', uploadSchema), async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body.file;

        if (!(file instanceof File)) {
            return c.json({ error: 'Arquivo não fornecido ou formato inválido' }, 400);
        }

        const { type } = c.req.valid('form') as z.infer<typeof uploadSchema>;
        const arrayBuffer = await file.arrayBuffer();

        const result = await processImportFileService.execute({
            fileName: file.name,
            content: Buffer.from(arrayBuffer),
            parserType: type,
        });

        return c.json({
            message: 'Arquivo processado com sucesso',
            count: result.count,
            jobId: result.jobId,
        });
    } catch (error: any) {
        console.error('[API] Error processing upload:', error);
        return c.json({ error: error.message }, 500);
    }
});

export default transactions;
