import { Hono } from 'hono';
import { FinanceRepository } from '../../db/repository';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const recurringTransactions = new Hono();
const repo = new FinanceRepository();

const addRecurringSchema = z.object({
    description: z.string().min(1, 'Descricao e obrigatoria'),
    categoryId: z.number().nullable().optional(),
});

const updateCategorySchema = z.object({
    categoryId: z.number().nullable(),
});

// GET / - List all recurring transactions
recurringTransactions.get('/', async (c) => {
    const data = await repo.getRecurringTransactions();
    return c.json(data);
});

// GET /preview - Get preview of transactions that would be marked as recurring
recurringTransactions.get('/preview', async (c) => {
    const description = c.req.query('description');
    if (!description) {
        return c.json({ error: 'Parametro description e obrigatorio' }, 400);
    }
    const result = await repo.getRecurringPreview(description);
    return c.json({ description, ...result });
});

// POST / - Add description as recurring
recurringTransactions.post('/', zValidator('json', addRecurringSchema), async (c) => {
    const { description, categoryId } = c.req.valid('json');
    const result = await repo.addRecurringTransaction(description, categoryId);
    return c.json({ success: true, ...result, description });
});

// PATCH /:id - Update category of recurring transaction
recurringTransactions.patch('/:id', zValidator('json', updateCategorySchema), async (c) => {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) return c.json({ error: 'ID invalido' }, 400);

    const { categoryId } = c.req.valid('json');
    await repo.updateRecurringTransactionCategory(id, categoryId);
    return c.json({ success: true });
});

// DELETE /:id - Remove from recurring list
recurringTransactions.delete('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) return c.json({ error: 'ID invalido' }, 400);

    try {
        const result = await repo.removeRecurringTransaction(id);
        return c.json({ success: true, ...result });
    } catch (error) {
        return c.json({ error: 'Recurring transaction not found' }, 404);
    }
});

export default recurringTransactions;
