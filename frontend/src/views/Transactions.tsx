import React from 'react';
import { SegmentedControl } from '../components/SegmentedControl';
import { TransactionStats } from '../components/TransactionStats';
import { MonthlyTimeline } from '../components/MonthlyTimeline';
import type { DisplayTransaction } from '../components/MonthSection';
import { formatDate } from '../utils/date';
import { api } from '../lib/api';
import type { Transaction, Category } from '../lib/api';

type FilterType = 'all' | 'income' | 'expenses';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'income', label: 'Receitas' },
    { value: 'expenses', label: 'Despesas' }
];

export const Transactions: React.FC = () => {
    const [transactions, setTransactions] = React.useState<DisplayTransaction[]>([]);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [filter, setFilter] = React.useState<FilterType>('all');

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
                rawDate: t.date,
                description: t.description,
                category: t.categoryName || 'Sem Categoria',
                categoryId: t.categoryId,
                amount: t.amount
            }));

            setTransactions(formatted);
            setCategories(catData);
        } catch (err) {
            console.error(err);
            setError('Falha ao carregar transações');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, []);

    const filteredTransactions = React.useMemo(() => {
        switch (filter) {
            case 'income':
                return transactions.filter(t => t.amount > 0);
            case 'expenses':
                return transactions.filter(t => t.amount < 0);
            default:
                return transactions;
        }
    }, [transactions, filter]);

    const handleUpdateCategory = async (transactionId: number, categoryId: number | null) => {
        try {
            await api.updateTransaction(transactionId, { categoryId });
            await loadData();
        } catch (err) {
            console.error(err);
            alert('Falha ao atualizar categoria');
        }
    };

    const handleBulkUpdateCategory = async (description: string, categoryId: number | null) => {
        try {
            await api.bulkUpdateCategory(description, categoryId);
            await loadData();
        } catch (err) {
            console.error(err);
            alert('Falha ao atualizar categorias em lote');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando transações...</div>;
    if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;

    return (
        <div>
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Transações</h2>
                    <p className="text-slate-500 mt-1">Visualize e gerencie suas transações financeiras</p>
                </div>
                <SegmentedControl
                    options={FILTER_OPTIONS}
                    value={filter}
                    onChange={setFilter}
                />
            </div>

            <TransactionStats transactions={transactions} />

            <MonthlyTimeline
                transactions={filteredTransactions}
                categories={categories}
                onUpdateCategory={handleUpdateCategory}
                onBulkUpdateCategory={handleBulkUpdateCategory}
            />
        </div>
    );
};
