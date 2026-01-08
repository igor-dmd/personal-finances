import React from 'react';
import { SegmentedControl } from '../components/SegmentedControl';
import { FilterDropdown } from '../components/FilterDropdown';
import { TransactionStats } from '../components/TransactionStats';
import { MonthlyTimeline } from '../components/MonthlyTimeline';
import { TransactionFormModal } from '../components/TransactionFormModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import type { DisplayTransaction } from '../components/MonthSection';
import { formatDate } from '../utils/date';
import { api } from '../lib/api';
import type { Transaction, Category, Account } from '../lib/api';

type FilterType = 'all' | 'income' | 'expenses';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'income', label: 'Receitas' },
    { value: 'expenses', label: 'Despesas' }
];

interface Filters {
    direction: FilterType;
    accountType: 'all' | 'credit_card' | 'checking';
    categoryId: number | null;
}

export const Transactions: React.FC = () => {
    const [transactions, setTransactions] = React.useState<DisplayTransaction[]>([]);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [accounts, setAccounts] = React.useState<Account[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [filters, setFilters] = React.useState<Filters>({
        direction: 'all',
        accountType: 'all',
        categoryId: null
    });
    const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [selectedTransaction, setSelectedTransaction] = React.useState<DisplayTransaction | null>(null);
    const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');

    const loadData = async () => {
        try {
            const [txData, catData, accData] = await Promise.all([
                api.getTransactions(),
                api.getCategories(),
                api.getAccounts()
            ]);

            // Map API data to component expectations
            const formatted = txData.map((t: Transaction) => ({
                id: t.id,
                date: formatDate(t.date),
                rawDate: t.date,
                description: t.description,
                category: t.categoryName || 'Sem Categoria',
                categoryId: t.categoryId,
                amount: t.amount,
                type: t.type
            }));

            setTransactions(formatted);
            setCategories(catData);
            setAccounts(accData);
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
        return transactions.filter(t => {
            // Direction filter (income/expenses)
            if (filters.direction === 'income' && t.amount <= 0) return false;
            if (filters.direction === 'expenses' && t.amount >= 0) return false;

            // Account type filter
            if (filters.accountType !== 'all' && t.type !== filters.accountType) return false;

            // Category filter
            if (filters.categoryId !== null && t.categoryId !== filters.categoryId) return false;

            return true;
        });
    }, [transactions, filters]);

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

    const handleAddTransaction = () => {
        setFormMode('create');
        setSelectedTransaction(null);
        setIsFormModalOpen(true);
    };

    const handleEditTransaction = (transaction: DisplayTransaction) => {
        setFormMode('edit');
        setSelectedTransaction(transaction);
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (transaction: DisplayTransaction) => {
        setSelectedTransaction(transaction);
        setIsDeleteModalOpen(true);
    };

    const handleSaveTransaction = async () => {
        setIsFormModalOpen(false);
        await loadData();
    };

    const handleConfirmDelete = async () => {
        if (!selectedTransaction) return;
        try {
            await api.deleteTransaction(selectedTransaction.id);
            setIsDeleteModalOpen(false);
            await loadData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando transações...</div>;
    if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;

    const accountTypeOptions = [
        { value: 'all', label: 'Todos' },
        { value: 'credit_card', label: 'Cartão de Crédito' },
        { value: 'checking', label: 'Conta Corrente' }
    ];

    const categoryOptions = [
        { value: null, label: 'Todas' },
        ...categories.map(cat => ({ value: cat.id, label: cat.name }))
    ];

    return (
        <div>
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Transações</h2>
                        <p className="text-slate-500 mt-1">Visualize e gerencie suas transações financeiras</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={handleAddTransaction}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Adicionar Transação
                        </button>
                        <SegmentedControl
                            options={FILTER_OPTIONS}
                            value={filters.direction}
                            onChange={(value) => setFilters({ ...filters, direction: value })}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <FilterDropdown
                        label="Tipo de Conta"
                        options={accountTypeOptions}
                        value={filters.accountType}
                        onChange={(value) => setFilters({ ...filters, accountType: value as 'all' | 'credit_card' | 'checking' })}
                    />
                    <FilterDropdown
                        label="Categoria"
                        options={categoryOptions}
                        value={filters.categoryId}
                        onChange={(value) => setFilters({ ...filters, categoryId: value as number | null })}
                    />
                </div>
            </div>

            <TransactionStats transactions={transactions} />

            <MonthlyTimeline
                transactions={filteredTransactions}
                categories={categories}
                onUpdateCategory={handleUpdateCategory}
                onBulkUpdateCategory={handleBulkUpdateCategory}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteClick}
            />

            <TransactionFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSaveTransaction}
                accounts={accounts}
                categories={categories}
                initialData={selectedTransaction}
                mode={formMode}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                transactionDescription={selectedTransaction?.description || ''}
                transactionAmount={selectedTransaction?.amount || 0}
            />
        </div>
    );
};
