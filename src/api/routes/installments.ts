import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { parseIdParam } from '../../shared/http/params';
import { InstallmentsRepository } from '../../modules/installments/data/installments-repository';
import { CreateInstallmentPlanService } from '../../modules/installments/application/create-installment-plan-service';

const installments = new Hono();
const installmentsRepository = new InstallmentsRepository();
const createInstallmentPlanService = new CreateInstallmentPlanService();

const createInstallmentSchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    totalInstallments: z.number().int().min(2, 'Mínimo de 2 parcelas').max(120, 'Máximo de 120 parcelas'),
    totalAmount: z.number().positive('Valor total deve ser positivo'),
    firstInstallmentDate: z.coerce.date(),
    institutionId: z.string().min(1, 'Instituição é obrigatória'),
    type: z.enum(['credit_card', 'checking'], {
        errorMap: () => ({ message: 'Tipo deve ser credit_card ou checking' }),
    }),
    categoryId: z.number().int().positive().nullable().optional(),
});

const updateInstallmentSchema = z.object({
    description: z.string().min(1).optional(),
    totalInstallments: z.number().int().min(2).max(120).optional(),
    totalAmount: z.number().positive().optional(),
});

installments.get('/', async (c) => {
    try {
        const groups = await installmentsRepository.listGroups();
        return c.json(groups);
    } catch (error: any) {
        console.error('[API] Error fetching installment groups:', error);
        return c.json({ error: error.message }, 500);
    }
});

installments.get('/:id', async (c) => {
    try {
        const id = parseIdParam(c);
        if (id === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        const group = await installmentsRepository.getGroup(id);
        if (!group) {
            return c.json({ error: 'Parcelamento não encontrado' }, 404);
        }

        const futureInstallments = await installmentsRepository.getFutureInstallments(id);

        return c.json({ ...group, futureInstallments });
    } catch (error: any) {
        console.error('[API] Error fetching installment group:', error);
        return c.json({ error: error.message }, 500);
    }
});

installments.post('/', zValidator('json', createInstallmentSchema), async (c) => {
    try {
        const data = c.req.valid('json');

        const result = await createInstallmentPlanService.execute(data);

        return c.json({
            success: true,
            groupId: result.groupId,
            created: result.created,
        });
    } catch (error: any) {
        console.error('[API] Error creating installment group:', error);
        if (error.message === 'Instituição não encontrada' || error.message.includes('Tipo de conta')) {
            return c.json({ error: error.message }, 400);
        }
        return c.json({ error: error.message }, 500);
    }
});

installments.patch('/:id', zValidator('json', updateInstallmentSchema), async (c) => {
    try {
        const id = parseIdParam(c);
        if (id === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        const body = c.req.valid('json');
        await installmentsRepository.updateGroup(id, body);

        return c.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating installment group:', error);
        return c.json({ error: error.message }, 500);
    }
});

installments.delete('/:id', async (c) => {
    try {
        const id = parseIdParam(c);
        if (id === null) {
            return c.json({ error: 'ID inválido' }, 400);
        }

        await installmentsRepository.deleteGroup(id);

        return c.json({
            success: true,
            message: 'Parcelamento excluído com sucesso',
        });
    } catch (error: any) {
        console.error('[API] Error deleting installment group:', error);
        return c.json({ error: error.message }, 500);
    }
});

export default installments;
