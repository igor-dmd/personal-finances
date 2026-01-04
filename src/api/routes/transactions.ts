
import { Hono } from 'hono';
import { FinanceRepository } from '../../db/repository';
import { ExtractionProcessor } from '../../extraction/processor';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const transactions = new Hono();
const repo = new FinanceRepository();
const processor = new ExtractionProcessor();

// Schema for upload validation
const uploadSchema = z.object({
    type: z.string().min(1, 'Tipo é obrigatório'),
});

const updateTransactionSchema = z.object({
    categoryId: z.number().nullable().optional(),
    description: z.string().optional(),
    amount: z.number().optional(),
    date: z.coerce.date().optional(),
});

const bulkUpdateCategorySchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    categoryId: z.number().nullable(),
});

transactions.get('/parser-types', (c) => {
    return c.json(processor.getAvailableParsers());
});

transactions.get('/categories', async (c) => {
    try {
        const data = await repo.getCategories();
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

        const count = await repo.countTransactionsByDescription(description);
        return c.json({ count, description });
    } catch (error: any) {
        console.error('[API] Error counting transactions:', error);
        return c.json({ error: error.message }, 500);
    }
});

transactions.patch('/by-description', zValidator('json', bulkUpdateCategorySchema), async (c) => {
    try {
        const { description, categoryId } = c.req.valid('json');
        console.log(`[API] Bulk updating transactions with description "${description}" to category ${categoryId}`);

        const result = await repo.updateTransactionsByDescription(description, categoryId);

        return c.json({
            success: true,
            updatedCount: result.count,
            description,
            categoryId
        });
    } catch (error: any) {
        console.error('[API] Error bulk updating transactions:', error);
        return c.json({ error: error.message }, 500);
    }
});

transactions.patch('/:id', zValidator('json', updateTransactionSchema), async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        const body = c.req.valid('json');

        console.log(`[API] Updating transaction ${id}...`, body);
        await repo.updateTransaction(id, body);

        return c.json({ success: true });
    } catch (error: any) {
        console.error(`[API] Error updating transaction:`, error);
        return c.json({ error: error.message }, 500);
    }
});

transactions.get('/', async (c) => {
    try {
        console.log('[API] Fetching transactions...');
        const data = await repo.getTransactions();
        return c.json(data);
    } catch (error: any) {
        console.error('[API] Error fetching transactions:', error);
        return c.json({ error: error.message }, 500);
    }
});

transactions.post('/upload', zValidator('form', uploadSchema), async (c) => {
    try {
        console.log('[API] Processing upload request...');
        const body = await c.req.parseBody();
        const file = body['file'];

        if (!(file instanceof File)) {
            return c.json({ error: 'Arquivo não fornecido ou formato inválido' }, 400);
        }

        const { type } = c.req.valid('form') as z.infer<typeof uploadSchema>;
        console.log(`[API] File: ${file.name}, Type: ${type}`);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Process the file
        const drafts = await processor.processByType(file.name, buffer, type);
        console.log(`[API] Extracted ${drafts.length} transactions`);

        // Determine account based on parser type
        let accountName = 'Nubank Credit Card';
        let accountType = 'credit_card';

        if (type === 'nubank-checking-csv') {
            accountName = 'Nubank Checking Account';
            accountType = 'checking';
        }

        const account = await repo.getOrCreateAccount(accountName, accountType as any);
        const job = await repo.createImportJob(file.name, 'pending', type);

        await repo.saveTransactions(drafts, account.id, job.id);
        await repo.updateImportJobStatus(job.id, 'completed');

        console.log('[API] Upload completed successfully');
        return c.json({
            message: 'Arquivo processado com sucesso',
            count: drafts.length,
            jobId: job.id
        });

    } catch (error: any) {
        console.error('[API] Error processing upload:', error);
        return c.json({ error: error.message }, 500);
    }
});

export default transactions;
