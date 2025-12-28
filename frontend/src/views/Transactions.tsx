import React from 'react';
import { TransactionTable } from '../components/TransactionTable';

export const Transactions: React.FC = () => {
    // Mock Data - extended for the transactions page
    const transactions = [
        { id: 1, date: 'May 24, 2025', description: 'Starbucks', category: 'Coffee', amount: -6.50 },
        { id: 2, date: 'May 24, 2025', description: 'Whole Foods Market', category: 'Groceries', amount: -142.30 },
        { id: 3, date: 'May 23, 2025', description: 'Uber Trip', category: 'Transport', amount: -24.90 },
        { id: 4, date: 'May 23, 2025', description: 'Refund - Target', category: 'Shopping', amount: 89.99 },
        { id: 5, date: 'May 22, 2025', description: 'Netflix Subscription', category: 'Entertainment', amount: -15.99 },
        { id: 6, date: 'May 21, 2025', description: 'Shell Station', category: 'Gas', amount: -45.00 },
        { id: 7, date: 'May 20, 2025', description: 'Spotify', category: 'Subscriptions', amount: -9.99 },
        { id: 8, date: 'May 19, 2025', description: 'Amazon', category: 'Shopping', amount: -34.50 },
        { id: 9, date: 'May 18, 2025', description: 'Salary', category: 'Income', amount: 3100.00 },
        { id: 10, date: 'May 17, 2025', description: 'Gym Membership', category: 'Health', amount: -29.99 },
    ];

    return (
        <div>
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Transactions</h2>
                    <p className="text-slate-500 mt-1">View and manage your financial transactions</p>
                </div>
            </div>

            <TransactionTable transactions={transactions} />
        </div>
    );
};
