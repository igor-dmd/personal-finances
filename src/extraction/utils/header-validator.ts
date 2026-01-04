
export const PARSER_HEADERS: Record<string, string[]> = {
    'nubank-cc-bill-csv': ['date', 'category', 'title', 'amount'],
    'nubank-checking-csv': ['Data', 'Valor', 'Identificador', 'Descrição']
};

// Note: Added 'category' to nubank-cc-bill-csv as it often appears in recent exports, 
// strictly existing parser uses 'date,title,amount' but let's be careful.
// Actually, let's double check the existing parser assumptions or just stick to what is known.
// The existing parser interface `NubankRecord` has date, title, amount.
// If I assume what's in the code:
// `nubank-cc-bill-csv`: ['date', 'title', 'amount'] 
// But wait, user exports might vary.
// Let's stick to strict checking for the new parser and what we know about the old one.

export const KNOWN_HEADERS: Record<string, string[]> = {
    'nubank-cc-bill-csv': ['date', 'title', 'amount'], // Standard Nubank CC export
    'nubank-checking-csv': ['Data', 'Valor', 'Identificador', 'Descrição']
};

export function validateCsvHeaders(content: string, expectedHeaders: string[]): { isValid: boolean; foundHeaders: string[] } {
    const firstLine = content.split(/\r?\n/)[0];
    if (!firstLine) return { isValid: false, foundHeaders: [] };

    // Simple split by comma, handling potential quotes is complex but for headers usually fine
    // For robust CSV parsing we might want to use the library, but string split is faster for just the header line validation
    const headers = firstLine.split(',').map(h => h.trim());

    // Check if all expected headers are present (order matters usually for array mapping, but here we use column mapping)
    // However, for strict validation let's enforce presence.

    const lowerHeaders = headers.map(h => h.toLowerCase());
    const lowerExpected = expectedHeaders.map(h => h.toLowerCase());

    // We check if the expected headers are present in the found headers.
    // Nubank CC export sometimes has 'category', sometimes not depending on version? 
    // Actually the existing parser code `CsvBankParser` uses `columns: true`.

    const isValid = lowerExpected.every(eh => lowerHeaders.includes(eh));

    return { isValid, foundHeaders: headers };
}

export function suggestParser(foundHeaders: string[]): string | null {
    const lowerFound = foundHeaders.map(h => h.toLowerCase());

    for (const [parserId, expected] of Object.entries(KNOWN_HEADERS)) {
        const lowerExpected = expected.map(h => h.toLowerCase());
        if (lowerExpected.every(eh => lowerFound.includes(eh))) {
            return parserId;
        }
    }
    return null;
}
