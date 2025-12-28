
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Transaction {
    id: number;
    date: string; // ISO string from JSON
    amount: number;
    description: string;
    originalDescription: string | null;
    accountName: string | null;
    categoryName: string | null;
}

export const api = {
    getTransactions: async (): Promise<Transaction[]> => {
        const response = await fetch(`${API_URL}/transactions`);
        if (!response.ok) {
            throw new Error('Failed to fetch transactions');
        }
        return response.json();
    }
};
