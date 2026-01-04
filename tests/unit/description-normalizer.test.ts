
import { expect, test, describe } from 'vitest';
import { normalizeDescription } from '../../src/extraction/normalizers/description-normalizer';

describe('Description Normalizer', () => {
    test('normalizes Transferência Recebida', () => {
        const input = 'Transferência Recebida - JOHN DOE - 123456';
        const expected = 'Transferência - JOHN DOE';
        expect(normalizeDescription(input)).toBe(expected);
    });

    test('normalizes Transferência recebida pelo Pix', () => {
        const input = 'Transferência recebida pelo Pix - JANE DOE - abcdef';
        const expected = 'Pix - JANE DOE';
        expect(normalizeDescription(input)).toBe(expected);
    });

    test('normalizes Transferência enviada pelo Pix', () => {
        const input = 'Transferência enviada pelo Pix - BOB SMITH - 123';
        const expected = 'Pix - BOB SMITH';
        expect(normalizeDescription(input)).toBe(expected);
    });

    test('returns original description if no match', () => {
        const input = 'Compra no Supermercado';
        expect(normalizeDescription(input)).toBe(input);
    });
});
