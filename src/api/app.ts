import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import transactions from './routes/transactions';
import importJobs from './routes/import-jobs';
import categories from './routes/categories';
import installments from './routes/installments';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.text('Personal Finances API is running!'));

app.route('/transactions', transactions);
app.route('/import-jobs', importJobs);
app.route('/categories', categories);
app.route('/installments', installments);

export default app;
