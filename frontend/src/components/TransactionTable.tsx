import React from 'react';

export interface DisplayTransaction {
    id: number;
    date: string;
    description: string;
    category: string;
    amount: number;
}

interface TransactionTableProps {
    transactions: DisplayTransaction[];
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
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
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                    {t.category}
                                </span>
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
