import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CategoryCombobox, type Category } from './CategoryCombobox';
import userEvent from '@testing-library/user-event';

describe('CategoryCombobox', () => {
    const mockCategories: Category[] = [
        { id: 1, name: 'Food', parentId: null },
        { id: 2, name: 'Transport', parentId: null },
        { id: 3, name: 'Entertainment', parentId: null },
    ];

    it('renders input with placeholder', () => {
        const onSelect = vi.fn();
        render(
            <CategoryCombobox
                categories={mockCategories}
                selectedCategoryId={null}
                onSelect={onSelect}
            />
        );

        expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument();
    });

    it('shows selected category name in input', () => {
        const onSelect = vi.fn();
        render(
            <CategoryCombobox
                categories={mockCategories}
                selectedCategoryId={1}
                onSelect={onSelect}
            />
        );

        const input = screen.getByPlaceholderText('Search categories...') as HTMLInputElement;
        expect(input.value).toBe('Food');
    });

    it('opens dropdown on input focus', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(
            <CategoryCombobox
                categories={mockCategories}
                selectedCategoryId={null}
                onSelect={onSelect}
            />
        );

        const input = screen.getByPlaceholderText('Search categories...');
        await user.click(input);

        await waitFor(() => {
            expect(screen.getByText('Uncategorized')).toBeInTheDocument();
            expect(screen.getByText('Food')).toBeInTheDocument();
            expect(screen.getByText('Transport')).toBeInTheDocument();
            expect(screen.getByText('Entertainment')).toBeInTheDocument();
        });
    });

    it('filters categories as user types', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(
            <CategoryCombobox
                categories={mockCategories}
                selectedCategoryId={null}
                onSelect={onSelect}
            />
        );

        const input = screen.getByPlaceholderText('Search categories...');
        await user.click(input);
        await user.type(input, 'foo');

        await waitFor(() => {
            expect(screen.getByText('Food')).toBeInTheDocument();
            expect(screen.queryByText('Transport')).not.toBeInTheDocument();
            expect(screen.queryByText('Entertainment')).not.toBeInTheDocument();
        });
    });

    it('shows all categories when input is empty', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(
            <CategoryCombobox
                categories={mockCategories}
                selectedCategoryId={null}
                onSelect={onSelect}
            />
        );

        const input = screen.getByPlaceholderText('Search categories...');
        await user.click(input);

        await waitFor(() => {
            expect(screen.getByText('Uncategorized')).toBeInTheDocument();
            expect(screen.getByText('Food')).toBeInTheDocument();
            expect(screen.getByText('Transport')).toBeInTheDocument();
            expect(screen.getByText('Entertainment')).toBeInTheDocument();
        });
    });

    it('selects category on click', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(
            <CategoryCombobox
                categories={mockCategories}
                selectedCategoryId={null}
                onSelect={onSelect}
            />
        );

        const input = screen.getByPlaceholderText('Search categories...');
        await user.click(input);

        const foodOption = await screen.findByText('Food');
        await user.click(foodOption);

        expect(onSelect).toHaveBeenCalledWith(1);
    });

    it('selects null for Uncategorized', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(
            <CategoryCombobox
                categories={mockCategories}
                selectedCategoryId={1}
                onSelect={onSelect}
            />
        );

        const input = screen.getByPlaceholderText('Search categories...');
        await user.click(input);

        const uncategorizedOption = await screen.findByText('Uncategorized');
        await user.click(uncategorizedOption);

        expect(onSelect).toHaveBeenCalledWith(null);
    });

    it('closes dropdown on Escape key', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(
            <CategoryCombobox
                categories={mockCategories}
                selectedCategoryId={null}
                onSelect={onSelect}
            />
        );

        const input = screen.getByPlaceholderText('Search categories...');
        await user.click(input);

        await waitFor(() => {
            expect(screen.getByText('Food')).toBeInTheDocument();
        });

        fireEvent.keyDown(input, { key: 'Escape' });

        await waitFor(() => {
            expect(screen.queryByText('Food')).not.toBeInTheDocument();
        });
    });

    it('navigates with arrow keys and selects with Enter', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(
            <CategoryCombobox
                categories={mockCategories}
                selectedCategoryId={null}
                onSelect={onSelect}
            />
        );

        const input = screen.getByPlaceholderText('Search categories...');
        await user.click(input);

        await waitFor(() => {
            expect(screen.getByText('Uncategorized')).toBeInTheDocument();
        });

        // Press ArrowDown to move to Food (index 1)
        fireEvent.keyDown(input, { key: 'ArrowDown' });

        // Press Enter to select
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onSelect).toHaveBeenCalledWith(1);
    });

    it('respects disabled state', () => {
        const onSelect = vi.fn();
        render(
            <CategoryCombobox
                categories={mockCategories}
                selectedCategoryId={null}
                onSelect={onSelect}
                disabled={true}
            />
        );

        const input = screen.getByPlaceholderText('Search categories...') as HTMLInputElement;
        expect(input.disabled).toBe(true);
    });

    it('closes dropdown on click outside', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(
            <div>
                <CategoryCombobox
                    categories={mockCategories}
                    selectedCategoryId={null}
                    onSelect={onSelect}
                />
                <div data-testid="outside">Outside</div>
            </div>
        );

        const input = screen.getByPlaceholderText('Search categories...');
        await user.click(input);

        await waitFor(() => {
            expect(screen.getByText('Food')).toBeInTheDocument();
        });

        const outside = screen.getByTestId('outside');
        fireEvent.mouseDown(outside);

        await waitFor(() => {
            expect(screen.queryByText('Food')).not.toBeInTheDocument();
        });
    });

    it('shows only Uncategorized when filter returns no matching categories', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(
            <CategoryCombobox
                categories={mockCategories}
                selectedCategoryId={null}
                onSelect={onSelect}
            />
        );

        const input = screen.getByPlaceholderText('Search categories...');
        await user.click(input);
        await user.type(input, 'xyz');

        await waitFor(() => {
            // Uncategorized is always shown
            expect(screen.getByText('Uncategorized')).toBeInTheDocument();
            // But no other categories should be visible
            expect(screen.queryByText('Food')).not.toBeInTheDocument();
            expect(screen.queryByText('Transport')).not.toBeInTheDocument();
            expect(screen.queryByText('Entertainment')).not.toBeInTheDocument();
        });
    });
});
