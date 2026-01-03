import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { Categories } from './Categories';
import type { Category } from '../lib/api';

// Mock fetch
globalThis.fetch = vi.fn();

describe('Categories Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock for fetchCategories on mount
        (globalThis.fetch as Mock).mockResolvedValue({
            ok: true,
            json: async () => []
        });
    });

    it('renders the categories section', async () => {
        render(<Categories />);

        await waitFor(() => {
            expect(screen.getByText('Categories')).toBeInTheDocument();
            expect(screen.getByText('Manage your transaction categories')).toBeInTheDocument();
            expect(screen.getByText('Add New Category')).toBeInTheDocument();
        });
    });

    it('fetches and displays categories on mount', async () => {
        const mockCategories: Category[] = [
            { id: 1, name: 'Food', parentId: null },
            { id: 2, name: 'Transport', parentId: null }
        ];

        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories
        });

        render(<Categories />);

        await waitFor(() => {
            expect(screen.getByText('Food')).toBeInTheDocument();
            expect(screen.getByText('Transport')).toBeInTheDocument();
        });
    });

    it('allows creating a new category', async () => {
        // Initial empty list
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        render(<Categories />);

        await waitFor(() => {
            expect(screen.getByText('No categories yet. Create one above!')).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText('Category name');
        const addButton = screen.getByText('Add Category');

        // Type new category name
        fireEvent.change(input, { target: { value: 'Health' } });

        // Mock successful create
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 1, name: 'Health', parentId: null })
        });

        // Mock refresh fetch
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: 1, name: 'Health', parentId: null }]
        });

        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByText('Health')).toBeInTheDocument();
        });

        // Verify input was cleared
        expect(input).toHaveValue('');
    });

    it('allows editing a category name', async () => {
        const mockCategories: Category[] = [
            { id: 1, name: 'Old Name', parentId: null }
        ];

        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories
        });

        render(<Categories />);

        await waitFor(() => {
            expect(screen.getByText('Old Name')).toBeInTheDocument();
        });

        // Click Edit button
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        // Find the input and change the value
        const editInput = screen.getByDisplayValue('Old Name');
        fireEvent.change(editInput, { target: { value: 'New Name' } });

        // Mock successful update
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true })
        });

        // Mock refresh fetch
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: 1, name: 'New Name', parentId: null }]
        });

        // Click Save
        const saveButton = screen.getByText(/Save/);
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('New Name')).toBeInTheDocument();
            expect(screen.queryByText('Old Name')).not.toBeInTheDocument();
        });
    });

    it('deletes a category when confirmed', async () => {
        const mockCategories: Category[] = [
            { id: 1, name: 'To Delete', parentId: null }
        ];

        // Initial fetch
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories
        });

        render(<Categories />);

        const deleteBtn = await screen.findByText('Delete');

        // Click Delete to show inline confirmation
        fireEvent.click(deleteBtn);

        // Now find the Confirm button
        const confirmBtn = await screen.findByText('Confirm');

        // Mock successful delete
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Category deleted successfully' })
        });

        // Mock refresh fetch (empty list)
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(screen.getByText('No categories yet. Create one above!')).toBeInTheDocument();
        });
    });

    it('cancels deletion when cancel is clicked', async () => {
        const mockCategories: Category[] = [
            { id: 1, name: 'Safe Category', parentId: null }
        ];

        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories
        });

        render(<Categories />);

        const deleteBtn = await screen.findByText('Delete');

        // Click Delete to show confirmation
        fireEvent.click(deleteBtn);

        // Find and click Cancel
        const cancelBtn = await screen.findByText('Cancel');
        fireEvent.click(cancelBtn);

        // Category should still be there
        await waitFor(() => {
            expect(screen.getByText('Safe Category')).toBeInTheDocument();
            // Edit and Delete buttons should be back
            expect(screen.getByText('Edit')).toBeInTheDocument();
        });
    });

    it('cancels editing when cancel is clicked', async () => {
        const mockCategories: Category[] = [
            { id: 1, name: 'Original Name', parentId: null }
        ];

        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories
        });

        render(<Categories />);

        await waitFor(() => {
            expect(screen.getByText('Original Name')).toBeInTheDocument();
        });

        // Click Edit
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        // Change the value
        const editInput = screen.getByDisplayValue('Original Name');
        fireEvent.change(editInput, { target: { value: 'Changed' } });

        // Click Cancel
        const cancelButton = screen.getByText(/Cancel/);
        fireEvent.click(cancelButton);

        // Original name should still be there
        await waitFor(() => {
            expect(screen.getByText('Original Name')).toBeInTheDocument();
        });
    });

    it('shows error message on API failure', async () => {
        (globalThis.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

        render(<Categories />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load categories')).toBeInTheDocument();
        });
    });
});
