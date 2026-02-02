import React from 'react';
import { api, type FuturePlanningData } from '../lib/api';

const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const FuturePlanning: React.FC = () => {
    const [planningData, setPlanningData] = React.useState<FuturePlanningData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [months, setMonths] = React.useState(6);

    const loadData = async () => {
        try {
            const data = await api.getFuturePlanning(months);
            setPlanningData(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load future planning data');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, [months]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getMonthLabel = (year: number, month: number) => {
        const today = new Date();
        const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
        const label = MONTHS_PT[month];
        return isCurrentMonth ? `${label} (Atual)` : label;
    };

    const getMonthClass = (year: number, month: number) => {
        const today = new Date();
        const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
        return isCurrentMonth ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200';
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando planejamento...</div>;
    if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;
    if (!planningData) return null;

    const totalRecurringMonthly = planningData.recurringExpenses.reduce((sum, r) => sum + r.averageAmount, 0);

    return (
        <div>
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Planejamento Futuro</h2>
                        <p className="text-slate-500 mt-1">
                            Visualize suas despesas recorrentes e parcelas futuras
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-600">Meses:</label>
                        <select
                            value={months}
                            onChange={(e) => setMonths(Number(e.target.value))}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={3}>3 meses</option>
                            <option value={6}>6 meses</option>
                            <option value={12}>12 meses</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Monthly Summary Cards */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Resumo Mensal</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {planningData.monthlyTotals.map((monthly) => {
                        const total = monthly.recurringTotal + monthly.installmentTotal;
                        return (
                            <div
                                key={`${monthly.year}-${monthly.month}`}
                                className={`p-4 rounded-xl border ${getMonthClass(monthly.year, monthly.month)}`}
                            >
                                <div className="text-sm font-medium text-slate-700 mb-2">
                                    {getMonthLabel(monthly.year, monthly.month)}
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Recorrentes:</span>
                                        <span className="font-medium text-purple-600">
                                            {formatCurrency(monthly.recurringTotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Parcelas:</span>
                                        <span className="font-medium text-amber-600">
                                            {formatCurrency(monthly.installmentTotal)}
                                        </span>
                                    </div>
                                    <div className="pt-1 mt-1 border-t border-slate-200 flex justify-between">
                                        <span className="text-slate-700 font-medium">Total:</span>
                                        <span className="font-bold text-slate-900">
                                            {formatCurrency(total)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recurring Expenses */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-purple-50">
                        <h3 className="text-lg font-semibold text-purple-900">
                            Despesas Recorrentes
                        </h3>
                        <p className="text-sm text-purple-600 mt-1">
                            Total mensal: {formatCurrency(totalRecurringMonthly)}
                        </p>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {planningData.recurringExpenses.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 italic">
                                Nenhuma despesa recorrente cadastrada
                            </div>
                        ) : (
                            planningData.recurringExpenses.map((expense) => (
                                <div key={expense.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                                    <div>
                                        <div className="font-medium text-slate-900">{expense.description}</div>
                                        <div className="text-xs text-slate-500">{expense.categoryName || 'Sem categoria'}</div>
                                    </div>
                                    <div className="text-sm font-semibold text-purple-600">
                                        {formatCurrency(expense.averageAmount)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Future Installments */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-amber-50">
                        <h3 className="text-lg font-semibold text-amber-900">
                            Parcelas Futuras
                        </h3>
                        <p className="text-sm text-amber-600 mt-1">
                            {planningData.futureInstallments.length} parcelas restantes
                        </p>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {planningData.futureInstallments.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 italic">
                                Nenhuma parcela futura
                            </div>
                        ) : (
                            planningData.futureInstallments.map((installment) => (
                                <div key={`${installment.groupId}-${installment.installmentNumber}`} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                                    <div>
                                        <div className="font-medium text-slate-900">{installment.description}</div>
                                        <div className="text-xs text-slate-500">
                                            Parcela {installment.installmentNumber} de {installment.installmentNumber + installment.remainingInstallments - 1}
                                            {installment.dueDate && ` • ${new Date(installment.dueDate).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}`}
                                        </div>
                                    </div>
                                    <div className="text-sm font-semibold text-amber-600">
                                        {formatCurrency(installment.amount)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
