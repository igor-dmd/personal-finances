import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { IgnoredTransactions } from './IgnoredTransactions';
import type { IgnoredDescription } from '../lib/api';

// Mock fetch
globalThis.fetch = vi.fn();

describe('IgnoredTransactions Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock for fetch on mount
        (globalThis.fetch as Mock).mockResolvedValue({
            ok: true,
            json: async () => []
        });
    });

    it('renders the ignored transactions section', async () => {
        render(<IgnoredTransactions />);

        await waitFor(() => {
            expect(screen.getByText('Transacoes Ignoradas')).toBeInTheDocument();
            expect(screen.getByText(/transacoes com essas descricoes serao ocultadas/i)).toBeInTheDocument();
        });
    });

    it('fetches and displays ignored descriptions on mount', async () => {
        const mockIgnored: IgnoredDescription[] = [
            { id: 1, description: 'Netflix', createdAt: '2023-12-01T00:00:00.000Z' },
            { id: 2, description: 'Spotify', createdAt: '2023-12-02T00:00:00.000Z' }
        ];

        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockIgnored
        });

        render(<IgnoredTransactions />);

        await waitFor(() => {
            expect(screen.getByText('Netflix')).toBeInTheDocument();
            expect(screen.getByText('Spotify')).toBeInTheDocument();
        });

        // Should show count
        expect(screen.getByText('Descricoes Ignoradas (2)')).toBeInTheDocument();
    });

    it('shows empty state when no ignored descriptions', async () => {
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        render(<IgnoredTransactions />);

        await waitFor(() => {
            expect(screen.getByText(/Nenhuma descricao ignorada/i)).toBeInTheDocument();
        });
    });

    it('allows removing an ignored description', async () => {
        const mockIgnored: IgnoredDescription[] = [
            { id: 1, description: 'Netflix', createdAt: '2023-12-01T00:00:00.000Z' }
        ];

        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockIgnored
        });

        render(<IgnoredTransactions />);

        await waitFor(() => {
            expect(screen.getByText('Netflix')).toBeInTheDocument();
        });

        // Click Restaurar button
        const restoreButton = screen.getByText('Restaurar');
        fireEvent.click(restoreButton);

        // Should show confirmation
        await waitFor(() => {
            expect(screen.getByText('Confirmar')).toBeInTheDocument();
            expect(screen.getByText('Cancelar')).toBeInTheDocument();
        });

        // Mock successful delete
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, unignoredCount: 1 })
        });

        // Mock refresh fetch (empty list)
        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        // Click Confirm
        const confirmButton = screen.getByText('Confirmar');
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
            expect(screen.getByText(/Nenhuma descricao ignorada/i)).toBeInTheDocument();
        });
    });

    it('cancels removal when cancel is clicked', async () => {
        const mockIgnored: IgnoredDescription[] = [
            { id: 1, description: 'Netflix', createdAt: '2023-12-01T00:00:00.000Z' }
        ];

        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockIgnored
        });

        render(<IgnoredTransactions />);

        await waitFor(() => {
            expect(screen.getByText('Netflix')).toBeInTheDocument();
        });

        // Click Restaurar button
        const restoreButton = screen.getByText('Restaurar');
        fireEvent.click(restoreButton);

        // Click Cancel
        const cancelButton = screen.getByText('Cancelar');
        fireEvent.click(cancelButton);

        // Description should still be there
        await waitFor(() => {
            expect(screen.getByText('Netflix')).toBeInTheDocument();
            // Restaurar button should be back
            expect(screen.getByText('Restaurar')).toBeInTheDocument();
        });
    });

    it('shows loading state initially', () => {
        (globalThis.fetch as Mock).mockImplementation(() => new Promise(() => {}));

        render(<IgnoredTransactions />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error message on API failure', async () => {
        (globalThis.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

        render(<IgnoredTransactions />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load ignored descriptions')).toBeInTheDocument();
        });
    });

    it('formats dates correctly', async () => {
        const mockIgnored: IgnoredDescription[] = [
            { id: 1, description: 'Netflix', createdAt: '2023-12-15T00:00:00.000Z' }
        ];

        (globalThis.fetch as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockIgnored
        });

        render(<IgnoredTransactions />);

        await waitFor(() => {
            // Date should be formatted in pt-BR (dd/mm/yyyy)
            expect(screen.getByText('15/12/2023')).toBeInTheDocument();
        });
    });
});
