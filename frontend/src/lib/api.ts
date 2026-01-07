
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Transaction {
    id: number;
    date: string; // ISO string from JSON
    amount: number;
    description: string;
    originalDescription: string | null;
    accountName: string | null;
    categoryId: number | null;
    categoryName: string | null;
    type: 'credit_card' | 'checking' | string;
}

export interface Category {
    id: number;
    name: string;
    parentId: number | null;
}

export const api = {
    getTransactions: async (): Promise<Transaction[]> => {
        const response = await fetch(`${API_URL}/transactions`);
        if (!response.ok) {
            throw new Error('Failed to fetch transactions');
        }
        return response.json();
    },

    getCategories: async (): Promise<Category[]> => {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        return response.json();
    },

    createCategory: async (name: string): Promise<Category> => {
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });
        if (!response.ok) {
            throw new Error('Failed to create category');
        }
        return response.json();
    },

    updateCategory: async (id: number, name: string): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });
        if (!response.ok) {
            throw new Error('Failed to update category');
        }
        return response.json();
    },

    deleteCategory: async (id: number): Promise<{ message: string }> => {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete category');
        }
        return response.json();
    },

    updateTransaction: async (id: number, data: Partial<Transaction> & { categoryId?: number | null }): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update transaction');
        }
        return response.json();
    },

    getTransactionCountByDescription: async (description: string): Promise<{ count: number; description: string }> => {
        const response = await fetch(
            `${API_URL}/transactions/by-description/count?description=${encodeURIComponent(description)}`
        );
        if (!response.ok) {
            throw new Error('Failed to get transaction count');
        }
        return response.json();
    },

    bulkUpdateCategory: async (
        description: string,
        categoryId: number | null
    ): Promise<{ success: boolean; updatedCount: number }> => {
        const response = await fetch(`${API_URL}/transactions/by-description`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, categoryId }),
        });
        if (!response.ok) {
            throw new Error('Failed to bulk update categories');
        }
        return response.json();
    }
};
