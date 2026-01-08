import React from 'react';
import type { Category } from '../lib/api';
import { MonthSection, type DisplayTransaction } from './MonthSection';
import { groupTransactionsByMonth, getCurrentMonthKey } from '../utils/date';

interface MonthlyTimelineProps {
    transactions: DisplayTransaction[];
    categories: Category[];
    onUpdateCategory: (transactionId: number, categoryId: number | null) => Promise<void>;
    onBulkUpdateCategory: (description: string, categoryId: number | null) => Promise<void>;
    onEditTransaction: (transaction: DisplayTransaction) => void;
    onDeleteTransaction: (transaction: DisplayTransaction) => void;
}

export const MonthlyTimeline: React.FC<MonthlyTimelineProps> = ({
    transactions,
    categories,
    onUpdateCategory,
    onBulkUpdateCategory,
    onEditTransaction,
    onDeleteTransaction
}) => {
    const [expandedMonths, setExpandedMonths] = React.useState<Set<string>>(() => {
        return new Set([getCurrentMonthKey()]);
    });

    const monthGroups = React.useMemo(() => {
        return groupTransactionsByMonth(transactions);
    }, [transactions]);

    const toggleMonth = (monthKey: string) => {
        setExpandedMonths(prev => {
            const next = new Set(prev);
            if (next.has(monthKey)) {
                next.delete(monthKey);
            } else {
                next.add(monthKey);
            }
            return next;
        });
    };

    if (monthGroups.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                Nenhuma transação encontrada
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {monthGroups.map((group, index) => (
                <MonthSection
                    key={group.key}
                    monthKey={group.key}
                    monthLabel={group.label}
                    transactions={group.transactions}
                    categories={categories}
                    isExpanded={expandedMonths.has(group.key)}
                    onToggle={() => toggleMonth(group.key)}
                    onUpdateCategory={onUpdateCategory}
                    onBulkUpdateCategory={onBulkUpdateCategory}
                    onEditTransaction={onEditTransaction}
                    onDeleteTransaction={onDeleteTransaction}
                    isFirst={index === 0}
                    isLast={index === monthGroups.length - 1}
                />
            ))}
        </div>
    );
};
