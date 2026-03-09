import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { IgnoredDescriptionsRepository } from '../../modules/transactions/data/ignored-descriptions-repository';
import { parseIdParam } from '../../shared/http/params';

const ignoredTransactions = new Hono();
const ignoredRepository = new IgnoredDescriptionsRepository();

const addIgnoredSchema = z.object({
    description: z.string().min(1, 'Descricao e obrigatoria'),
});

ignoredTransactions.get('/', async (c) => {
    const data = await ignoredRepository.list();
    return c.json(data);
});

ignoredTransactions.get('/preview', async (c) => {
    const description = c.req.query('description');
    if (!description) {
        return c.json({ error: 'Parametro description e obrigatorio' }, 400);
    }

    const result = await ignoredRepository.preview(description);
    return c.json({ description, ...result });
});

ignoredTransactions.post('/', zValidator('json', addIgnoredSchema), async (c) => {
    const { description } = c.req.valid('json');
    const result = await ignoredRepository.add(description);
    return c.json({ success: true, ...result, description });
});

ignoredTransactions.delete('/:id', async (c) => {
    const id = parseIdParam(c);
    if (id === null) {
        return c.json({ error: 'ID invalido' }, 400);
    }

    try {
        const result = await ignoredRepository.remove(id);
        return c.json({ success: true, ...result });
    } catch {
        return c.json({ error: 'Ignored description not found' }, 404);
    }
});

export default ignoredTransactions;
