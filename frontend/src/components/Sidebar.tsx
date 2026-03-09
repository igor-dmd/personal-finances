import React from 'react';
import { Link } from 'react-router-dom';
import { 
    CreditCard, 
    BarChart3, 
    RefreshCw, 
    Calendar, 
    TrendingUp, 
    Tags, 
    Ban, 
    UploadCloud, 
    Settings,
    Wallet
} from 'lucide-react';

interface SidebarProps {
    activeItem?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem = 'Dashboard' }) => {
    const navItems = [
        { name: 'Transactions', icon: CreditCard, path: '/' },
        { name: 'Installments', icon: BarChart3, path: '/installments' },
        { name: 'Recurring', icon: RefreshCw, path: '/recurring' },
        { name: 'Planning', icon: Calendar, path: '/planning' },
        { name: 'Investments', icon: TrendingUp, path: '/investments' },
        { name: 'Categories', icon: Tags, path: '/categories' },
        { name: 'Ignored', icon: Ban, path: '/ignored' },
        { name: 'Import', icon: UploadCloud, path: '/import' },
        { name: 'Settings', icon: Settings, path: '/settings' },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 hidden md:flex flex-col border-r border-slate-800/50 shadow-2xl z-50">
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <Wallet size={18} />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">Finances</h1>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeItem === item.name;
                    
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                                isActive
                                    ? 'bg-indigo-600/10 text-indigo-400'
                                    : 'hover:text-white hover:bg-slate-800/60'
                            }`}
                        >
                            <Icon 
                                size={18} 
                                className={`transition-transform duration-200 ${
                                    isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-110'
                                }`} 
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 m-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-semibold text-white text-sm shadow-md">
                        IG
                    </div>
                    <div className="text-sm flex-1">
                        <div className="text-slate-200 font-medium">Igor</div>
                        <div className="text-indigo-400 text-xs font-medium">Pro Member</div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
