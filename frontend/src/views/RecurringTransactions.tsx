import React from 'react';
import { api, type RecurringTransaction, type Category } from '../lib/api';
import { CategoryCombobox } from '../components/CategoryCombobox';

export const RecurringTransactions: React.FC = () => {
    const [recurringList, setRecurringList] = React.useState<RecurringTransaction[]>([]);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [deletingId, setDeletingId] = React.useState<number | null>(null);
    const [editingCategoryId, setEditingCategoryId] = React.useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);

    const loadRecurringTransactions = async () => {
        try {
            const [data, catData] = await Promise.all([
                api.getRecurringTransactions(),
                api.getCategories(),
            ]);
            setRecurringList(data);
            setCategories(catData);
        } catch (err) {
            console.error(err);
            setError('Failed to load recurring transactions');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadRecurringTransactions();
    }, []);

    const handleRemove = async (id: number) => {
        try {
            await api.removeRecurringTransaction(id);
            setDeletingId(null);
            setEditingCategoryId(null);
            await loadRecurringTransactions();
        } catch (err) {
            console.error(err);
            alert('Failed to remove recurring transaction');
        }
    };

    const handleEditCategory = (recurring: RecurringTransaction) => {
        setEditingCategoryId(recurring.id);
        setSelectedCategoryId(recurring.categoryId);
    };

    const handleSaveCategory = async (id: number) => {
        try {
            await api.updateRecurringTransactionCategory(id, selectedCategoryId);
            setEditingCategoryId(null);
            await loadRecurringTransactions();
        } catch (err) {
            console.error(err);
            alert('Failed to update category');
        }
    };

    const handleCancelEdit = () => {
        setEditingCategoryId(null);
        setSelectedCategoryId(null);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
    if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Transacoes Recorrentes</h2>
                <p className="text-slate-500 mt-1">
                    Gerencie suas despesas mensais fixas (aluguel, contas, assinaturas)
                </p>
            </div>

            {/* Recurring Transactions List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800">
                        Transacoes Recorrentes ({recurringList.length})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Descricao</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Categoria</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Valor Medio</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Ocorrencias</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Periodo</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Acoes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recurringList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">
                                        Nenhuma transacao recorrente cadastrada. Va para a pagina de Transacoes e clique no
                                        icone de "recorrente" em uma transacao para adiciona-la aqui.
                                    </td>
                                </tr>
                            ) : (
                                recurringList.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-900 font-medium">
                                                {item.description}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingCategoryId === item.id ? (
                                                <div className="flex items-center gap-2">
                                                    <CategoryCombobox
                                                        categories={categories}
                                                        selectedCategoryId={selectedCategoryId}
                                                        onSelect={setSelectedCategoryId}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleSaveCategory(item.id)}
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
                                                <span
                                                    onClick={() => handleEditCategory(item)}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 cursor-pointer hover:bg-slate-200 transition-colors"
                                                >
                                                    {item.categoryName || 'Sem Categoria'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600">
                                                {formatCurrency(item.averageAmount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                {item.occurrenceCount}x
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-slate-500">
                                                {formatDate(item.firstSeenDate)} - {formatDate(item.lastSeenDate)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {deletingId === item.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleRemove(item.id)}
                                                        className="text-red-600 hover:text-red-800 font-bold text-sm bg-red-50 px-3 py-1 rounded border border-red-200"
                                                    >
                                                        Confirmar
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingId(null)}
                                                        className="text-slate-500 hover:text-slate-700 font-medium text-sm px-3 py-1"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeletingId(item.id)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                                                >
                                                    Remover
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
