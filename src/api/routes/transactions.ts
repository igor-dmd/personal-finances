import { Hono } from 'hono';
import { FinanceRepository } from '../../db/repository';
import { ExtractionProcessor } from '../../extraction/processor';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const transactions = new Hono();
const repo = new FinanceRepository();
const processor = new ExtractionProcessor();

// Schema for upload validation
const uploadSchema = z.object({
    type: z.string().min(1, 'Type is required'),
});

transactions.get('/', async (c) => {
    try {
        console.log('[API] Fetching transactions...');
        const data = await repo.getTransactions();
        return c.json(data);
    } catch (error: any) {
        console.error('[API] Error fetching transactions:', error);
        return c.json({ error: error.message }, 500);
    }
});

transactions.post('/upload', zValidator('form', uploadSchema as any), async (c) => {
    try {
        console.log('[API] Processing upload request...');
        const body = await c.req.parseBody();
        const file = body['file'];

        if (!(file instanceof File)) {
            return c.json({ error: 'No file provided or invalid file format' }, 400);
        }

        const { type } = c.req.valid('form') as z.infer<typeof uploadSchema>;
        console.log(`[API] File: ${file.name}, Type: ${type}`);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Check for duplicates
        // Check for duplicates
        // Removed referenceDate constraint


        // Process the file
        const drafts = await processor.processByType(file.name, buffer, type);
        console.log(`[API] Extracted ${drafts.length} transactions`);

        // Save to DB
        // TODO: Dynamically handle accounts. For now, default to Nubank.
        const accountName = 'Nubank Credit Card';
        const account = await repo.getOrCreateAccount(accountName, 'credit_card');
        const job = await repo.createImportJob(file.name, 'pending', type);

        await repo.saveTransactions(drafts, account.id, job.id);
        await repo.updateImportJobStatus(job.id, 'completed');

        console.log('[API] Upload completed successfully');
        return c.json({
            message: 'File processed successfully',
            count: drafts.length,
            jobId: job.id
        });

    } catch (error: any) {
        console.error('[API] Error processing upload:', error);
        return c.json({ error: error.message }, 500);
    }
});

export default transactions;
