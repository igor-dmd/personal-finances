import React from 'react';
import { CategoryCombobox } from './CategoryCombobox';
import type { Category, InstitutionsConfig } from '../lib/api';
import type { DisplayTransaction } from './MonthSection';
import { api } from '../lib/api';

interface TransactionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => Promise<void>;
    categories: Category[];
    initialData?: DisplayTransaction | null;
    mode: 'create' | 'edit';
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    categories,
    initialData,
    mode,
}) => {
    const [date, setDate] = React.useState<string>('');
    const [amount, setAmount] = React.useState<string>('');
    const [direction, setDirection] = React.useState<'income' | 'expense'>('expense');
    const [description, setDescription] = React.useState<string>('');
    const [type, setType] = React.useState<'credit_card' | 'checking' | 'investment'>('credit_card');
    const [categoryId, setCategoryId] = React.useState<number | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [isInstallment, setIsInstallment] = React.useState(false);
    const [totalInstallments, setTotalInstallments] = React.useState<number>(2);
    const [institutionsConfig, setInstitutionsConfig] = React.useState<InstitutionsConfig | null>(null);
    const [selectedInstitutionId, setSelectedInstitutionId] = React.useState<string>('');
    const [isInvestment, setIsInvestment] = React.useState(false);

    // Fetch institutions config on mount
    React.useEffect(() => {
        api.getInstitutionsConfig().then(setInstitutionsConfig).catch(console.error);
    }, []);

    // Get the selected institution's available account types
    const selectedInstitution = institutionsConfig?.institutions.find(i => i.id === selectedInstitutionId);
    const availableAccountTypes = selectedInstitution?.accountTypes || [];

    React.useEffect(() => {
        if (isOpen) {
            if (mode === 'create') {
                setDate(new Date().toISOString().split('T')[0]);
                setAmount('');
                setDirection('expense');
                setDescription('');
                setSelectedInstitutionId(institutionsConfig?.institutions[0]?.id || '');
                setType('credit_card');
                setCategoryId(null);
                setIsInstallment(false);
                setTotalInstallments(2);
                setIsInvestment(false);
            } else if (initialData) {
                setDate(initialData.rawDate.split('T')[0]);
                setAmount(Math.abs(initialData.amount).toString());
                setDirection(initialData.amount >= 0 ? 'income' : 'expense');
                setDescription(initialData.description);
                setType(initialData.type as 'credit_card' | 'checking' | 'investment');
                setCategoryId(initialData.categoryId);
                setIsInvestment(initialData.isInvestment ?? false);
            }
            setError(null);
        }
    }, [isOpen, mode, initialData, institutionsConfig]);

    // When institution changes, reset account type to first available
    React.useEffect(() => {
        if (selectedInstitution && selectedInstitution.accountTypes.length > 0) {
            if (!selectedInstitution.accountTypes.includes(type)) {
                setType(selectedInstitution.accountTypes[0]);
            }
        }
    }, [selectedInstitutionId, selectedInstitution, type]);

    // Clear category when investment type is selected
    React.useEffect(() => {
        if (type === 'investment' && categoryId !== null) {
            setCategoryId(null);
        }
    }, [type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (mode === 'create' && !selectedInstitutionId) {
            setError('Por favor, selecione uma instituição');
            return;
        }

        if (!date || !amount || !description) {
            setError('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError('Valor deve ser um número positivo');
            return;
        }

        if (isInstallment && (totalInstallments < 2 || totalInstallments > 120)) {
            setError('Número de parcelas deve estar entre 2 e 120');
            return;
        }

        setLoading(true);

        try {
            if (mode === 'create') {
                if (isInstallment) {
                    // Create installment group with all transactions
                    await api.createInstallment({
                        description,
                        totalInstallments,
                        totalAmount: numericAmount,
                        firstInstallmentDate: date,
                        institutionId: selectedInstitutionId,
                        type,
                        categoryId,
                    });
                } else {
                    // Create single transaction
                    const finalAmount = direction === 'expense' ? -numericAmount : numericAmount;
                    await api.createTransaction({
                        institutionId: selectedInstitutionId,
                        categoryId,
                        date,
                        amount: finalAmount,
                        description,
                        type,
                        isInvestment,
                    });
                }
            } else if (initialData) {
                const finalAmount = direction === 'expense' ? -numericAmount : numericAmount;
                await api.updateTransaction(initialData.id, {
                    categoryId,
                    date,
                    amount: finalAmount,
                    description,
                    isInvestment,
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
                        {mode === 'create' && institutionsConfig && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Instituição *
                                    </label>
                                    <select
                                        value={selectedInstitutionId}
                                        onChange={(e) => setSelectedInstitutionId(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="" disabled>Selecione uma instituição</option>
                                        {institutionsConfig.institutions.map((institution) => (
                                            <option key={institution.id} value={institution.id}>
                                                {institution.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedInstitutionId && availableAccountTypes.length > 0 && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Tipo de Conta *
                                        </label>
                                        <select
                                            value={type}
                                            onChange={(e) => {
                                                const newType = e.target.value as 'credit_card' | 'checking' | 'investment';
                                                setType(newType);
                                                // Auto-set isInvestment when investment type is selected
                                                setIsInvestment(newType === 'investment');
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            {availableAccountTypes.map((accountType) => (
                                                <option key={accountType} value={accountType}>
                                                    {institutionsConfig.accountTypeLabels[accountType]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </>
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
                                {type === 'investment' ? 'Movimentação *' : 'Tipo *'}
                            </label>
                            <div className="flex gap-4">
                                {type === 'investment' ? (
                                    <>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="expense"
                                                checked={direction === 'expense'}
                                                onChange={(e) => setDirection(e.target.value as 'income' | 'expense')}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-slate-700">Investido</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="income"
                                                checked={direction === 'income'}
                                                onChange={(e) => setDirection(e.target.value as 'income' | 'expense')}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-slate-700">Resgatado</span>
                                        </label>
                                    </>
                                ) : (
                                    <>
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
                                    </>
                                )}
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

                        {mode === 'edit' && (
                            <div className="mb-4">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isInvestment}
                                        onChange={(e) => setIsInvestment(e.target.checked)}
                                        className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">
                                        É um investimento?
                                    </span>
                                </label>
                            </div>
                        )}

                        {mode === 'create' && (
                            <>
                                <div className="mb-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isInstallment}
                                            onChange={(e) => setIsInstallment(e.target.checked)}
                                            className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">
                                            É um parcelamento?
                                        </span>
                                    </label>
                                </div>

                                {isInstallment && (
                                    <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Número de Parcelas *
                                            </label>
                                            <input
                                                type="number"
                                                min="2"
                                                max="120"
                                                value={totalInstallments}
                                                onChange={(e) => setTotalInstallments(parseInt(e.target.value) || 2)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            <p className="mt-1 text-xs text-slate-500">
                                                Entre 2 e 120 parcelas
                                            </p>
                                        </div>

                                        <div className="mt-3 p-3 bg-white rounded border border-purple-300">
                                            <p className="text-sm text-slate-700">
                                                <span className="font-semibold">Valor total:</span> R$ {parseFloat(amount || '0').toFixed(2)}
                                            </p>
                                            <p className="text-sm text-slate-700 mt-1">
                                                <span className="font-semibold">Valor por parcela:</span> R${' '}
                                                {totalInstallments > 0
                                                    ? (parseFloat(amount || '0') / totalInstallments).toFixed(2)
                                                    : '0.00'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-2">
                                                Serão criadas {totalInstallments} transações mensais começando em{' '}
                                                {date ? new Date(date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Hide category for investment transactions */}
                        {((mode === 'create' && type !== 'investment') || (mode === 'edit' && !isInvestment)) && (
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
                        )}

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
