import React from 'react';
import { TransactionTable, type DisplayTransaction } from '../components/TransactionTable';
import { formatDate } from '../utils/date';
import { api } from '../lib/api';
import type { Transaction } from '../lib/api';

export const Transactions: React.FC = () => {
    const [transactions, setTransactions] = React.useState<DisplayTransaction[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const loadTransactions = async () => {
            try {
                const data = await api.getTransactions();

                // Map API data to component expectations
                const formatted = data.map((t: Transaction) => ({
                    id: t.id,
                    date: formatDate(t.date),
                    description: t.description,
                    category: t.categoryName || 'Uncategorized',
                    amount: t.amount
                }));

                setTransactions(formatted);
            } catch (err) {
                console.error(err);
                setError('Failed to load transactions');
            } finally {
                setLoading(false);
            }
        };

        loadTransactions();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading transactions...</div>;
    if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;

    return (
        <div>
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Transactions</h2>
                    <p className="text-slate-500 mt-1">View and manage your financial transactions</p>
                </div>
            </div>

            <TransactionTable transactions={transactions} />
        </div>
    );
};
