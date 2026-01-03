import { Hono } from 'hono';
import { FinanceRepository } from '../../db/repository';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const categories = new Hono();
const repo = new FinanceRepository();

// Schema for category validation
const createCategorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

const updateCategorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

categories.get('/', async (c) => {
    try {
        const data = await repo.getCategories();
        return c.json(data);
    } catch (error: any) {
        console.error('[API] Error fetching categories:', error);
        return c.json({ error: error.message }, 500);
    }
});

categories.post('/', zValidator('json', createCategorySchema), async (c) => {
    try {
        const { name } = c.req.valid('json');
        console.log(`[API] Creating category: ${name}`);
        const result = await repo.createCategory(name);
        return c.json(result);
    } catch (error: any) {
        console.error('[API] Error creating category:', error);
        return c.json({ error: error.message }, 500);
    }
});

categories.patch('/:id', zValidator('json', updateCategorySchema), async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        if (isNaN(id)) {
            return c.json({ error: 'Invalid ID' }, 400);
        }

        const { name } = c.req.valid('json');
        console.log(`[API] Updating category ${id}: ${name}`);
        await repo.updateCategory(id, name);
        return c.json({ success: true });
    } catch (error: any) {
        console.error(`[API] Error updating category:`, error);
        return c.json({ error: error.message }, 500);
    }
});

categories.delete('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        if (isNaN(id)) {
            return c.json({ error: 'Invalid ID' }, 400);
        }

        console.log(`[API] Deleting category ${id}...`);
        await repo.deleteCategory(id);
        return c.json({ message: 'Category deleted successfully' });
    } catch (error: any) {
        console.error(`[API] Error deleting category ${c.req.param('id')}:`, error);
        return c.json({ error: error.message }, 500);
    }
});

export default categories;
