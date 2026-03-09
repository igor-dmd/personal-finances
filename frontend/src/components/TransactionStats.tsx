import React from 'react';
import { StatsCard } from './StatsCard';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface TransactionStatsProps {
    transactions: { amount: number; isInvestment?: boolean; isIgnored?: boolean }[];
}

export const TransactionStats: React.FC<TransactionStatsProps> = ({ transactions }) => {
    const { income, expenses, balance } = React.useMemo(() => {
        let income = 0;
        let expenses = 0;

        for (const t of transactions) {
            if (t.isInvestment) continue;
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <StatsCard
                title="Receitas"
                value={formatCurrency(income)}
                icon={<TrendingUp className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />}
            />
            <StatsCard
                title="Despesas"
                value={formatCurrency(expenses)}
                icon={<TrendingDown className="h-5 w-5 text-rose-500 group-hover:scale-110 transition-transform duration-300" />}
            />
            <StatsCard
                title="Saldo"
                value={formatCurrency(balance)}
                icon={<Wallet className={`h-5 w-5 group-hover:scale-110 transition-transform duration-300 ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />}
            />
        </div>
    );
};
