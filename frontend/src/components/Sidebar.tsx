import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarProps {
    activeItem?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem = 'Dashboard' }) => {
    const navItems = [
        { name: 'Transactions', icon: '💳', path: '/' },
        { name: 'Installments', icon: '📊', path: '/installments' },
        { name: 'Categories', icon: '🏷️', path: '/categories' },
        { name: 'Import', icon: '📥', path: '/import' },
        { name: 'Settings', icon: '⚙️', path: '/settings' },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 hidden md:flex flex-col">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight">Finances</h1>
            </div>

            <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeItem === item.name
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        <span>{item.icon}</span>
                        {item.name}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                        IG
                    </div>
                    <div className="text-sm">
                        <div className="text-white">Igor</div>
                        <div className="text-slate-500 text-xs">Pro Member</div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
