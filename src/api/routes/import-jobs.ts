import { Hono } from 'hono';
import { ImportJobsRepository } from '../../modules/imports/data/import-jobs-repository';
import { parseIdParam } from '../../shared/http/params';

const importJobs = new Hono();
const importJobsRepository = new ImportJobsRepository();

importJobs.get('/', async (c) => {
    try {
        const data = await importJobsRepository.list();
        return c.json(data);
    } catch (error: any) {
        console.error('[API] Error fetching import jobs:', error);
        return c.json({ error: error.message }, 500);
    }
});

importJobs.delete('/:id', async (c) => {
    try {
        const id = parseIdParam(c);
        if (id === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        await importJobsRepository.deleteWithTransactions(id);
        return c.json({ message: 'Importação e transações excluídas com sucesso' });
    } catch (error: any) {
        console.error('[API] Error deleting import job:', error);
        return c.json({ error: error.message }, 500);
    }
});

export default importJobs;
