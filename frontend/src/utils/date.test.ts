import { describe, it, expect } from 'vitest';
import { groupTransactionsByMonth, getCurrentMonthKey, formatDate } from './date';

describe('groupTransactionsByMonth', () => {
    it('groups transactions by month', () => {
        const transactions = [
            { id: 1, rawDate: '2024-12-15T00:00:00Z', amount: 100 },
            { id: 2, rawDate: '2024-12-10T00:00:00Z', amount: 200 },
            { id: 3, rawDate: '2024-11-20T00:00:00Z', amount: 300 }
        ];

        const groups = groupTransactionsByMonth(transactions);

        expect(groups).toHaveLength(2);
        expect(groups[0].key).toBe('2024-12');
        expect(groups[0].transactions).toHaveLength(2);
        expect(groups[1].key).toBe('2024-11');
        expect(groups[1].transactions).toHaveLength(1);
    });

    it('sorts months newest to oldest', () => {
        const transactions = [
            { id: 1, rawDate: '2024-01-15T00:00:00Z', amount: 100 },
            { id: 2, rawDate: '2024-06-10T00:00:00Z', amount: 200 },
            { id: 3, rawDate: '2024-03-20T00:00:00Z', amount: 300 }
        ];

        const groups = groupTransactionsByMonth(transactions);

        expect(groups[0].key).toBe('2024-06');
        expect(groups[1].key).toBe('2024-03');
        expect(groups[2].key).toBe('2024-01');
    });

    it('returns empty array for empty transactions', () => {
        const groups = groupTransactionsByMonth([]);
        expect(groups).toHaveLength(0);
    });

    it('generates correct month labels in Portuguese', () => {
        const transactions = [
            { id: 1, rawDate: '2024-12-15T00:00:00Z', amount: 100 }
        ];

        const groups = groupTransactionsByMonth(transactions);

        // Label should be capitalized and in Portuguese (may include "de")
        expect(groups[0].label).toMatch(/dezembro.*2024/i);
    });
});

describe('getCurrentMonthKey', () => {
    it('returns current month in YYYY-MM format', () => {
        const key = getCurrentMonthKey();
        expect(key).toMatch(/^\d{4}-\d{2}$/);
    });
});

describe('formatDate', () => {
    it('formats a date string', () => {
        const result = formatDate('2024-12-15T00:00:00Z');
        expect(result).toBeTruthy();
        expect(result).not.toBe('N/A');
        expect(result).not.toBe('Invalid Date');
    });

    it('returns N/A for null', () => {
        expect(formatDate(null)).toBe('N/A');
    });

    it('returns N/A for undefined', () => {
        expect(formatDate(undefined)).toBe('N/A');
    });

    it('handles unix timestamps in seconds', () => {
        // Dec 15, 2024 timestamp in seconds
        const result = formatDate(1734220800);
        expect(result).toBeTruthy();
        expect(result).not.toBe('Invalid Date');
    });

    it('handles unix timestamps in milliseconds', () => {
        const result = formatDate(1734220800000);
        expect(result).toBeTruthy();
        expect(result).not.toBe('Invalid Date');
    });
});
