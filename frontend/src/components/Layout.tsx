import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
    const location = useLocation();

    // Determine active sidebar item based on current path
    const getActiveItem = () => {
        const path = location.pathname;
        if (path === '/') return 'Transactions';
        if (path === '/installments') return 'Installments';
        if (path === '/recurring') return 'Recurring';
        if (path === '/planning') return 'Planning';
        if (path === '/investments') return 'Investments';
        if (path === '/categories') return 'Categories';
        if (path === '/ignored') return 'Ignored';
        if (path === '/import') return 'Import';
        return 'Transactions';
    };

    const activeItem = getActiveItem();

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar activeItem={activeItem} />

            <main className="flex-1 md:ml-64 p-8">
                <Outlet />
            </main>
        </div>
    );
};
