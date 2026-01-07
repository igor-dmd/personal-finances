import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TransactionStats } from './TransactionStats';

describe('TransactionStats', () => {
    it('calculates and displays income correctly', () => {
        const transactions = [
            { amount: 1000 },
            { amount: 500 },
            { amount: -200 }
        ];

        render(<TransactionStats transactions={transactions} />);

        // Income should be 1500 (1000 + 500)
        expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
    });

    it('calculates and displays expenses correctly', () => {
        const transactions = [
            { amount: -200 },
            { amount: -350 }
        ];

        render(<TransactionStats transactions={transactions} />);

        // Expenses should be 550 (200 + 350), and balance should be -550
        // Since both are unique values (R$ 550,00 only appears once for expenses)
        expect(screen.getByText('R$ 550,00')).toBeInTheDocument();
    });

    it('calculates and displays balance correctly', () => {
        const transactions = [
            { amount: 1000 },
            { amount: -400 }
        ];

        render(<TransactionStats transactions={transactions} />);

        // Balance should be 600 (1000 - 400)
        expect(screen.getByText('R$ 600,00')).toBeInTheDocument();
    });

    it('displays zero values when there are no transactions', () => {
        render(<TransactionStats transactions={[]} />);

        const zeroValues = screen.getAllByText('R$ 0,00');
        expect(zeroValues).toHaveLength(3);
    });

    it('displays correct labels', () => {
        render(<TransactionStats transactions={[]} />);

        expect(screen.getByText('Receitas')).toBeInTheDocument();
        expect(screen.getByText('Despesas')).toBeInTheDocument();
        expect(screen.getByText('Saldo')).toBeInTheDocument();
    });
});
