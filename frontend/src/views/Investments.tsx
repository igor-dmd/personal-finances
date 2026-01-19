import React from 'react';
import { api } from '../lib/api';
import type { Investment, InvestmentDetail, InstitutionsConfig } from '../lib/api';
import { InvestmentFormModal } from '../components/InvestmentFormModal';
import { InvestmentCard } from '../components/InvestmentCard';
import { MovementFormModal } from '../components/MovementFormModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

export const Investments: React.FC = () => {
    const [investments, setInvestments] = React.useState<Investment[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [institutionsConfig, setInstitutionsConfig] = React.useState<InstitutionsConfig | null>(null);

    // Modal states
    const [isInvestmentModalOpen, setIsInvestmentModalOpen] = React.useState(false);
    const [isMovementModalOpen, setIsMovementModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [selectedInvestment, setSelectedInvestment] = React.useState<Investment | null>(null);
    const [expandedInvestmentId, setExpandedInvestmentId] = React.useState<number | null>(null);
    const [expandedDetail, setExpandedDetail] = React.useState<InvestmentDetail | null>(null);
    const [investmentToDelete, setInvestmentToDelete] = React.useState<Investment | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [investmentsData, configData] = await Promise.all([
                api.getInvestments(),
                api.getInstitutionsConfig()
            ]);
            setInvestments(investmentsData);
            setInstitutionsConfig(configData);
        } catch (err) {
            console.error(err);
            setError('Falha ao carregar investimentos');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, []);

    // Calculate totals
    const totals = React.useMemo(() => {
        let totalDeposited = 0;
        let totalWithdrawn = 0;
        let totalCurrentValue = 0;

        for (const inv of investments) {
            totalDeposited += inv.totalDeposited;
            totalWithdrawn += inv.totalWithdrawn;
            totalCurrentValue += inv.currentValue;
        }

        const netInvested = totalDeposited - totalWithdrawn;
        const totalGain = totalCurrentValue - netInvested;

        return {
            totalDeposited,
            totalWithdrawn,
            netInvested,
            totalCurrentValue,
            totalGain
        };
    }, [investments]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const handleAddInvestment = () => {
        setSelectedInvestment(null);
        setIsInvestmentModalOpen(true);
    };

    const handleEditInvestment = (investment: Investment) => {
        setSelectedInvestment(investment);
        setIsInvestmentModalOpen(true);
    };

    const handleDeleteClick = (investment: Investment) => {
        setInvestmentToDelete(investment);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!investmentToDelete) return;
        try {
            await api.deleteInvestment(investmentToDelete.id);
            setIsDeleteModalOpen(false);
            setInvestmentToDelete(null);
            if (expandedInvestmentId === investmentToDelete.id) {
                setExpandedInvestmentId(null);
                setExpandedDetail(null);
            }
            await loadData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleSaveInvestment = async () => {
        setIsInvestmentModalOpen(false);
        setSelectedInvestment(null);
        await loadData();
    };

    const handleAddMovement = (investment: Investment) => {
        setSelectedInvestment(investment);
        setIsMovementModalOpen(true);
    };

    const handleSaveMovement = async () => {
        setIsMovementModalOpen(false);
        await loadData();
        // Reload expanded detail if this investment is expanded
        if (selectedInvestment && expandedInvestmentId === selectedInvestment.id) {
            const detail = await api.getInvestmentDetail(selectedInvestment.id);
            setExpandedDetail(detail);
        }
    };

    const handleToggleExpand = async (investment: Investment) => {
        if (expandedInvestmentId === investment.id) {
            setExpandedInvestmentId(null);
            setExpandedDetail(null);
        } else {
            setExpandedInvestmentId(investment.id);
            try {
                const detail = await api.getInvestmentDetail(investment.id);
                setExpandedDetail(detail);
            } catch (err) {
                console.error('Failed to load investment detail', err);
            }
        }
    };

    const handleUpdateCurrentValue = async (investmentId: number, newValue: number) => {
        try {
            await api.updateInvestment(investmentId, { currentValue: newValue });
            await loadData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDeleteMovement = async (investmentId: number, movementId: number) => {
        try {
            await api.deleteInvestmentMovement(investmentId, movementId);
            await loadData();
            // Reload expanded detail
            if (expandedInvestmentId === investmentId) {
                const detail = await api.getInvestmentDetail(investmentId);
                setExpandedDetail(detail);
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-500">Carregando investimentos...</div>
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
        <div>
            <div className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Investimentos</h1>
                        <p className="text-slate-500 mt-2">Gerencie seus investimentos e movimentações</p>
                    </div>
                    <button
                        onClick={handleAddInvestment}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Novo Investimento
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <p className="text-slate-500 text-sm font-medium">Total Aplicado</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totals.totalDeposited)}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <p className="text-slate-500 text-sm font-medium">Total Resgatado</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totals.totalWithdrawn)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-blue-100 text-sm font-medium">Saldo Investido</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(totals.netInvested)}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <p className="text-slate-500 text-sm font-medium">Valor Atual</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totals.totalCurrentValue)}</p>
                    {totals.totalGain !== 0 && (
                        <p className={`text-sm mt-1 ${totals.totalGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {totals.totalGain >= 0 ? '+' : ''}{formatCurrency(totals.totalGain)} rendimento
                        </p>
                    )}
                </div>
            </div>

            {/* Investment List */}
            {investments.length > 0 ? (
                <div className="space-y-4">
                    {investments.map((investment) => (
                        <InvestmentCard
                            key={investment.id}
                            investment={investment}
                            isExpanded={expandedInvestmentId === investment.id}
                            expandedDetail={expandedInvestmentId === investment.id ? expandedDetail : null}
                            onToggleExpand={() => handleToggleExpand(investment)}
                            onEdit={() => handleEditInvestment(investment)}
                            onDelete={() => handleDeleteClick(investment)}
                            onAddMovement={() => handleAddMovement(investment)}
                            onUpdateCurrentValue={(value) => handleUpdateCurrentValue(investment.id, value)}
                            onDeleteMovement={(movementId) => handleDeleteMovement(investment.id, movementId)}
                        />
                    ))}
                </div>
            ) : (
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
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                    </svg>
                    <p className="text-slate-500 text-lg">Nenhum investimento cadastrado</p>
                    <p className="text-slate-400 text-sm mt-2">
                        Clique em "Novo Investimento" para começar a acompanhar seus investimentos
                    </p>
                </div>
            )}

            {institutionsConfig && (
                <InvestmentFormModal
                    isOpen={isInvestmentModalOpen}
                    onClose={() => setIsInvestmentModalOpen(false)}
                    onSave={handleSaveInvestment}
                    institutionsConfig={institutionsConfig}
                    investment={selectedInvestment}
                />
            )}

            {selectedInvestment && (
                <MovementFormModal
                    isOpen={isMovementModalOpen}
                    onClose={() => setIsMovementModalOpen(false)}
                    onSave={handleSaveMovement}
                    investmentId={selectedInvestment.id}
                    investmentName={selectedInvestment.name}
                />
            )}

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setInvestmentToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                transactionDescription={investmentToDelete?.name || ''}
                transactionAmount={investmentToDelete?.currentValue || 0}
            />
        </div>
    );
};
