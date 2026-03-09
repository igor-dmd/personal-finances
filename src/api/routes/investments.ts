import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { parseIdParam } from '../../shared/http/params';
import { InvestmentsRepository } from '../../modules/investments/data/investments-repository';
import { CreateInvestmentWithAccountService } from '../../modules/investments/application/create-investment-with-account-service';

const investmentsRoute = new Hono();
const investmentsRepository = new InvestmentsRepository();
const createInvestmentWithAccountService = new CreateInvestmentWithAccountService();

const investmentTypes = z.enum([
    'RDB',
    'CDB',
    'LCI',
    'LCA',
    'Tesouro Direto',
    'Tesouro Selic',
    'Tesouro IPCA+',
    'Tesouro Prefixado',
    'Outros',
]);

export const INVESTMENT_TYPES = [
    'RDB',
    'CDB',
    'LCI',
    'LCA',
    'Tesouro Direto',
    'Tesouro Selic',
    'Tesouro IPCA+',
    'Tesouro Prefixado',
    'Outros',
] as const;

const createInvestmentSchema = z.object({
    institutionId: z.string().min(1, 'Instituição é obrigatória'),
    type: investmentTypes,
    name: z.string().min(1, 'Nome é obrigatório'),
    currentValue: z.number().min(0).optional().default(0),
});

const updateInvestmentSchema = z.object({
    name: z.string().min(1).optional(),
    type: investmentTypes.optional(),
    currentValue: z.number().min(0).optional(),
});

const createMovementSchema = z.object({
    type: z.enum(['deposit', 'withdrawal']),
    date: z.coerce.date(),
    amount: z.number().positive('Valor deve ser positivo'),
    description: z.string().optional(),
});

const updateMovementSchema = z.object({
    type: z.enum(['deposit', 'withdrawal']).optional(),
    date: z.coerce.date().optional(),
    amount: z.number().positive().optional(),
    description: z.string().nullable().optional(),
});

investmentsRoute.get('/types', (c) => {
    return c.json(INVESTMENT_TYPES);
});

investmentsRoute.get('/', async (c) => {
    try {
        const data = await investmentsRepository.list();
        return c.json(data);
    } catch (error: any) {
        console.error('[API] Error fetching investments:', error);
        return c.json({ error: error.message }, 500);
    }
});

investmentsRoute.get('/:id', async (c) => {
    try {
        const id = parseIdParam(c);
        if (id === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        const investment = await investmentsRepository.getById(id);
        if (!investment) {
            return c.json({ error: 'Investimento não encontrado' }, 404);
        }

        return c.json(investment);
    } catch (error: any) {
        console.error('[API] Error fetching investment:', error);
        return c.json({ error: error.message }, 500);
    }
});

investmentsRoute.post('/', zValidator('json', createInvestmentSchema), async (c) => {
    try {
        const data = c.req.valid('json');

        const investment = await createInvestmentWithAccountService.execute(data);

        return c.json({
            success: true,
            investment,
        });
    } catch (error: any) {
        console.error('[API] Error creating investment:', error);
        if (error.message === 'Instituição não encontrada' || error.message.includes('Tipo de conta')) {
            return c.json({ error: error.message }, 400);
        }
        return c.json({ error: error.message }, 500);
    }
});

investmentsRoute.patch('/:id', zValidator('json', updateInvestmentSchema), async (c) => {
    try {
        const id = parseIdParam(c);
        if (id === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        const body = c.req.valid('json');
        await investmentsRepository.update(id, body);

        return c.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating investment:', error);
        return c.json({ error: error.message }, 500);
    }
});

investmentsRoute.delete('/:id', async (c) => {
    try {
        const id = parseIdParam(c);
        if (id === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        await investmentsRepository.delete(id);

        return c.json({
            success: true,
            message: 'Investimento excluído com sucesso',
        });
    } catch (error: any) {
        console.error('[API] Error deleting investment:', error);
        return c.json({ error: error.message }, 500);
    }
});

investmentsRoute.post('/:id/movements', zValidator('json', createMovementSchema), async (c) => {
    try {
        const investmentId = parseIdParam(c);
        if (investmentId === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        const investment = await investmentsRepository.getById(investmentId);
        if (!investment) {
            return c.json({ error: 'Investimento não encontrado' }, 404);
        }

        const data = c.req.valid('json');

        const movement = await investmentsRepository.createMovement({
            investmentId,
            type: data.type,
            date: data.date,
            amount: data.amount,
            description: data.description,
        });

        return c.json({
            success: true,
            movement,
        });
    } catch (error: any) {
        console.error('[API] Error creating movement:', error);
        return c.json({ error: error.message }, 500);
    }
});

investmentsRoute.patch('/:id/movements/:movementId', zValidator('json', updateMovementSchema), async (c) => {
    try {
        const investmentId = parseIdParam(c);
        const movementId = parseIdParam(c, 'movementId');

        if (investmentId === null || movementId === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        const body = c.req.valid('json');
        await investmentsRepository.updateMovement(movementId, body);

        return c.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating movement:', error);
        return c.json({ error: error.message }, 500);
    }
});

investmentsRoute.delete('/:id/movements/:movementId', async (c) => {
    try {
        const investmentId = parseIdParam(c);
        const movementId = parseIdParam(c, 'movementId');

        if (investmentId === null || movementId === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        await investmentsRepository.deleteMovement(movementId);

        return c.json({
            success: true,
            message: 'Movimentação excluída com sucesso',
        });
    } catch (error: any) {
        console.error('[API] Error deleting movement:', error);
        return c.json({ error: error.message }, 500);
    }
});

export default investmentsRoute;
