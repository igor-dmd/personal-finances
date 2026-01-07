import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl';
import userEvent from '@testing-library/user-event';

describe('SegmentedControl', () => {
    const options = [
        { value: 'all', label: 'All' },
        { value: 'income', label: 'Income' },
        { value: 'expenses', label: 'Expenses' }
    ] as const;

    it('renders all options', () => {
        const onChange = vi.fn();
        render(
            <SegmentedControl
                options={[...options]}
                value="all"
                onChange={onChange}
            />
        );

        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('Income')).toBeInTheDocument();
        expect(screen.getByText('Expenses')).toBeInTheDocument();
    });

    it('highlights the active option', () => {
        const onChange = vi.fn();
        render(
            <SegmentedControl
                options={[...options]}
                value="income"
                onChange={onChange}
            />
        );

        const incomeButton = screen.getByText('Income');
        const allButton = screen.getByText('All');

        expect(incomeButton).toHaveClass('bg-white', 'text-slate-900');
        expect(allButton).toHaveClass('text-slate-500');
    });

    it('calls onChange when clicking an option', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <SegmentedControl
                options={[...options]}
                value="all"
                onChange={onChange}
            />
        );

        await user.click(screen.getByText('Expenses'));

        expect(onChange).toHaveBeenCalledWith('expenses');
    });

    it('calls onChange when clicking the current option', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <SegmentedControl
                options={[...options]}
                value="all"
                onChange={onChange}
            />
        );

        await user.click(screen.getByText('All'));

        expect(onChange).toHaveBeenCalledWith('all');
    });
});
