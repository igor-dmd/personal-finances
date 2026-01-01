import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Import } from './Import';

// Mock fetch
globalThis.fetch = vi.fn();

describe('Import Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock for fetchJobs on mount
        (globalThis.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => []
        });
    });

    it('renders the import history section', async () => {
        render(<Import />);
        expect(screen.getByText('Import History')).toBeInTheDocument();
        expect(screen.getByText('No imports yet.')).toBeInTheDocument();
    });

    it('fetches and displays import jobs on mount', async () => {
        const mockJobs = [
            { id: 1, filename: 'data.csv', type: 'nubank', status: 'completed', createdAt: new Date().toISOString() }
        ];
        (globalThis.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockJobs
        });

        render(<Import />);

        await waitFor(() => {
            expect(screen.getByText('data.csv')).toBeInTheDocument();
            expect(screen.getByText('nubank')).toBeInTheDocument();
        });
    });

    it('deletes a job when Revert is clicked and confirmed', async () => {
        const mockJobs = [
            { id: 1, filename: 'delete_me.csv', type: 'nubank', status: 'completed', createdAt: new Date().toISOString() }
        ];

        // Initial fetch
        (globalThis.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockJobs
        });

        render(<Import />);

        const revertBtn = await screen.findByText('Revert');

        // Click Revert to show inline confirmation
        fireEvent.click(revertBtn);

        // Now find the Confirm button
        const confirmBtn = await screen.findByText('Confirm');

        // Mock successful delete
        (globalThis.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Deleted' })
        });

        // Mock refresh fetch (empty list)
        (globalThis.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(screen.getByText(/Import reverted successfully/i)).toBeInTheDocument();
            expect(screen.getByText('No imports yet.')).toBeInTheDocument();
        });
    });
});
