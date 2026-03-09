import React from 'react';
import { Plus, EyeOff } from 'lucide-react';
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
    const [_accounts, setAccounts] = React.useState<Account[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [filters, setFilters] = React.useState<Filters>({
        direction: 'all',
        accountType: 'all',
        categoryId: null
    });
    const [showIgnored, setShowIgnored] = React.useState(false);
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
                type: t.type,
                installmentGroupId: t.installmentGroupId,
                installmentNumber: t.installmentNumber,
                isInvestment: t.isInvestment ?? false,
                isIgnored: t.isIgnored ?? false,
                isRecurring: t.isRecurring ?? false
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
            // Skip investment transactions (they're on the Investments page)
            if (t.isInvestment) return false;

            // Skip ignored transactions unless showIgnored is true
            if (t.isIgnored && !showIgnored) return false;

            // Direction filter (income/expenses)
            if (filters.direction === 'income' && t.amount <= 0) return false;
            if (filters.direction === 'expenses' && t.amount >= 0) return false;

            // Account type filter
            if (filters.accountType !== 'all' && t.type !== filters.accountType) return false;

            // Category filter
            if (filters.categoryId !== null && t.categoryId !== filters.categoryId) return false;

            return true;
        });
    }, [transactions, filters, showIgnored]);

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

    const handleIgnoreTransaction = async (description: string) => {
        try {
            const preview = await api.previewIgnoreDescription(description);
            if (preview.isIgnored) {
                alert('Esta descricao ja esta na lista de ignoradas');
                return;
            }
            if (confirm(`Ignorar ${preview.count} transacao(oes) com descricao "${description}"?`)) {
                await api.addIgnoredDescription(description);
                await loadData();
            }
        } catch (err: any) {
            console.error(err);
            alert('Falha ao ignorar transacao');
        }
    };

    const handleMarkAsRecurring = async (description: string) => {
        try {
            const preview = await api.previewRecurring(description);
            if (preview.isRecurring) {
                alert('Esta descricao ja esta na lista de recorrentes');
                return;
            }
            const message = `Marcar ${preview.count} transacao(oes) "${description}" como recorrente?\n\nValor medio: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preview.averageAmount)}`;
            if (confirm(message)) {
                await api.addRecurringTransaction(description);
                await loadData();
            }
        } catch (err: any) {
            console.error(err);
            alert('Falha ao marcar como recorrente');
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
        <div className="max-w-6xl mx-auto">
            <div className="mb-8 p-6 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">Transações</h2>
                    <p className="text-slate-500 mt-1.5 font-medium">Visualize e gerencie suas movimentações financeiras</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <button
                        onClick={handleAddTransaction}
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 transition-all duration-200 font-medium flex items-center gap-2"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Nova Transação
                    </button>
                    <button
                        onClick={() => setShowIgnored(!showIgnored)}
                        className={`px-4 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 flex items-center gap-2 ${
                            showIgnored
                                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                        }`}
                    >
                        <EyeOff size={16} />
                        {showIgnored ? 'Ocultar Ignoradas' : 'Ver Ignoradas'}
                    </button>
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex">
                        <SegmentedControl
                            options={FILTER_OPTIONS}
                            value={filters.direction}
                            onChange={(value) => setFilters({ ...filters, direction: value })}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 px-1">
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

            <TransactionStats transactions={transactions} />

            <MonthlyTimeline
                transactions={filteredTransactions}
                categories={categories}
                onUpdateCategory={handleUpdateCategory}
                onBulkUpdateCategory={handleBulkUpdateCategory}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteClick}
                onIgnoreTransaction={handleIgnoreTransaction}
                onRecurringTransaction={handleMarkAsRecurring}
            />

            <TransactionFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSaveTransaction}
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
