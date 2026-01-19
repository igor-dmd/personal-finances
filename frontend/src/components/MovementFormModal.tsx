import React from 'react';
import { api } from '../lib/api';

interface MovementFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => Promise<void>;
    investmentId: number;
    investmentName: string;
}

export const MovementFormModal: React.FC<MovementFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    investmentId,
    investmentName
}) => {
    const [type, setType] = React.useState<'deposit' | 'withdrawal'>('deposit');
    const [date, setDate] = React.useState('');
    const [amount, setAmount] = React.useState<number>(0);
    const [description, setDescription] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);

    // Reset form when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setType('deposit');
            setDate(new Date().toISOString().split('T')[0]);
            setAmount(0);
            setDescription('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) {
            alert('O valor deve ser maior que zero');
            return;
        }

        setIsSaving(true);

        try {
            await api.createInvestmentMovement(investmentId, {
                type,
                date,
                amount,
                description: description.trim() || undefined
            });
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
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800">
                                Nova Movimentação
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">{investmentName}</p>
                        </div>
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
                        {/* Movement Type */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Tipo *
                            </label>
                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                    type === 'deposit'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="deposit"
                                        checked={type === 'deposit'}
                                        onChange={() => setType('deposit')}
                                        className="sr-only"
                                    />
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                    </svg>
                                    Aplicação
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                    type === 'withdrawal'
                                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="withdrawal"
                                        checked={type === 'withdrawal'}
                                        onChange={() => setType('withdrawal')}
                                        className="sr-only"
                                    />
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                    Resgate
                                </label>
                            </div>
                        </div>

                        {/* Date */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Data *
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Amount */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Valor *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={amount || ''}
                                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0,00"
                                    required
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Descrição (opcional)
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ex: Aporte mensal"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
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
                                disabled={isSaving || amount <= 0}
                                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                                    type === 'deposit'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                            >
                                {isSaving ? 'Salvando...' : type === 'deposit' ? 'Registrar Aplicação' : 'Registrar Resgate'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
