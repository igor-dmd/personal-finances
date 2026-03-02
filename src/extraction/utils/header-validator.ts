export const KNOWN_HEADERS: Record<string, string[] | never[]> = {
    'nubank-cc-bill-csv': ['date', 'title', 'amount'], // Standard Nubank CC export
    'nubank-checking-csv': ['Data', 'Valor', 'Identificador', 'Descrição']
};

export function validateCsvHeaders(content: string, expectedHeaders: string[]): { isValid: boolean; foundHeaders: string[] } {
    const firstLine = content.split(/\r?\n/)[0];

    if (!firstLine) return { isValid: false, foundHeaders: [] };
    const headers = firstLine.split(',').map(h => h.trim());

    const lowerHeaders = headers.map(h => h.toLowerCase());
    const lowerExpected = expectedHeaders.map(h => h.toLowerCase());

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
