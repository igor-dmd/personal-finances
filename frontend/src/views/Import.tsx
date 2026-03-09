import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDate } from '../utils/date';
import { api, type ImportJob, type ParserType } from '../lib/api';

export const Import: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');
    const [jobs, setJobs] = useState<ImportJob[]>([]);
    const [isLoadingJobs, setIsLoadingJobs] = useState(false);
    const [confirmingId, setConfirmingId] = useState<number | null>(null);
    const [parserTypes, setParserTypes] = useState<ParserType[]>([]);
    const [selectedParser, setSelectedParser] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);

    const fetchJobs = async () => {
        setIsLoadingJobs(true);
        try {
            const data = await api.getImportJobs();
            setJobs(data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setIsLoadingJobs(false);
        }
    };

    useEffect(() => {
        const fetchParsers = async () => {
            try {
                const data = await api.getParserTypes();
                setParserTypes(data);
                if (data.length > 0) setSelectedParser(data[0].identifier);
            } catch (error) {
                console.error('Error fetching parsers:', error);
            }
        };

        fetchParsers();
        fetchJobs();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setMessage('Por favor, selecione um arquivo.');
            setStatus('error');
            return;
        }

        setStatus('uploading');
        setMessage('');

        try {
            const data = await api.uploadTransactionsFile(file, selectedParser);

            setStatus('success');
            setMessage(`${data.count} transações importadas com sucesso.`);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchJobs(); // Refresh the list

        } catch (error: any) {
            setStatus('error');
            setMessage(error.message);
        }
    };

    const handleDeleteJob = async (id: number) => {
        console.log(`[Import] Sending DELETE request for job ${id}`);
        setStatus('uploading');
        setMessage('Revertendo importação...');
        setConfirmingId(null);

        try {
            await api.deleteImportJob(id);
            console.log(`[Import] Job ${id} deleted successfully`);
            setMessage('Importação revertida com sucesso.');
            setStatus('success');
            fetchJobs();
        } catch (error: any) {
            console.error(`[Import] Error in handleDeleteJob for ${id}:`, error);
            setMessage(error.message);
            setStatus('error');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Importar Transações</h1>
                    <p className="text-slate-500">Faça o upload dos seus extratos bancários para acompanhar suas finanças.</p>
                </div>
                <button
                    onClick={() => historyRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors"
                >
                    Exibir Histórico ↓
                </button>
            </header>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Configuration Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Origem das Transações</label>
                            <select
                                value={selectedParser}
                                onChange={(e) => setSelectedParser(e.target.value)}
                                disabled={parserTypes.length === 0}
                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                            >
                                {parserTypes.map((parser) => (
                                    <option key={parser.identifier} value={parser.identifier}>
                                        {parser.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500">Selecione o tipo de arquivo que você está enviando.</p>
                        </div>

                    </div>

                    {/* File Upload Section */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer group ${file
                            ? 'border-indigo-500 bg-indigo-50/50'
                            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                            }`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".csv"
                            className="hidden"
                        />

                        <div className="flex flex-col items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110 ${file ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {file ? <FileText size={32} /> : <UploadCloud size={32} />}
                            </div>

                            {file ? (
                                <div>
                                    <p className="text-lg font-medium text-slate-900">{file.name}</p>
                                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-lg font-medium text-slate-900">Clique para fazer o upload ou arraste e solte</p>
                                    <p className="text-sm text-slate-500">Apenas arquivos CSV</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Feedback & Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex-1 mr-4">
                            {message && (
                                <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 shadow-sm ${status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    status === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                        'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}>
                                    {status === 'success' && <CheckCircle size={18} className="text-emerald-600" />}
                                    {status === 'error' && <AlertTriangle size={18} className="text-rose-600" />}
                                    {status === 'uploading' && <Loader2 size={18} className="animate-spin text-blue-600" />}
                                    {message}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!file || status === 'uploading'}
                            className={`px-8 py-3 rounded-xl font-medium text-white transition-all transform  ${!file || status === 'uploading'
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5'
                                }`}
                        >
                            {status === 'uploading' ? 'Importando...' : 'Confirmar Importação'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Import History Table */}
            <div ref={historyRef} className="mt-12 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-900">Histórico de Importação</h2>
                    {isLoadingJobs && <span className="text-sm text-slate-500 animate-pulse">Atualizando...</span>}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Arquivo</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Tipo</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Data e Hora</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {jobs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                                        Nenhuma importação ainda.
                                    </td>
                                </tr>
                            ) : (
                                jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">{job.filename}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                {job.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {formatDate(job.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                job.status === 'pending' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                    'bg-red-50 text-red-700 border border-red-100'
                                                }`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {confirmingId === job.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDeleteJob(job.id)}
                                                        className="text-red-600 hover:text-red-800 font-bold text-sm bg-red-50 px-2 py-1 rounded border border-red-200"
                                                    >
                                                        Confirmar
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmingId(null)}
                                                        className="text-slate-500 hover:text-slate-700 font-medium text-sm px-2 py-1"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmingId(job.id)}
                                                    className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                                                    title="Reverter Importação"
                                                >
                                                    Reverter
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
