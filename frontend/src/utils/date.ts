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
