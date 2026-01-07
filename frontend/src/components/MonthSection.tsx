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
    isFirst: boolean;
    isLast: boolean;
}

export const MonthSection: React.FC<MonthSectionProps> = ({
    monthLabel,
    transactions,
    categories,
    isExpanded,
    onToggle,
    onUpdateCategory,
    onBulkUpdateCategory,
    isFirst,
    isLast
}) => {
    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [showBulkOption, setShowBulkOption] = React.useState(false);
    const [matchingCount, setMatchingCount] = React.useState<number>(0);
    const [isBulkUpdating, setIsBulkUpdating] = React.useState(false);

    // Calculate totals for this month
    const { income, expenses } = React.useMemo(() => {
        let income = 0;
        let expenses = 0;
        for (const t of transactions) {
            if (t.amount > 0) income += t.amount;
            else expenses += Math.abs(t.amount);
        }
        return { income, expenses };
    }, [transactions]);

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

                {/* Income/Expense summary */}
                <span className="text-sm text-slate-500 ml-auto mr-2">
                    <span className="text-emerald-600">+{formatCurrency(income)}</span>
                    {' / '}
                    <span className="text-rose-600">-{formatCurrency(expenses)}</span>
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
                                        <th className="px-4 py-3 font-semibold w-12">Tipo</th>
                                        <th className="px-6 py-3 font-semibold">Data</th>
                                        <th className="px-6 py-3 font-semibold">Descrição</th>
                                        <th className="px-6 py-3 font-semibold">Categoria</th>
                                        <th className="px-6 py-3 font-semibold text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-4 text-center">
                                                <AccountTypeIcon type={t.type} />
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{t.date}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{t.description}</td>
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
                                            <td className={`px-6 py-4 text-right font-medium whitespace-nowrap ${t.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {t.amount < 0 ? '-' : '+'}
                                                {formatCurrency(Math.abs(t.amount))}
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
