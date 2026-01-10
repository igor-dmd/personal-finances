import React from 'react';
import { api } from '../lib/api';
import type { Transaction, Category } from '../lib/api';
import { MonthlyTimeline } from '../components/MonthlyTimeline';
import type { DisplayTransaction } from '../components/MonthSection';
import { TransactionFormModal } from '../components/TransactionFormModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { formatDate } from '../utils/date';

export const Investments: React.FC = () => {
    const [transactions, setTransactions] = React.useState<DisplayTransaction[]>([]);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [selectedTransaction, setSelectedTransaction] = React.useState<DisplayTransaction | null>(null);
    const [formMode, setFormMode] = React.useState<'create' | 'edit'>('edit');

    const loadData = async () => {
        try {
            const [txData, catData] = await Promise.all([
                api.getTransactions(),
                api.getCategories()
            ]);

            // Filter only investment transactions and map to DisplayTransaction format
            const investments = txData
                .filter((t: Transaction) => t.isInvestment)
                .map((t: Transaction) => ({
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
                }));

            setTransactions(investments);
            setCategories(catData);
        } catch (err) {
            console.error(err);
            setError('Falha ao carregar investimentos');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, []);

    // Calculate total invested (sum of all deposits minus withdrawals)
    // Deposits are negative amounts, withdrawals are positive
    // Total = -(sum of all amounts) because:
    //   - Deposit of -100 should ADD 100 to total
    //   - Withdrawal of 50 should SUBTRACT 50 from total
    const totalInvested = React.useMemo(() => {
        return -transactions.reduce((sum, t) => sum + t.amount, 0);
    }, [transactions]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-500">Carregando investimentos...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-rose-600">{error}</div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Investimentos</h1>
                        <p className="text-slate-500 mt-2">Acompanhe seus investimentos e resgates</p>
                    </div>
                </div>
            </div>

            {/* Total Summary */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 mb-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Total Investido</p>
                        <p className="text-4xl font-bold mt-2">{formatCurrency(totalInvested)}</p>
                    </div>
                    <div className="bg-white/20 p-4 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Monthly Timeline with Investment Transactions */}
            {transactions.length > 0 && (
                <MonthlyTimeline
                    transactions={transactions}
                    categories={categories}
                    onUpdateCategory={handleUpdateCategory}
                    onBulkUpdateCategory={handleBulkUpdateCategory}
                    onEditTransaction={handleEditTransaction}
                    onDeleteTransaction={handleDeleteClick}
                    investmentMode="summary"
                />
            )}

            {transactions.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-12 text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 text-slate-300 mx-auto mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                    </svg>
                    <p className="text-slate-500 text-lg">Nenhum investimento encontrado</p>
                    <p className="text-slate-400 text-sm mt-2">
                        Transações com "RDB" na descrição são automaticamente marcadas como investimentos
                    </p>
                </div>
            )}

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
