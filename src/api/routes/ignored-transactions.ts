import { Hono } from 'hono';
import { FinanceRepository } from '../../db/repository';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const ignoredTransactions = new Hono();
const repo = new FinanceRepository();

const addIgnoredSchema = z.object({
    description: z.string().min(1, 'Descricao e obrigatoria'),
});

// GET / - List all ignored descriptions
ignoredTransactions.get('/', async (c) => {
    const data = await repo.getIgnoredDescriptions();
    return c.json(data);
});

// GET /preview - Get count of transactions that would be ignored
ignoredTransactions.get('/preview', async (c) => {
    const description = c.req.query('description');
    if (!description) {
        return c.json({ error: 'Parametro description e obrigatorio' }, 400);
    }
    const result = await repo.getIgnorePreview(description);
    return c.json({ description, ...result });
});

// POST / - Add description to ignore list
ignoredTransactions.post('/', zValidator('json', addIgnoredSchema), async (c) => {
    const { description } = c.req.valid('json');
    const result = await repo.addIgnoredDescription(description);
    return c.json({ success: true, ...result, description });
});

// DELETE /:id - Remove from ignore list
ignoredTransactions.delete('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) return c.json({ error: 'ID invalido' }, 400);

    try {
        const result = await repo.removeIgnoredDescription(id);
        return c.json({ success: true, ...result });
    } catch (error) {
        return c.json({ error: 'Ignored description not found' }, 404);
    }
});

export default ignoredTransactions;
