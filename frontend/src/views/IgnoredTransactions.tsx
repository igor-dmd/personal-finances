import React from 'react';
import { api, type IgnoredDescription } from '../lib/api';

export const IgnoredTransactions: React.FC = () => {
    const [ignoredList, setIgnoredList] = React.useState<IgnoredDescription[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [deletingId, setDeletingId] = React.useState<number | null>(null);

    const loadIgnoredDescriptions = async () => {
        try {
            const data = await api.getIgnoredDescriptions();
            setIgnoredList(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load ignored descriptions');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadIgnoredDescriptions();
    }, []);

    const handleRemove = async (id: number) => {
        try {
            await api.removeIgnoredDescription(id);
            setDeletingId(null);
            await loadIgnoredDescriptions();
        } catch (err) {
            console.error(err);
            alert('Failed to remove ignored description');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
    if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Transacoes Ignoradas</h2>
                <p className="text-slate-500 mt-1">
                    Transacoes com essas descricoes serao ocultadas da lista principal e excluidas dos resumos
                </p>
            </div>

            {/* Ignored Descriptions List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800">
                        Descricoes Ignoradas ({ignoredList.length})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Descricao</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Adicionada em</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Acoes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ignoredList.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic">
                                        Nenhuma descricao ignorada. Va para a pagina de Transacoes e clique no
                                        icone de "ignorar" em uma transacao para adiciona-la aqui.
                                    </td>
                                </tr>
                            ) : (
                                ignoredList.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-900 font-medium">
                                                {item.description}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-500">
                                                {formatDate(item.createdAt)}
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
                                                    Restaurar
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
