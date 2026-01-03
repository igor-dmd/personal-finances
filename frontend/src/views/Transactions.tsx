import React from 'react';
import { TransactionTable, type DisplayTransaction } from '../components/TransactionTable';
import { formatDate } from '../utils/date';
import { api } from '../lib/api';
import type { Transaction, Category } from '../lib/api';

export const Transactions: React.FC = () => {
    const [transactions, setTransactions] = React.useState<DisplayTransaction[]>([]);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const loadData = async () => {
        try {
            const [txData, catData] = await Promise.all([
                api.getTransactions(),
                api.getCategories()
            ]);

            // Map API data to component expectations
            const formatted = txData.map((t: Transaction) => ({
                id: t.id,
                date: formatDate(t.date),
                description: t.description,
                category: t.categoryName || 'Uncategorized',
                categoryId: t.categoryId,
                amount: t.amount
            }));

            setTransactions(formatted);
            setCategories(catData);
        } catch (err) {
            console.error(err);
            setError('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, []);

    const handleUpdateCategory = async (transactionId: number, categoryId: number | null) => {
        try {
            await api.updateTransaction(transactionId, { categoryId });
            // Refresh data to show updated category names
            await loadData();
        } catch (err) {
            console.error(err);
            alert('Failed to update category');
        }
    };

    const handleBulkUpdateCategory = async (description: string, categoryId: number | null) => {
        try {
            await api.bulkUpdateCategory(description, categoryId);
            // Refresh data to show updated category names
            await loadData();
        } catch (err) {
            console.error(err);
            alert('Failed to bulk update categories');
        }
    };

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

            <TransactionTable
                transactions={transactions}
                categories={categories}
                onUpdateCategory={handleUpdateCategory}
                onBulkUpdateCategory={handleBulkUpdateCategory}
            />
        </div>
    );
};
