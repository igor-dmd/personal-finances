import React from 'react';
import { api } from '../lib/api';
import type { Investment, InvestmentType, InstitutionsConfig } from '../lib/api';

const INVESTMENT_TYPES: { value: InvestmentType; label: string; group: string }[] = [
    { value: 'RDB', label: 'RDB', group: 'Renda Fixa Privada' },
    { value: 'CDB', label: 'CDB', group: 'Renda Fixa Privada' },
    { value: 'LCI', label: 'LCI', group: 'Renda Fixa Privada' },
    { value: 'LCA', label: 'LCA', group: 'Renda Fixa Privada' },
    { value: 'Tesouro Direto', label: 'Tesouro Direto', group: 'Tesouro' },
    { value: 'Tesouro Selic', label: 'Tesouro Selic', group: 'Tesouro' },
    { value: 'Tesouro IPCA+', label: 'Tesouro IPCA+', group: 'Tesouro' },
    { value: 'Tesouro Prefixado', label: 'Tesouro Prefixado', group: 'Tesouro' },
    { value: 'Outros', label: 'Outros', group: 'Outros' },
];

interface InvestmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => Promise<void>;
    institutionsConfig: InstitutionsConfig;
    investment?: Investment | null;
}

export const InvestmentFormModal: React.FC<InvestmentFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    institutionsConfig,
    investment
}) => {
    const isEditMode = !!investment;

    const [institutionId, setInstitutionId] = React.useState('');
    const [type, setType] = React.useState<InvestmentType>('CDB');
    const [name, setName] = React.useState('');
    const [currentValue, setCurrentValue] = React.useState<number>(0);
    const [isSaving, setIsSaving] = React.useState(false);

    // Filter institutions that support investments
    const investmentInstitutions = React.useMemo(
        () => institutionsConfig.institutions.filter(
            inst => inst.accountTypes.includes('investment')
        ),
        [institutionsConfig.institutions]
    );

    // Reset form when modal opens
    React.useEffect(() => {
        if (isOpen) {
            if (investment) {
                // Edit mode - populate from investment
                // Try to find institution from accountName
                const matchingInst = investmentInstitutions.find(
                    inst => investment.accountName?.includes(inst.name)
                );
                setInstitutionId(matchingInst?.id || investmentInstitutions[0]?.id || '');
                setType(investment.type);
                setName(investment.name);
                setCurrentValue(investment.currentValue);
            } else {
                // Create mode - reset to defaults
                setInstitutionId(investmentInstitutions[0]?.id || '');
                setType('CDB');
                setName('');
                setCurrentValue(0);
            }
        }
    }, [isOpen, investment, investmentInstitutions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (isEditMode && investment) {
                await api.updateInvestment(investment.id, {
                    name,
                    type,
                    currentValue
                });
            } else {
                await api.createInvestment({
                    institutionId,
                    type,
                    name,
                    currentValue
                });
            }
            await onSave();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={onClose} />

                <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle bg-white rounded-xl shadow-xl transform transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-slate-800">
                            {isEditMode ? 'Editar Investimento' : 'Novo Investimento'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Institution - only in create mode */}
                        {!isEditMode && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Instituição *
                                </label>
                                <select
                                    value={institutionId}
                                    onChange={(e) => setInstitutionId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    {investmentInstitutions.map((inst) => (
                                        <option key={inst.id} value={inst.id}>
                                            {inst.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Investment Type */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Tipo de Investimento *
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as InvestmentType)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <optgroup label="Renda Fixa Privada">
                                    {INVESTMENT_TYPES.filter(t => t.group === 'Renda Fixa Privada').map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Tesouro">
                                    {INVESTMENT_TYPES.filter(t => t.group === 'Tesouro').map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Outros">
                                    {INVESTMENT_TYPES.filter(t => t.group === 'Outros').map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {/* Name */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Nome / Descrição *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: CDB Nubank 110% CDI"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Current Value */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Valor Atual
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={currentValue}
                                    onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Você pode atualizar este valor posteriormente
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || !name.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Salvando...' : isEditMode ? 'Salvar' : 'Criar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
