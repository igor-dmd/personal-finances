
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
    type: 'credit_card' | 'checking' | 'investment' | string;
    installmentGroupId: number | null;
    installmentNumber: number | null;
    isInvestment: boolean;
}

export interface Category {
    id: number;
    name: string;
    parentId: number | null;
}

export interface Account {
    id: number;
    name: string;
    type: 'bank' | 'credit_card' | 'checking';
    currency: string;
}

export interface CreateTransactionData {
    institutionId: string;
    categoryId: number | null;
    date: string; // ISO string
    amount: number;
    description: string;
    type: 'credit_card' | 'checking' | 'investment';
    isInvestment?: boolean;
}

export interface InstallmentGroup {
    id: number;
    description: string;
    totalInstallments: number;
    totalAmount: number;
    paidInstallments: number;
    paidAmount: number;
    remainingAmount: number;
    createdAt: string;
}

export interface FutureInstallment {
    installmentNumber: number;
    dueDate: string | null;
    amount: number;
}

export interface InstallmentGroupDetail extends InstallmentGroup {
    transactions: Transaction[];
    futureInstallments: FutureInstallment[];
}

export interface CreateInstallmentData {
    description: string;
    totalInstallments: number;
    totalAmount: number;
    firstInstallmentDate: string;
    institutionId: string;
    type: 'credit_card' | 'checking' | 'investment';
    categoryId?: number | null;
}

export interface InstitutionConfig {
    id: string;
    name: string;
    accountTypes: ('credit_card' | 'checking' | 'investment')[];
}

export interface InstitutionsConfig {
    institutions: InstitutionConfig[];
    accountTypeLabels: Record<string, string>;
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
    },

    getAccounts: async (): Promise<Account[]> => {
        const response = await fetch(`${API_URL}/transactions/accounts`);
        if (!response.ok) {
            throw new Error('Failed to fetch accounts');
        }
        return response.json();
    },

    getInstitutionsConfig: async (): Promise<InstitutionsConfig> => {
        const response = await fetch(`${API_URL}/transactions/institutions-config`);
        if (!response.ok) {
            throw new Error('Failed to fetch institutions config');
        }
        return response.json();
    },

    createTransaction: async (data: CreateTransactionData): Promise<{ success: boolean; transaction: Transaction }> => {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create transaction');
        }
        return response.json();
    },

    deleteTransaction: async (id: number): Promise<{ success: boolean; message: string }> => {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete transaction');
        }
        return response.json();
    },

    // Installment methods
    getInstallments: async (): Promise<InstallmentGroup[]> => {
        const response = await fetch(`${API_URL}/installments`);
        if (!response.ok) {
            throw new Error('Failed to fetch installments');
        }
        return response.json();
    },

    getInstallmentDetail: async (id: number): Promise<InstallmentGroupDetail> => {
        const response = await fetch(`${API_URL}/installments/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch installment detail');
        }
        return response.json();
    },

    createInstallment: async (data: CreateInstallmentData): Promise<{ success: boolean; groupId: number; created: number }> => {
        const response = await fetch(`${API_URL}/installments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create installment');
        }
        return response.json();
    },

    updateInstallment: async (id: number, data: Partial<InstallmentGroup>): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_URL}/installments/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update installment');
        }
        return response.json();
    },

    deleteInstallment: async (id: number): Promise<{ success: boolean; message: string }> => {
        const response = await fetch(`${API_URL}/installments/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete installment');
        }
        return response.json();
    }
};
