
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
    isIgnored: boolean;
    isRecurring: boolean;
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

export interface ParserType {
    name: string;
    identifier: string;
    transactionType?: string;
}

export interface ImportJob {
    id: number;
    filename: string;
    type: string;
    status: string;
    createdAt: string;
}

// Investment types
export type InvestmentType =
    | 'RDB' | 'CDB' | 'LCI' | 'LCA'
    | 'Tesouro Direto' | 'Tesouro Selic' | 'Tesouro IPCA+' | 'Tesouro Prefixado'
    | 'Outros';

export interface Investment {
    id: number;
    accountId: number;
    accountName: string | null;
    type: InvestmentType;
    name: string;
    currentValue: number;
    totalDeposited: number;
    totalWithdrawn: number;
    netInvested: number;
    gain: number;
    createdAt: string;
    updatedAt: string;
}

export interface InvestmentMovement {
    id: number;
    investmentId: number;
    type: 'deposit' | 'withdrawal';
    date: string;
    amount: number;
    description: string | null;
    createdAt: string;
}

export interface InvestmentDetail extends Investment {
    movements: InvestmentMovement[];
}

export interface CreateInvestmentData {
    institutionId: string;
    type: InvestmentType;
    name: string;
    currentValue?: number;
}

export interface CreateMovementData {
    type: 'deposit' | 'withdrawal';
    date: string;
    amount: number;
    description?: string;
}

export interface IgnoredDescription {
    id: number;
    description: string;
    createdAt: string;
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

    getParserTypes: async (): Promise<ParserType[]> => {
        const response = await fetch(`${API_URL}/transactions/parser-types`);
        if (!response.ok) {
            throw new Error('Failed to fetch parser types');
        }
        return response.json();
    },

    uploadTransactionsFile: async (
        file: File,
        parserType: string
    ): Promise<{ message: string; count: number; jobId: number }> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', parserType);

