import React from 'react';
import type { Category } from '../lib/api';
import { CategoryCombobox } from './CategoryCombobox';
import { AccountTypeIcon } from './AccountTypeIcon';
import { api } from '../lib/api';

export interface DisplayTransaction {
    id: number;
    date: string;
    rawDate: string;
    description: string;
    category: string;
    categoryId: number | null;
    amount: number;
    type: 'credit_card' | 'checking' | string;
    installmentGroupId: number | null;
    installmentNumber: number | null;
    isInvestment: boolean;
    isIgnored: boolean;
    isRecurring: boolean;
}

interface MonthSectionProps {
    monthKey: string;
    monthLabel: string;
    transactions: DisplayTransaction[];
    categories: Category[];
    isExpanded: boolean;
    onToggle: () => void;
    onUpdateCategory: (transactionId: number, categoryId: number | null) => Promise<void>;
    onBulkUpdateCategory: (description: string, categoryId: number | null) => Promise<void>;
    onEditTransaction: (transaction: DisplayTransaction) => void;
    onDeleteTransaction: (transaction: DisplayTransaction) => void;
    onIgnoreTransaction?: (description: string) => void;
    onRecurringTransaction?: (description: string) => void;
    isFirst: boolean;
    isLast: boolean;
    investmentMode?: 'summary' | null;
}

