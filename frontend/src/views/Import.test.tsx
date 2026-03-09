
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { Import } from './Import';
import type { ImportJob } from '../lib/api';

// Mock fetch
globalThis.fetch = vi.fn();

describe('Import Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock for fetches
        (globalThis.fetch as Mock).mockImplementation((url, options) => {
            if (url.includes('/parser-types') && (!options || options.method === 'GET')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [
                        { name: 'Nubank Credit Card', identifier: 'nubank-cc-bill-csv' },
                        { name: 'Nubank Checking', identifier: 'nubank-checking-csv' }
                    ]
                });
            }
            if (url.includes('/import-jobs') && (!options || options.method === 'GET')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => []
                });
            }
            return Promise.reject(new Error(`Unknown URL: ${url}`));
        });
    });

    it('renders the import history section', async () => {
        render(<Import />);
        expect(screen.getByText('Histórico de Importação')).toBeInTheDocument();
        expect(screen.getByText('Nenhuma importação ainda.')).toBeInTheDocument();
    });

    it('fetches and displays import jobs on mount', async () => {
        const mockJobs: ImportJob[] = [
            { id: 1, filename: 'data.csv', type: 'nubank', status: 'completed', createdAt: new Date().toISOString() }
        ];

        (globalThis.fetch as Mock).mockImplementation((url) => {
            if (url.includes('/parser-types')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [{ name: 'Nubank', identifier: 'nubank' }]
                });
            }
            if (url.includes('/import-jobs')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockJobs
                });
            }
        });

        render(<Import />);

        await waitFor(() => {
            expect(screen.getByText('data.csv')).toBeInTheDocument();
            expect(screen.getByText('nubank')).toBeInTheDocument();
        });
    });

    it('deletes a job when Revert is clicked and confirmed', async () => {
        const mockJobs: ImportJob[] = [
            { id: 1, filename: 'delete_me.csv', type: 'nubank', status: 'completed', createdAt: new Date().toISOString() }
        ];

        // Mock fetch with initial job
        (globalThis.fetch as Mock).mockImplementation((url, options) => {
            if (url.includes('/parser-types')) return Promise.resolve({ ok: true, json: async () => [] });

            if (url.includes('/import-jobs')) {
                if (options && options.method === 'DELETE') {
                    return Promise.resolve({ ok: true });
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => mockJobs
                });
            }
            return Promise.resolve({ ok: true });
        });

        render(<Import />);

        const revertBtn = await screen.findByText('Reverter');

        // Click Revert to show inline confirmation
        fireEvent.click(revertBtn);

        // Now find the Confirm button
        const confirmBtn = await screen.findByText('Confirmar');

        // Update mock to return empty list after delete
        (globalThis.fetch as Mock).mockImplementation((url, options) => {
            if (url.includes('/parser-types')) return Promise.resolve({ ok: true, json: async () => [] });

            if (url.includes('/import-jobs')) {
                if (options && options.method === 'DELETE') {
                    return Promise.resolve({ ok: true });
                }
                // Return empty list assuming delete happened
                return Promise.resolve({
                    ok: true,
                    json: async () => []
                });
            }
        });

        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(screen.getByText(/Importação revertida com sucesso/i)).toBeInTheDocument();
            expect(screen.getByText('Nenhuma importação ainda.')).toBeInTheDocument();
        });
    });
});
