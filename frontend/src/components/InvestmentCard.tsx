import React from 'react';
import type { Investment, InvestmentDetail } from '../lib/api';

interface InvestmentCardProps {
    investment: Investment;
    isExpanded: boolean;
    expandedDetail: InvestmentDetail | null;
    onToggleExpand: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddMovement: () => void;
    onUpdateCurrentValue: (value: number) => void;
    onDeleteMovement: (movementId: number) => void;
}

export const InvestmentCard: React.FC<InvestmentCardProps> = ({
    investment,
    isExpanded,
    expandedDetail,
    onToggleExpand,
    onEdit,
    onDelete,
    onAddMovement,
    onUpdateCurrentValue,
    onDeleteMovement
}) => {
    const [isEditingValue, setIsEditingValue] = React.useState(false);
    const [editValue, setEditValue] = React.useState(investment.currentValue);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const handleSaveValue = () => {
        onUpdateCurrentValue(editValue);
        setIsEditingValue(false);
    };

    const handleCancelEdit = () => {
        setEditValue(investment.currentValue);
        setIsEditingValue(false);
    };

    // Update local edit value when investment changes
    React.useEffect(() => {
        setEditValue(investment.currentValue);
    }, [investment.currentValue]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Card Header */}
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {investment.type}
                            </span>
                            <span className="text-sm text-slate-500">
                                {investment.accountName}
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">
                            {investment.name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEdit}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Aplicado</p>
                        <p className="text-lg font-semibold text-slate-800">{formatCurrency(investment.totalDeposited)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Resgatado</p>
                        <p className="text-lg font-semibold text-slate-800">{formatCurrency(investment.totalWithdrawn)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Saldo Investido</p>
                        <p className="text-lg font-semibold text-blue-600">{formatCurrency(investment.netInvested)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Valor Atual</p>
                        {isEditingValue ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editValue}
                                    onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                                    className="w-28 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSaveValue}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="Salvar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                                    title="Cancelar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-semibold text-slate-800">{formatCurrency(investment.currentValue)}</p>
                                <button
                                    onClick={() => setIsEditingValue(true)}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    title="Atualizar valor"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        {investment.gain !== 0 && !isEditingValue && (
                            <p className={`text-xs ${investment.gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {investment.gain >= 0 ? '+' : ''}{formatCurrency(investment.gain)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Expand/Collapse Button */}
                <button
                    onClick={onToggleExpand}
                    className="w-full mt-4 py-2 text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-2 border-t border-slate-100 -mx-6 px-6"
                >
                    {isExpanded ? 'Ocultar movimentações' : 'Ver movimentações'}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Expanded Movements Section */}
            {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-700">Movimentações</h4>
                        <button
                            onClick={onAddMovement}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Adicionar
                        </button>
                    </div>

                    {expandedDetail && expandedDetail.movements.length > 0 ? (
                        <div className="bg-white rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 text-slate-600">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium">Data</th>
                                        <th className="px-4 py-2 text-left font-medium">Tipo</th>
                                        <th className="px-4 py-2 text-left font-medium">Descrição</th>
                                        <th className="px-4 py-2 text-right font-medium">Valor</th>
                                        <th className="px-4 py-2 text-center font-medium">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {expandedDetail.movements.map((movement) => (
                                        <tr key={movement.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-600">
                                                {formatDate(movement.date)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    movement.type === 'deposit'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {movement.type === 'deposit' ? 'Aplicação' : 'Resgate'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {movement.description || '-'}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-medium ${
                                                movement.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'
                                            }`}>
                                                {movement.type === 'deposit' ? '+' : '-'}{formatCurrency(movement.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => onDeleteMovement(movement.id)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                    title="Excluir"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <p>Nenhuma movimentação registrada</p>
                            <p className="text-sm mt-1">Adicione aplicações e resgates para acompanhar seu investimento</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
