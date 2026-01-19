import React from 'react';
import { StatsCard } from './StatsCard';

interface TransactionStatsProps {
    transactions: { amount: number; isInvestment?: boolean; isIgnored?: boolean }[];
}

export const TransactionStats: React.FC<TransactionStatsProps> = ({ transactions }) => {
    const { income, expenses, balance } = React.useMemo(() => {
        let income = 0;
        let expenses = 0;

        for (const t of transactions) {
            // Skip investment transactions (they're shown on the Investments page)
            if (t.isInvestment) continue;
            // Skip ignored transactions
            if (t.isIgnored) continue;

            if (t.amount > 0) {
                income += t.amount;
            } else {
                expenses += Math.abs(t.amount);
            }
        }

        return {
            income,
            expenses,
            balance: income - expenses
        };
    }, [transactions]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatsCard
                title="Receitas"
                value={formatCurrency(income)}
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                }
            />
            <StatsCard
                title="Despesas"
                value={formatCurrency(expenses)}
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                    </svg>
                }
            />
            <StatsCard
                title="Saldo"
                value={formatCurrency(balance)}
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                }
            />
        </div>
    );
};
