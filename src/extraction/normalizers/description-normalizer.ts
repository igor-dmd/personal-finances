
export function normalizeDescription(description: string): string {
    // Normalize "Transferência Recebida"
    if (description.startsWith('Transferência Recebida - ')) {
        const parts = description.split(' - ');
        if (parts.length >= 2) {
            return `Transferência - ${parts[1]}`;
        }
    }

    // Normalize "Transferência recebida pelo Pix"
    if (description.startsWith('Transferência recebida pelo Pix - ')) {
        const parts = description.split(' - ');
        if (parts.length >= 2) {
            return `Pix - ${parts[1]}`;
        }
    }

    // Normalize "Transferência enviada pelo Pix"
    if (description.startsWith('Transferência enviada pelo Pix - ')) {
        const parts = description.split(' - ');
        if (parts.length >= 2) {
            return `Pix - ${parts[1]}`;
        }
    }

    return description;
}
