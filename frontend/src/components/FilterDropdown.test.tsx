import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { FilterDropdown } from './FilterDropdown';

describe('FilterDropdown', () => {
    const mockOptions = [
        { value: 'all', label: 'Todos' },
        { value: 'option1', label: 'Opção 1' },
        { value: 'option2', label: 'Opção 2' }
    ];

    it('renders with label and selected value', () => {
        render(
            <FilterDropdown
                label="Filtro"
                options={mockOptions}
                value="all"
                onChange={vi.fn()}
            />
        );

        expect(screen.getByText('Filtro:')).toBeInTheDocument();
        expect(screen.getByText('Todos')).toBeInTheDocument();
    });

    it('opens dropdown when clicked', async () => {
        const user = userEvent.setup();
        render(
            <FilterDropdown
                label="Filtro"
                options={mockOptions}
                value="all"
                onChange={vi.fn()}
            />
        );

        const button = screen.getByRole('button');
        await user.click(button);

        expect(screen.getByText('Opção 1')).toBeInTheDocument();
        expect(screen.getByText('Opção 2')).toBeInTheDocument();
    });

    it('calls onChange when option is selected', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <FilterDropdown
                label="Filtro"
                options={mockOptions}
                value="all"
                onChange={onChange}
            />
        );

        const button = screen.getByRole('button');
        await user.click(button);

        const option = screen.getByText('Opção 1');
        await user.click(option);

        expect(onChange).toHaveBeenCalledWith('option1');
    });

    it('closes dropdown after selection', async () => {
        const user = userEvent.setup();
        render(
            <FilterDropdown
                label="Filtro"
                options={mockOptions}
                value="all"
                onChange={vi.fn()}
            />
        );

        const button = screen.getByRole('button');
        await user.click(button);

        expect(screen.getByText('Opção 1')).toBeInTheDocument();

        const option = screen.getByText('Opção 1');
        await user.click(option);

        expect(screen.queryByText('Opção 2')).not.toBeInTheDocument();
    });

    it('highlights selected option', async () => {
        const user = userEvent.setup();
        render(
            <FilterDropdown
                label="Filtro"
                options={mockOptions}
                value="option1"
                onChange={vi.fn()}
            />
        );

        const button = screen.getByRole('button');
        await user.click(button);

        const selectedButton = screen.getAllByRole('button').find(btn => btn.textContent === 'Opção 1');
        expect(selectedButton).toHaveClass('bg-blue-50', 'text-blue-700');
    });

    it('handles null values', () => {
        const optionsWithNull = [
            { value: null, label: 'Nenhum' },
            ...mockOptions
        ];

        render(
            <FilterDropdown
                label="Filtro"
                options={optionsWithNull}
                value={null}
                onChange={vi.fn()}
            />
        );

        expect(screen.getByText('Nenhum')).toBeInTheDocument();
    });
});
