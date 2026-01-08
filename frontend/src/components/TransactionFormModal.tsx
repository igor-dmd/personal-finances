import React from 'react';
import { CategoryCombobox } from './CategoryCombobox';
import type { Account, Category, CreateTransactionData } from '../lib/api';
import type { DisplayTransaction } from './MonthSection';
import { api } from '../lib/api';

interface TransactionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => Promise<void>;
    accounts: Account[];
    categories: Category[];
    initialData?: DisplayTransaction | null;
    mode: 'create' | 'edit';
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    accounts,
    categories,
    initialData,
    mode,
}) => {
    const [accountId, setAccountId] = React.useState<number>(0);
    const [date, setDate] = React.useState<string>('');
    const [amount, setAmount] = React.useState<string>('');
    const [direction, setDirection] = React.useState<'income' | 'expense'>('expense');
    const [description, setDescription] = React.useState<string>('');
    const [type, setType] = React.useState<'credit_card' | 'checking'>('credit_card');
    const [categoryId, setCategoryId] = React.useState<number | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            if (mode === 'create') {
                setAccountId(accounts[0]?.id || 0);
                setDate(new Date().toISOString().split('T')[0]);
                setAmount('');
                setDirection('expense');
                setDescription('');
                setType('credit_card');
                setCategoryId(null);
            } else if (initialData) {
                setAccountId(accounts[0]?.id || 0);
                setDate(initialData.rawDate.split('T')[0]);
                setAmount(Math.abs(initialData.amount).toString());
                setDirection(initialData.amount >= 0 ? 'income' : 'expense');
                setDescription(initialData.description);
                setType(initialData.type as 'credit_card' | 'checking');
                setCategoryId(initialData.categoryId);
            }
            setError(null);
        }
    }, [isOpen, mode, initialData, accounts]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!accountId || !date || !amount || !description) {
            setError('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError('Valor deve ser um número positivo');
            return;
        }

        const finalAmount = direction === 'expense' ? -numericAmount : numericAmount;

        setLoading(true);

        try {
            if (mode === 'create') {
                await api.createTransaction({
                    accountId,
                    categoryId,
                    date,
                    amount: finalAmount,
                    description,
                    type,
                });
            } else if (initialData) {
                await api.updateTransaction(initialData.id, {
                    categoryId,
                    date,
                    amount: finalAmount,
                    description,
                });
            }
            await onSave();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar transação');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
                className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">
                        {mode === 'create' ? 'Adicionar Transação' : 'Editar Transação'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {mode === 'create' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Conta *
                                </label>
                                <select
                                    value={accountId}
                                    onChange={(e) => setAccountId(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value={0} disabled>Selecione uma conta</option>
                                    {accounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Data *
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Valor *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Tipo *
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="income"
                                        checked={direction === 'income'}
                                        onChange={(e) => setDirection(e.target.value as 'income' | 'expense')}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-slate-700">Receita</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="expense"
                                        checked={direction === 'expense'}
                                        onChange={(e) => setDirection(e.target.value as 'income' | 'expense')}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-slate-700">Despesa</span>
                                </label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Descrição *
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ex: Supermercado"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {mode === 'create' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tipo de Conta *
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as 'credit_card' | 'checking')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="credit_card">Cartão de Crédito</option>
                                    <option value="checking">Conta Corrente</option>
                                </select>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Categoria
                            </label>
                            <CategoryCombobox
                                categories={categories}
                                selectedCategoryId={categoryId}
                                onSelect={setCategoryId}
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
