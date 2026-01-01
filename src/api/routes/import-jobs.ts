import { Hono } from 'hono';
import { FinanceRepository } from '../../db/repository';

const importJobs = new Hono();
const repo = new FinanceRepository();

importJobs.get('/', async (c) => {
    try {
        console.log('[API] Fetching import jobs...');
        const data = await repo.getImportJobs();
        return c.json(data);
    } catch (error: any) {
        console.error('[API] Error fetching import jobs:', error);
        return c.json({ error: error.message }, 500);
    }
});

importJobs.delete('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        if (isNaN(id)) {
            return c.json({ error: 'Invalid ID' }, 400);
        }

        console.log(`[API] Deleting import job ${id}...`);
        await repo.deleteImportJob(id);

        return c.json({ message: 'Import job and associated transactions deleted successfully' });
    } catch (error: any) {
        console.error(`[API] Error deleting import job ${c.req.param('id')}:`, error);
        return c.json({ error: error.message }, 500);
    }
});

export default importJobs;
