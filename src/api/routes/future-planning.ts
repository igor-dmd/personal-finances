import { Hono } from 'hono';
import { FinanceRepository } from '../../db/repository';
import { z } from 'zod';

const futurePlanning = new Hono();
const repo = new FinanceRepository();

const monthsSchema = z.object({
    months: z.string().optional().transform((val) => val ? parseInt(val, 10) : 6),
});

// GET / - Get combined future planning data
futurePlanning.get('/', async (c) => {
    const { months } = monthsSchema.parse(c.req.query());
    const data = await repo.getFuturePlanningData(months);
    return c.json(data);
});

export default futurePlanning;
