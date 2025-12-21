import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { StatsCard } from '../components/StatsCard';
import { TransactionTable } from '../components/TransactionTable';

export const Dashboard: React.FC = () => {
    // Mock Data
    const transactions = [
        { id: 1, date: 'May 24, 2025', description: 'Starbucks', category: 'Coffee', amount: -6.50 },
        { id: 2, date: 'May 24, 2025', description: 'Whole Foods Market', category: 'Groceries', amount: -142.30 },
        { id: 3, date: 'May 23, 2025', description: 'Uber Trip', category: 'Transport', amount: -24.90 },
        { id: 4, date: 'May 23, 2025', description: 'Refund - Target', category: 'Shopping', amount: 89.99 },
        { id: 5, date: 'May 22, 2025', description: 'Netflix Subscription', category: 'Entertainment', amount: -15.99 },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar activeItem="Dashboard" />

            <main className="flex-1 md:ml-64 p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                        <p className="text-slate-500 mt-1">Welcome back, Igor</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-900/10">
                        + New Import
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatsCard
                        title="Total Balance"
                        value="$124,500.00"
                        trend="up"
                        trendValue="2.5%"
                    />
                    <StatsCard
                        title="Monthly Income"
                        value="$6,200.00"
                        trend="up"
                        trendValue="12%"
                    />
                    <StatsCard
                        title="Monthly Expenses"
                        value="$3,850.00"
                        trend="down"
                        trendValue="5%"
                    />
                </div>

                {/* Chart Placeholder */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8 h-80 flex items-center justify-center text-slate-400">
                    [ Spending Trends Chart Placeholder ]
                </div>

                <div className="mb-6 flex justify-between items-end">
                    <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
                    <a href="#" className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</a>
                </div>

                <TransactionTable transactions={transactions} />
            </main>
        </div>
    );
};
