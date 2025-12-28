import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import transactions from './routes/transactions';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.text('Personal Finances API is running!'));

app.route('/transactions', transactions);

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port
});
