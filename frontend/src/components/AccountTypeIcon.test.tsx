import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AccountTypeIcon } from './AccountTypeIcon';

describe('AccountTypeIcon', () => {
    it('renders credit card icon for credit_card type', () => {
        const { container } = render(<AccountTypeIcon type="credit_card" />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute('aria-label', 'Cartão de Crédito');
        expect(svg).toHaveClass('text-purple-500');
    });

    it('renders checking account icon for checking type', () => {
        const { container } = render(<AccountTypeIcon type="checking" />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute('aria-label', 'Conta Corrente');
        expect(svg).toHaveClass('text-blue-500');
    });

    it('renders nothing for unknown type', () => {
        const { container } = render(<AccountTypeIcon type="unknown" />);
        expect(container.firstChild).toBeNull();
    });

    it('applies custom className', () => {
        const { container } = render(<AccountTypeIcon type="credit_card" className="h-6 w-6" />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveClass('h-6', 'w-6');
    });
});
