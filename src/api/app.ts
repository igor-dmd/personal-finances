import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import transactions from './routes/transactions';
import importJobs from './routes/import-jobs';
import categories from './routes/categories';
import installments from './routes/installments';
import investmentsRoute from './routes/investments';
import ignoredTransactions from './routes/ignored-transactions';
import recurringTransactions from './routes/recurring-transactions';
import futurePlanning from './routes/future-planning';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.text('Personal Finances API is running!'));

app.route('/transactions', transactions);
app.route('/import-jobs', importJobs);
app.route('/categories', categories);
app.route('/installments', installments);
app.route('/investments', investmentsRoute);
app.route('/ignored-transactions', ignoredTransactions);
app.route('/recurring-transactions', recurringTransactions);
app.route('/future-planning', futurePlanning);

export default app;