        const response = await fetch(`${API_URL}/transactions/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to upload transactions');
        }

        return data;
    },

    getImportJobs: async (): Promise<ImportJob[]> => {
        const response = await fetch(`${API_URL}/import-jobs`);
        if (!response.ok) {
            throw new Error('Failed to fetch import jobs');
        }
        return response.json();
    },

    deleteImportJob: async (id: number): Promise<{ message?: string }> => {
        const response = await fetch(`${API_URL}/import-jobs/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to delete import job');
        }
        const contentType = response.headers?.get?.('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json().catch(() => ({}));
        }
        return {};
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
    },

    // Investment methods
    getInvestments: async (): Promise<Investment[]> => {
        const response = await fetch(`${API_URL}/investments`);
        if (!response.ok) {
            throw new Error('Failed to fetch investments');
        }
        return response.json();
    },

    getInvestmentDetail: async (id: number): Promise<InvestmentDetail> => {
        const response = await fetch(`${API_URL}/investments/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch investment detail');
        }
        return response.json();
    },

    getInvestmentTypes: async (): Promise<InvestmentType[]> => {
        const response = await fetch(`${API_URL}/investments/types`);
        if (!response.ok) {
            throw new Error('Failed to fetch investment types');
        }
        return response.json();
    },

    createInvestment: async (data: CreateInvestmentData): Promise<{ success: boolean; investment: Investment }> => {
        const response = await fetch(`${API_URL}/investments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create investment');
        }
        return response.json();
    },

    updateInvestment: async (id: number, data: Partial<{ name: string; type: InvestmentType; currentValue: number }>): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_URL}/investments/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update investment');
        }
        return response.json();
    },

    deleteInvestment: async (id: number): Promise<{ success: boolean; message: string }> => {
        const response = await fetch(`${API_URL}/investments/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete investment');
        }
        return response.json();
    },

    // Investment movement methods
    createInvestmentMovement: async (investmentId: number, data: CreateMovementData): Promise<{ success: boolean; movement: InvestmentMovement }> => {
        const response = await fetch(`${API_URL}/investments/${investmentId}/movements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create movement');
        }
        return response.json();
    },

    updateInvestmentMovement: async (investmentId: number, movementId: number, data: Partial<CreateMovementData>): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_URL}/investments/${investmentId}/movements/${movementId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update movement');
        }
        return response.json();
    },

    deleteInvestmentMovement: async (investmentId: number, movementId: number): Promise<{ success: boolean; message: string }> => {
        const response = await fetch(`${API_URL}/investments/${investmentId}/movements/${movementId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete movement');
        }
        return response.json();
    },

    // Ignored transactions methods
    getIgnoredDescriptions: async (): Promise<IgnoredDescription[]> => {
        const response = await fetch(`${API_URL}/ignored-transactions`);
        if (!response.ok) throw new Error('Failed to fetch ignored descriptions');
        return response.json();
    },

    previewIgnoreDescription: async (description: string) => {
        const response = await fetch(
            `${API_URL}/ignored-transactions/preview?description=${encodeURIComponent(description)}`
        );
        if (!response.ok) throw new Error('Failed to preview ignore');
        return response.json();
    },

    addIgnoredDescription: async (description: string) => {
        const response = await fetch(`${API_URL}/ignored-transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description }),
        });
        if (!response.ok) throw new Error('Failed to add ignored description');
        return response.json();
    },

    removeIgnoredDescription: async (id: number) => {
        const response = await fetch(`${API_URL}/ignored-transactions/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to remove ignored description');
        return response.json();
    },

    // Recurring transactions methods
    getRecurringTransactions: async (): Promise<RecurringTransaction[]> => {
        const response = await fetch(`${API_URL}/recurring-transactions`);
        if (!response.ok) throw new Error('Failed to fetch recurring transactions');
        return response.json();
    },

    previewRecurring: async (description: string): Promise<RecurringPreview & { description: string }> => {
        const response = await fetch(
            `${API_URL}/recurring-transactions/preview?description=${encodeURIComponent(description)}`
        );
        if (!response.ok) throw new Error('Failed to preview recurring');
        return response.json();
    },

    addRecurringTransaction: async (description: string, categoryId?: number | null): Promise<{
        success: boolean;
        id: number;
        description: string;
        markedCount: number;
        averageAmount: number;
        occurrenceCount: number;
    }> => {
        const response = await fetch(`${API_URL}/recurring-transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, categoryId }),
        });
        if (!response.ok) throw new Error('Failed to add recurring transaction');
        return response.json();
    },

    updateRecurringTransactionCategory: async (id: number, categoryId: number | null): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_URL}/recurring-transactions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryId }),
        });
        if (!response.ok) throw new Error('Failed to update recurring transaction');
        return response.json();
    },

    removeRecurringTransaction: async (id: number): Promise<{
        success: boolean;
        unmarkedCount: number;
        description: string;
    }> => {
        const response = await fetch(`${API_URL}/recurring-transactions/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to remove recurring transaction');
        return response.json();
    },

    // Future planning methods
    getFuturePlanning: async (months: number = 6): Promise<FuturePlanningData> => {
        const response = await fetch(`${API_URL}/future-planning?months=${months}`);
        if (!response.ok) throw new Error('Failed to fetch future planning data');
        return response.json();
    }
};

// Recurring transactions types
export interface RecurringTransaction {
    id: number;
    description: string;
    categoryId: number | null;
    categoryName: string | null;
    averageAmount: number;
    occurrenceCount: number;
    firstSeenDate: string | null;
    lastSeenDate: string | null;
    createdAt: string;
}

export interface RecurringPreview {
    count: number;
    averageAmount: number;
    isRecurring: boolean;
    suggestedCategoryId: number | null;
}

export interface FuturePlanningData {
    futureInstallments: FuturePlanningInstallment[];
    recurringExpenses: RecurringExpense[];
    monthlyTotals: MonthlyTotal[];
}

export interface FuturePlanningInstallment {
    groupId: number;
    description: string;
    installmentNumber: number;
    dueDate: string | null;
    amount: number;
    remainingInstallments: number;
}

export interface RecurringExpense {
    id: number;
    description: string;
    categoryName: string | null;
    averageAmount: number;
}

export interface MonthlyTotal {
    year: number;
    month: number;
    recurringTotal: number;
    installmentTotal: number;
}
