import React from 'react';

interface StatsCardProps {
    title: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, trend, trendValue, icon }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex justify-between items-start">
                <span className="text-slate-500 text-sm font-medium">{title}</span>
                {icon && <div className="text-slate-400">{icon}</div>}
            </div>

            <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-slate-800">{value}</span>
                {trend && (
                    <div className={`text-sm flex items-center gap-1 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-500'}`}>
                        <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'}</span>
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
