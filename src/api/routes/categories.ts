import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { CategoriesRepository } from '../../modules/transactions/data/categories-repository';
import { parseIdParam } from '../../shared/http/params';

const categories = new Hono();
const categoriesRepository = new CategoriesRepository();

const createCategorySchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
});

const updateCategorySchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
});

categories.get('/', async (c) => {
    try {
        const data = await categoriesRepository.list();
        return c.json(data);
    } catch (error: any) {
        console.error('[API] Error fetching categories:', error);
        return c.json({ error: error.message }, 500);
    }
});

categories.post('/', zValidator('json', createCategorySchema), async (c) => {
    try {
        const { name } = c.req.valid('json');
        const result = await categoriesRepository.create(name);
        return c.json(result);
    } catch (error: any) {
        console.error('[API] Error creating category:', error);
        return c.json({ error: error.message }, 500);
    }
});

categories.patch('/:id', zValidator('json', updateCategorySchema), async (c) => {
    try {
        const id = parseIdParam(c);
        if (id === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        const { name } = c.req.valid('json');
        await categoriesRepository.update(id, name);
        return c.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating category:', error);
        return c.json({ error: error.message }, 500);
    }
});

categories.delete('/:id', async (c) => {
    try {
        const id = parseIdParam(c);
        if (id === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        await categoriesRepository.delete(id);
        return c.json({ message: 'Categoria excluída com sucesso' });
    } catch (error: any) {
        console.error('[API] Error deleting category:', error);
        return c.json({ error: error.message }, 500);
    }
});

export default categories;
