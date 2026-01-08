export interface InstallmentInfo {
    merchantName: string;
    currentInstallment: number;
    totalInstallments: number;
    hasInstallmentInfo: boolean;
}

/**
 * Parses installment information from transaction description.
 * Recognizes patterns like:
 * - "Merchant - Parcela 4/10"
 * - "Merchant Parcela 4/10"
 * - "Ferreiracostacom - Parcela 4/10,351.29"
 *
 * @param description The transaction description to parse
 * @returns InstallmentInfo object with parsed data
 */
export function parseInstallmentFromDescription(description: string): InstallmentInfo {
    // Pattern: "Merchant - Parcela 4/10" or "Merchant Parcela 4/10"
    // The pattern captures:
    // - Group 1: Merchant name (everything before "Parcela")
    // - Group 2: Current installment number
    // - Group 3: Total installments
    const parcelaPattern = /(.*?)\s*-?\s*Parcela\s+(\d+)\/(\d+)/i;
    const match = description.match(parcelaPattern);

    if (match) {
        return {
            merchantName: match[1].trim(),
            currentInstallment: parseInt(match[2], 10),
            totalInstallments: parseInt(match[3], 10),
            hasInstallmentInfo: true,
        };
    }

    // No installment pattern found
    return {
        merchantName: description,
        currentInstallment: 0,
        totalInstallments: 0,
        hasInstallmentInfo: false,
    };
}
