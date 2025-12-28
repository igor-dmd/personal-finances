import React, { useState, useRef } from 'react';

export const Import: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            setMessage('Please select a file.');
            setStatus('error');
            return;
        }

        setStatus('uploading');
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'nubank-cc-bill-csv');
        formData.append('type', 'nubank-cc-bill-csv');

        try {
            const response = await fetch('http://localhost:3000/transactions/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setStatus('success');
            setMessage(`Successfully imported ${data.count} transactions.`);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (error: any) {
            setStatus('error');
            setMessage(error.message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Import Transactions</h1>
                <p className="text-slate-500">Upload your bank statements to track your finances.</p>
            </header>

            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Configuration Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Transaction Source</label>
                            <select
                                disabled
                                className="w-full bg-slate-50 border border-slate-300 text-slate-500 rounded-lg px-4 py-3 outline-none cursor-not-allowed"
                            >
                                <option>Nubank Bill (CSV)</option>
                            </select>
                            <p className="text-xs text-slate-500">Currently only Nubank CSV exports are supported.</p>
                        </div>

                    </div>

                    {/* File Upload Section */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer ${file
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
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
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 ${file ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {file ? '📄' : '📥'}
                            </div>

                            {file ? (
                                <div>
                                    <p className="text-lg font-medium text-slate-900">{file.name}</p>
                                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-lg font-medium text-slate-900">Click to upload or drag and drop</p>
                                    <p className="text-sm text-slate-500">CSV files only</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Feedback & Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex-1 mr-4">
                            {message && (
                                <div className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                                    status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                                        'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}>
                                    {status === 'success' && '✅'}
                                    {status === 'error' && '⚠️'}
                                    {status === 'uploading' && '⏳'}
                                    {message}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!file || status === 'uploading'}
                            className={`px-8 py-3 rounded-lg font-medium text-white transition-all transform hover:scale-105 active:scale-95 ${!file || status === 'uploading'
                                ? 'bg-slate-400 cursor-not-allowed opacity-75'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20'
                                }`}
                        >
                            {status === 'uploading' ? 'Importing...' : 'Confirm Import'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
