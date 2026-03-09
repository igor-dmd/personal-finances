import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { RecurringTransactionsRepository } from '../../modules/recurring/data/recurring-transactions-repository';
import { parseIdParam } from '../../shared/http/params';

const recurringTransactions = new Hono();
const recurringRepository = new RecurringTransactionsRepository();

const addRecurringSchema = z.object({
    description: z.string().min(1, 'Descricao e obrigatoria'),
    categoryId: z.number().nullable().optional(),
});

const updateCategorySchema = z.object({
    categoryId: z.number().nullable(),
});

recurringTransactions.get('/', async (c) => {
    const data = await recurringRepository.list();
    return c.json(data);
});

recurringTransactions.get('/preview', async (c) => {
    const description = c.req.query('description');
    if (!description) {
        return c.json({ error: 'Parametro description e obrigatorio' }, 400);
    }

    const result = await recurringRepository.preview(description);
    return c.json({ description, ...result });
});

recurringTransactions.post('/', zValidator('json', addRecurringSchema), async (c) => {
    const { description, categoryId } = c.req.valid('json');
    const result = await recurringRepository.add(description, categoryId);
    return c.json({ success: true, ...result, description });
});

recurringTransactions.patch('/:id', zValidator('json', updateCategorySchema), async (c) => {
    const id = parseIdParam(c);
    if (id === null) {
        return c.json({ error: 'ID invalido' }, 400);
    }

    const { categoryId } = c.req.valid('json');
    await recurringRepository.updateCategory(id, categoryId);
    return c.json({ success: true });
});

recurringTransactions.delete('/:id', async (c) => {
    const id = parseIdParam(c);
    if (id === null) {
        return c.json({ error: 'ID invalido' }, 400);
    }

    try {
        const result = await recurringRepository.remove(id);
        return c.json({ success: true, ...result });
    } catch {
        return c.json({ error: 'Recurring transaction not found' }, 404);
    }
});

export default recurringTransactions;
