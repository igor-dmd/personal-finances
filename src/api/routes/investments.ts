import { Hono } from 'hono';
import { FinanceRepository } from '../../db/repository';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { readFileSync } from 'fs';
import { join } from 'path';

const investmentsRoute = new Hono();
const repo = new FinanceRepository();

// Load institutions config
const institutionsConfigPath = join(process.cwd(), 'config', 'institutions.json');
const institutionsConfig = JSON.parse(readFileSync(institutionsConfigPath, 'utf-8'));

// Investment types enum
const investmentTypes = z.enum([
    'RDB', 'CDB', 'LCI', 'LCA',
    'Tesouro Direto', 'Tesouro Selic', 'Tesouro IPCA+', 'Tesouro Prefixado',
    'Outros'
]);

export const INVESTMENT_TYPES = [
    'RDB', 'CDB', 'LCI', 'LCA',
    'Tesouro Direto', 'Tesouro Selic', 'Tesouro IPCA+', 'Tesouro Prefixado',
    'Outros'
] as const;

// Validation schemas
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

// GET /investments/types - Get list of valid investment types
investmentsRoute.get('/types', (c) => {
    return c.json(INVESTMENT_TYPES);
});

// GET /investments - List all investments with summaries
investmentsRoute.get('/', async (c) => {
    try {
        console.log('[API] Fetching investments...');
        const data = await repo.getInvestments();
        return c.json(data);
    } catch (error: any) {
        console.error('[API] Error fetching investments:', error);
        return c.json({ error: error.message }, 500);
    }
});

// GET /investments/:id - Get single investment with movements
investmentsRoute.get('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        if (isNaN(id)) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        console.log(`[API] Fetching investment ${id}...`);
        const investment = await repo.getInvestment(id);

        if (!investment) {
            return c.json({ error: 'Investimento não encontrado' }, 404);
        }

        return c.json(investment);
    } catch (error: any) {
        console.error('[API] Error fetching investment:', error);
        return c.json({ error: error.message }, 500);
    }
});

// POST /investments - Create new investment
investmentsRoute.post('/', zValidator('json', createInvestmentSchema), async (c) => {
    try {
        const data = c.req.valid('json');
        console.log('[API] Creating investment...', data);

        // Find institution in config
        const institution = institutionsConfig.institutions.find((i: any) => i.id === data.institutionId);
        if (!institution) {
            return c.json({ error: 'Instituição não encontrada' }, 400);
        }

        // Create account name from institution name + investment label
        const typeLabel = institutionsConfig.accountTypeLabels['investment'];
        const accountName = `${institution.name} ${typeLabel}`;

        // Find or create account
        const account = await repo.getOrCreateAccount(accountName, 'investment');

        // Create investment
        const investment = await repo.createInvestment({
            accountId: account.id,
            type: data.type,
            name: data.name,
            currentValue: data.currentValue,
        });

        console.log(`[API] Created investment ${investment.id}`);
        return c.json({
            success: true,
            investment,
        });
    } catch (error: any) {
        console.error('[API] Error creating investment:', error);
        return c.json({ error: error.message }, 500);
    }
});

// PATCH /investments/:id - Update investment
investmentsRoute.patch('/:id', zValidator('json', updateInvestmentSchema), async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        if (isNaN(id)) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        const body = c.req.valid('json');
        console.log(`[API] Updating investment ${id}...`, body);

        await repo.updateInvestment(id, body);

        return c.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating investment:', error);
        return c.json({ error: error.message }, 500);
    }
});

// DELETE /investments/:id - Delete investment and all movements
investmentsRoute.delete('/:id', async (c) => {
    try {
        const id = parseInt(c.req.param('id'));
        if (isNaN(id)) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        console.log(`[API] Deleting investment ${id}...`);
        await repo.deleteInvestment(id);

        return c.json({
            success: true,
            message: 'Investimento excluído com sucesso',
        });
    } catch (error: any) {
        console.error('[API] Error deleting investment:', error);
        return c.json({ error: error.message }, 500);
    }
});

// ==================== Movement Endpoints ====================

// POST /investments/:id/movements - Add movement to investment
investmentsRoute.post('/:id/movements', zValidator('json', createMovementSchema), async (c) => {
    try {
        const investmentId = parseInt(c.req.param('id'));
        if (isNaN(investmentId)) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        // Check if investment exists
        const investment = await repo.getInvestment(investmentId);
        if (!investment) {
            return c.json({ error: 'Investimento não encontrado' }, 404);
        }

        const data = c.req.valid('json');
        console.log(`[API] Creating movement for investment ${investmentId}...`, data);

        const movement = await repo.createInvestmentMovement({
            investmentId,
            type: data.type,
            date: data.date,
            amount: data.amount,
            description: data.description,
        });

        console.log(`[API] Created movement ${movement.id}`);
        return c.json({
            success: true,
            movement,
        });
    } catch (error: any) {
        console.error('[API] Error creating movement:', error);
        return c.json({ error: error.message }, 500);
    }
});

// PATCH /investments/:id/movements/:movementId - Update movement
investmentsRoute.patch('/:id/movements/:movementId', zValidator('json', updateMovementSchema), async (c) => {
    try {
        const investmentId = parseInt(c.req.param('id'));
        const movementId = parseInt(c.req.param('movementId'));

        if (isNaN(investmentId) || isNaN(movementId)) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        const body = c.req.valid('json');
        console.log(`[API] Updating movement ${movementId}...`, body);

        await repo.updateInvestmentMovement(movementId, body);

        return c.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating movement:', error);
        return c.json({ error: error.message }, 500);
    }
});

// DELETE /investments/:id/movements/:movementId - Delete movement
investmentsRoute.delete('/:id/movements/:movementId', async (c) => {
    try {
        const investmentId = parseInt(c.req.param('id'));
        const movementId = parseInt(c.req.param('movementId'));

        if (isNaN(investmentId) || isNaN(movementId)) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        console.log(`[API] Deleting movement ${movementId}...`);
        await repo.deleteInvestmentMovement(movementId);

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
