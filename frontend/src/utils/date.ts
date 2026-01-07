export interface MonthGroup<T> {
    key: string;        // "2024-12"
    label: string;      // "Dezembro 2024"
    transactions: T[];
}

/**
 * Groups transactions by month and year, sorted newest to oldest.
 * Requires transactions to have a rawDate field with ISO date string.
 */
export function groupTransactionsByMonth<T extends { rawDate: string }>(
    transactions: T[]
): MonthGroup<T>[] {
    const groups = new Map<string, T[]>();

    for (const transaction of transactions) {
        const date = new Date(transaction.rawDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(transaction);
    }

    // Sort keys newest to oldest
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a));

    return sortedKeys.map(key => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        // Capitalize first letter
        const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

        return {
            key,
            label: capitalizedLabel,
            transactions: groups.get(key)!
        };
    });
}

/**
 * Returns the current month key in "YYYY-MM" format.
 */
export function getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Formats a date value (string, number, or Date) into a human-readable string.
 * Handles both unix timestamps (seconds) and milliseconds.
 */
export const formatDate = (dateValue: string | number | Date | null | undefined) => {
    if (!dateValue) return 'N/A';
    let date: Date;

    if (typeof dateValue === 'number' || (typeof dateValue === 'string' && /^\d+$/.test(dateValue))) {
        const num = Number(dateValue);
        // If the number is smaller than 10^11, it's likely seconds (10^11 ms is ~1973, 10^11 s is way in the future)
        // A safer check: if it's < 10,000,000,000 it's definitely seconds (before year 2286).
        if (num < 10000000000) {
            date = new Date(num * 1000);
        } else {
            date = new Date(num);
        }
    } else {
        date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString();
};
