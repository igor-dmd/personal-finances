import { Hono } from 'hono';
import { z } from 'zod';
import { FuturePlanningRepository } from '../../modules/planning/data/future-planning-repository';

const futurePlanning = new Hono();
const futurePlanningRepository = new FuturePlanningRepository();

const monthsSchema = z.object({
    months: z.string().optional().transform((value) => (value ? Number.parseInt(value, 10) : 6)),
});

futurePlanning.get('/', async (c) => {
    const { months } = monthsSchema.parse(c.req.query());
    const data = await futurePlanningRepository.getData(months);
    return c.json(data);
});

export default futurePlanning;
