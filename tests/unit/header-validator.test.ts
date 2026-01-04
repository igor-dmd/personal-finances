
import { expect, test, describe } from 'vitest';
import { validateCsvHeaders, suggestParser } from '../../src/extraction/utils/header-validator';

describe('Header Validator', () => {
    test('validates correct headers for nubank-checking-csv', () => {
        const content = 'Data,Valor,Identificador,Descrição\n01/01/2023,100,123,Desc';
        const expected = ['Data', 'Valor', 'Identificador', 'Descrição'];
        const result = validateCsvHeaders(content, expected);
        expect(result.isValid).toBe(true);
    });

    test('invalidates incorrect headers', () => {
        const content = 'Date,Amount,Id,Description\n...';
        const expected = ['Data', 'Valor', 'Identificador', 'Descrição'];
        const result = validateCsvHeaders(content, expected);
        expect(result.isValid).toBe(false);
    });

    test('suggests correct parser', () => {
        const content = 'Data,Valor,Identificador,Descrição\n...';
        const suggestion = suggestParser(content.split('\n')[0].split(','));
        expect(suggestion).toBe('nubank-checking-csv');
    });
});
