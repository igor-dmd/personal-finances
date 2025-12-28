import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import transactions from './routes/transactions';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.text('Personal Finances API is running!'));

app.route('/transactions', transactions);

export default app;
