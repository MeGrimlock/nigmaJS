import ADFGVX from './adfgvx.js';

describe('ADFGVX Cipher Tests', () => {
    describe('Encoding', () => {
        test('should encode simple message', () => {
            const cipher = new ADFGVX('HELLO', 'KEYWORD', 'KEY');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBeGreaterThan(0);
        });

        test('should handle lowercase', () => {
            const cipher = new ADFGVX('hello', 'keyword', 'key');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should handle numbers', () => {
            const cipher = new ADFGVX('HELLO123', 'KEYWORD', 'KEY');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });
    });

    describe('Decoding', () => {
        test('should decode simple message', () => {
            const cipher = new ADFGVX('HELLO', 'KEYWORD', 'KEY');
            const encoded = cipher.encode();
            const decoder = new ADFGVX(encoded, 'KEYWORD', 'KEY', true);
            const decoded = decoder.decode();
            expect(decoded).toBe('HELLO');
        });

        test('should be reciprocal', () => {
            const cipher = new ADFGVX('ATTACK', 'KEYWORD', 'KEY');
            const encoded = cipher.encode();
            const decoded = new ADFGVX(encoded, 'KEYWORD', 'KEY', true).decode();
            expect(decoded).toBe('ATTACK');
        });
    });

    describe('Validation', () => {
        test('should throw error with empty transposition key', () => {
            const cipher = new ADFGVX('HELLO', 'KEYWORD', '');
            expect(() => cipher.encode()).toThrow();
        });

        test('should throw error with empty message', () => {
            const cipher = new ADFGVX('', 'KEYWORD', 'KEY');
            expect(() => cipher.encode()).toThrow();
        });
    });
});

