import React from 'react';
import { TransactionTable } from '../components/TransactionTable';

export const Transactions: React.FC = () => {
    const [transactions, setTransactions] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const loadTransactions = async () => {
            try {
                const response = await fetch('http://localhost:3000/transactions');
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();

                // Map API data to component expectations
                const formatted = data.map((t: any) => ({
                    id: t.id,
                    date: new Date(t.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
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