export const MonthSection: React.FC<MonthSectionProps> = ({
    monthLabel,
    transactions,
    categories,
    isExpanded,
    onToggle,
    onUpdateCategory,
    onBulkUpdateCategory,
    onEditTransaction,
    onDeleteTransaction,
    onIgnoreTransaction,
    onRecurringTransaction,
    isFirst,
    isLast,
    investmentMode = null
}) => {
    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [showBulkOption, setShowBulkOption] = React.useState(false);
    const [matchingCount, setMatchingCount] = React.useState<number>(0);
    const [isBulkUpdating, setIsBulkUpdating] = React.useState(false);
    const [installmentGroups, setInstallmentGroups] = React.useState<Map<number, { totalInstallments: number }>>(new Map());

    // Calculate totals for this month
    // Regular mode: income/expenses (excluding investments)
    // Investment mode: investido/resgatado
    const summary = React.useMemo(() => {
        if (investmentMode === 'summary') {
            // Investment mode: calculate Investido (deposits) and Resgatado (withdrawals)
            let investido = 0;  // Negative amounts (deposits to investment)
            let resgatado = 0;  // Positive amounts (withdrawals from investment)
            for (const t of transactions) {
                if (t.isIgnored) continue;
                if (t.amount < 0) investido += Math.abs(t.amount);
                else resgatado += t.amount;
            }
            return { investido, resgatado };
        } else {
            // Regular mode: calculate income/expenses (excluding investments)
            let income = 0;
            let expenses = 0;
            for (const t of transactions) {
                if (t.isInvestment) continue; // Skip investment transactions
                if (t.isIgnored) continue; // Skip ignored transactions
                if (t.amount > 0) income += t.amount;
                else expenses += Math.abs(t.amount);
            }
            return { income, expenses };
        }
    }, [transactions, investmentMode]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const handleEditClick = (t: DisplayTransaction) => {
        setEditingId(t.id);
        setSelectedCategoryId(t.categoryId);
    };

    // Fetch installment group data for transactions with installments
    React.useEffect(() => {
        const fetchInstallmentGroups = async () => {
            const groupIds = new Set<number>();
            transactions.forEach(t => {
                if (t.installmentGroupId) {
                    groupIds.add(t.installmentGroupId);
                }
            });

            if (groupIds.size > 0) {
                const groups = new Map<number, { totalInstallments: number }>();
                for (const groupId of groupIds) {
                    try {
                        const group = await api.getInstallmentDetail(groupId);
                        groups.set(groupId, { totalInstallments: group.totalInstallments });
                    } catch (err) {
                        console.error(`Failed to fetch installment group ${groupId}`, err);
                    }
                }
                setInstallmentGroups(groups);
            }
        };
        fetchInstallmentGroups();
    }, [transactions]);

    React.useEffect(() => {
        const fetchCount = async () => {
            if (editingId !== null) {
                const transaction = transactions.find(t => t.id === editingId);
                if (transaction) {
                    try {
                        const { count } = await api.getTransactionCountByDescription(transaction.description);
                        setMatchingCount(count);
                        setShowBulkOption(count > 1);
                    } catch (err) {
                        console.error('Failed to fetch matching count', err);
                        setShowBulkOption(false);
                    }
                }
            } else {
                setShowBulkOption(false);
                setMatchingCount(0);
            }
        };
        fetchCount();
    }, [editingId, transactions]);

    const handleSave = async (id: number, bulk: boolean = false) => {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;

        if (bulk) {
            setIsBulkUpdating(true);
            try {
                await onBulkUpdateCategory(transaction.description, selectedCategoryId);
                setEditingId(null);
            } catch (error) {
                console.error('Failed to bulk update categories', error);
            } finally {
                setIsBulkUpdating(false);
            }
        } else {
            setIsSaving(true);
            try {
                await onUpdateCategory(id, selectedCategoryId);
                setEditingId(null);
            } catch (error) {
                console.error('Failed to update category', error);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    return (
        <div className="relative">
            {/* Timeline line */}
            {!isFirst && (
                <div className="absolute left-[7px] top-0 h-3 w-0.5 bg-slate-200" />
            )}
            {!isLast && (
                <div className="absolute left-[7px] top-6 bottom-0 w-0.5 bg-slate-200" />
            )}

            {/* Month header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 py-3 hover:bg-slate-50/50 transition-colors rounded-lg group"
            >
                {/* Timeline dot */}
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm flex-shrink-0 z-10" />

                {/* Month label */}
                <span className="text-lg font-semibold text-slate-800">{monthLabel}</span>

                {/* Summary - different labels for regular vs investment mode */}
                <span className="text-sm text-slate-500 ml-auto mr-2">
                    {investmentMode === 'summary' ? (
                        <>
                            <span className="text-emerald-600">Investido {formatCurrency((summary as { investido: number }).investido)}</span>
                            {' / '}
                            <span className="text-rose-600">Resgatado {formatCurrency((summary as { resgatado: number }).resgatado)}</span>
                        </>
                    ) : (
                        <>
                            <span className="text-emerald-600">+{formatCurrency((summary as { income: number }).income)}</span>
                            {' / '}
                            <span className="text-rose-600">-{formatCurrency((summary as { expenses: number }).expenses)}</span>
                        </>
                    )}
                </span>

                {/* Chevron */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>

            {/* Collapsible content */}
            <div
                className={`
                    grid transition-all duration-300 ease-in-out
                    ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
                `}
            >
                <div className="overflow-hidden">
                    <div className="ml-7 mt-2 mb-4">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-900 border-b border-slate-100">
                                    <tr>
                                        {investmentMode !== 'summary' && (
                                            <th className="px-4 py-3 font-semibold w-12">Tipo</th>
                                        )}
                                        <th className="px-6 py-3 font-semibold">Data</th>
                                        <th className="px-6 py-3 font-semibold">Descrição</th>
                                        {investmentMode !== 'summary' && (
                                            <th className="px-6 py-3 font-semibold">Categoria</th>
                                        )}
                                        <th className="px-6 py-3 font-semibold text-right">Valor</th>
                                        <th className="px-4 py-3 font-semibold text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions.map((t) => (
                                        <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors ${t.isRecurring ? 'bg-purple-50/30' : ''}`}>
                                            {investmentMode !== 'summary' && (
                                                <td className="px-4 py-4 text-center">
                                                    <AccountTypeIcon type={t.type} />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{t.date}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    <span className={t.isRecurring ? 'text-purple-700' : ''}>{t.description}</span>
                                                    {t.isRecurring && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                            Recorrente
                                                        </span>
                                                    )}
                                                    {t.installmentGroupId && t.installmentNumber && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                            {t.installmentNumber}/{installmentGroups.get(t.installmentGroupId)?.totalInstallments || '?'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {investmentMode !== 'summary' && (
                                                <td className="px-6 py-4">
                                                    {editingId === t.id ? (
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <CategoryCombobox
                                                                    categories={categories}
                                                                    selectedCategoryId={selectedCategoryId}
                                                                    onSelect={setSelectedCategoryId}
                                                                    disabled={isSaving || isBulkUpdating}
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={() => handleSave(t.id, false)}
                                                                    disabled={isSaving || isBulkUpdating || selectedCategoryId === t.categoryId}
                                                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded disabled:opacity-30"
                                                                    title="Save"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={handleCancel}
                                                                    disabled={isSaving || isBulkUpdating}
                                                                    className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                                                                    title="Cancel"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            </div>

                                                            {showBulkOption && selectedCategoryId !== t.categoryId && (
                                                                <button
                                                                    onClick={() => handleSave(t.id, true)}
                                                                    disabled={isSaving || isBulkUpdating}
                                                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline text-left disabled:opacity-50"
                                                                >
                                                                    {isBulkUpdating
                                                                        ? 'Atualizando...'
                                                                        : `Aplicar a todas as ${matchingCount} transações "${t.description}"`}
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span
                                                            onClick={() => handleEditClick(t)}
                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 cursor-pointer hover:bg-slate-200 transition-colors"
                                                        >
                                                            {t.category}
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            <td className={`px-6 py-4 text-right font-medium whitespace-nowrap ${
                                                investmentMode === 'summary'
                                                    ? (t.amount < 0 ? 'text-emerald-600' : 'text-rose-600')  // Investment mode: negative=green (investido/deposit), positive=red (resgatado/withdrawal)
                                                    : (t.amount < 0 ? 'text-rose-600' : 'text-emerald-600')  // Regular mode: negative=red (expense), positive=green (income)
                                            }`}>
                                                {investmentMode === 'summary'
                                                    ? formatCurrency(Math.abs(t.amount))  // No +/- for investments
                                                    : (t.amount < 0 ? '-' : '+') + formatCurrency(Math.abs(t.amount))
                                                }
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex gap-1 justify-center">
                                                    <button
                                                        onClick={() => onEditTransaction(t)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Editar transação"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    {onIgnoreTransaction && (
                                                        <button
                                                            onClick={() => onIgnoreTransaction(t.description)}
                                                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                            title="Ignorar transações com esta descrição"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {onRecurringTransaction && !t.isRecurring && (
                                                        <button
                                                            onClick={() => onRecurringTransaction(t.description)}
                                                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                            title="Marcar como recorrente"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => onDeleteTransaction(t)}
                                                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                        title="Excluir transação"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
