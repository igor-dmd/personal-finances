import React from 'react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    transactionDescription: string;
    transactionAmount: number;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    transactionDescription,
    transactionAmount,
}) => {
    const [loading, setLoading] = React.useState(false);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(Math.abs(value));
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-rose-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Excluir Transação</h3>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-slate-600 mb-4">
                            Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
                        </p>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <p className="text-sm font-medium text-slate-700">
                                {transactionDescription}
                            </p>
                            <p className={`text-sm font-semibold mt-1 ${transactionAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatCurrency(transactionAmount)}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Excluindo...' : 'Excluir'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
