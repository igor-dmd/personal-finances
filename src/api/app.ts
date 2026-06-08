import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import { existsSync } from 'node:fs';
import transactions from './routes/transactions';
import importJobs from './routes/import-jobs';
import categories from './routes/categories';
import installments from './routes/installments';
import investmentsRoute from './routes/investments';
import ignoredTransactions from './routes/ignored-transactions';
import recurringTransactions from './routes/recurring-transactions';
import futurePlanning from './routes/future-planning';

const app = new Hono();
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean);
const frontendDistPath = './frontend/dist';

app.use('*', logger());
app.use('*', cors({
    origin: allowedOrigins?.length
        ? (origin) => allowedOrigins.includes(origin) ? origin : null
        : '*',
}));

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/transactions', transactions);
app.route('/import-jobs', importJobs);
app.route('/categories', categories);
app.route('/installments', installments);
app.route('/investments', investmentsRoute);
app.route('/ignored-transactions', ignoredTransactions);
app.route('/recurring-transactions', recurringTransactions);
app.route('/future-planning', futurePlanning);

if (existsSync(frontendDistPath)) {
    app.use('/assets/*', serveStatic({
        root: frontendDistPath,
        onFound: (_path, c) => {
            c.header('Cache-Control', 'public, immutable, max-age=31536000');
        },
    }));
    app.use('/favicon.ico', serveStatic({ root: frontendDistPath }));
    app.use('/*', serveStatic({ root: frontendDistPath }));
    app.get('*', serveStatic({ path: `${frontendDistPath}/index.html` }));
}

export default app;
