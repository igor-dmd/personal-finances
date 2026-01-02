import React from 'react';
import type { Category } from '../lib/api';

export interface DisplayTransaction {
    id: number;
    date: string;
    description: string;
    category: string;
    categoryId: number | null;
    amount: number;
}

interface TransactionTableProps {
    transactions: DisplayTransaction[];
    categories: Category[];
    onUpdateCategory: (transactionId: number, categoryId: number | null) => Promise<void>;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, categories, onUpdateCategory }) => {
    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);

    const handleEditClick = (t: DisplayTransaction) => {
        setEditingId(t.id);
        setSelectedCategoryId(t.categoryId);
    };

    const handleSave = async (id: number) => {
        setIsSaving(true);
        try {
            await onUpdateCategory(id, selectedCategoryId);
            setEditingId(null);
        } catch (error) {
            console.error('Failed to update category', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-900 border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold">Description</th>
                        <th className="px-6 py-4 font-semibold">Category</th>
                        <th className="px-6 py-4 font-semibold text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{t.date}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">{t.description}</td>
                            <td className="px-6 py-4">
                                {editingId === t.id ? (
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedCategoryId || ''}
                                            onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
                                            disabled={isSaving}
                                            autoFocus
                                        >
                                            <option value="">Uncategorized</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleSave(t.id)}
                                            disabled={isSaving || selectedCategoryId === t.categoryId}
                                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded disabled:opacity-30"
                                            title="Save"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={isSaving}
                                            className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                                            title="Cancel"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
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
                                ${Math.abs(t.amount).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
