import React from 'react';
import { api } from '../lib/api';
import type { Category } from '../lib/api';

export const Categories: React.FC = () => {
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = React.useState('');
    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [editingName, setEditingName] = React.useState('');
    const [deletingId, setDeletingId] = React.useState<number | null>(null);

    const loadCategories = async () => {
        try {
            const data = await api.getCategories();
            setCategories(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadCategories();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            await api.createCategory(newCategoryName.trim());
            setNewCategoryName('');
            await loadCategories();
        } catch (err) {
            console.error(err);
            alert('Failed to create category');
        }
    };

    const handleStartEdit = (category: Category) => {
        setEditingId(category.id);
        setEditingName(category.name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleSaveEdit = async (id: number) => {
        if (!editingName.trim()) return;

        try {
            await api.updateCategory(id, editingName.trim());
            setEditingId(null);
            setEditingName('');
            await loadCategories();
        } catch (err) {
            console.error(err);
            alert('Failed to update category');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.deleteCategory(id);
            setDeletingId(null);
            await loadCategories();
        } catch (err) {
            console.error(err);
            alert('Failed to delete category');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading categories...</div>;
    if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Categories</h2>
                <p className="text-slate-500 mt-1">Manage your transaction categories</p>
            </div>

            {/* Add Category Form */}
            <div className="mb-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Category</h3>
                <form onSubmit={handleCreate} className="flex gap-3">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        type="submit"
                        disabled={!newCategoryName.trim()}
                        className={`px-6 py-2 rounded-lg font-medium text-white transition-all ${
                            !newCategoryName.trim()
                                ? 'bg-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        Add Category
                    </button>
                </form>
            </div>

            {/* Categories List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800">All Categories</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Name</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {categories.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-10 text-center text-slate-400 italic">
                                        No categories yet. Create one above!
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            {editingId === category.id ? (
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    className="px-3 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="text-sm text-slate-900 font-medium">
                                                    {category.name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {editingId === category.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleSaveEdit(category.id)}
                                                        disabled={!editingName.trim() || editingName === category.name}
                                                        className={`text-sm px-3 py-1 rounded ${
                                                            !editingName.trim() || editingName === category.name
                                                                ? 'text-slate-400 cursor-not-allowed'
                                                                : 'text-green-600 hover:text-green-800 bg-green-50 border border-green-200'
                                                        }`}
                                                    >
                                                        ✓ Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="text-sm px-3 py-1 text-slate-500 hover:text-slate-700"
                                                    >
                                                        ✕ Cancel
                                                    </button>
                                                </div>
                                            ) : deletingId === category.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDelete(category.id)}
                                                        className="text-red-600 hover:text-red-800 font-bold text-sm bg-red-50 px-3 py-1 rounded border border-red-200"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingId(null)}
                                                        className="text-slate-500 hover:text-slate-700 font-medium text-sm px-3 py-1"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => handleStartEdit(category)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingId(category.id)}
                                                        className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
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
