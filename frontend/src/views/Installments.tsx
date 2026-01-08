import React from 'react';
import { api } from '../lib/api';
import type { InstallmentGroup } from '../lib/api';

export const Installments: React.FC = () => {
    const [groups, setGroups] = React.useState<InstallmentGroup[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const loadGroups = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getInstallments();
            setGroups(data);
        } catch (err: any) {
            console.error('Failed to load installments', err);
            setError('Falha ao carregar parcelamentos');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadGroups();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-500">Carregando parcelamentos...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-rose-600">{error}</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Parcelamentos</h1>
                <p className="text-slate-500 mt-2">Acompanhe suas compras parceladas</p>
            </div>

            {groups.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-12 text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 text-slate-300 mx-auto mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                    <p className="text-slate-500 text-lg">Nenhum parcelamento encontrado</p>
                    <p className="text-slate-400 text-sm mt-2">
                        Adicione uma nova transação parcelada para começar
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {groups.map(group => {
                        const progress = (group.paidInstallments / group.totalInstallments) * 100;

                        return (
                            <div
                                key={group.id}
                                className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">{group.description}</h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {group.paidInstallments} de {group.totalInstallments} parcelas pagas
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-slate-900">
                                            {formatCurrency(group.totalAmount)}
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            Faltam {formatCurrency(group.remainingAmount)}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>{formatCurrency(group.paidAmount)} pago</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>

                                {/* Additional info */}
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="text-xs text-slate-400">
                                        Criado em {new Date(group.createdAt).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            {group.totalInstallments}x de {formatCurrency(group.totalAmount / group.totalInstallments)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
