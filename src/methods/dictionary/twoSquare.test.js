import TwoSquare from './twoSquare.js';

describe('Two-Square Cipher Tests', () => {
    describe('Encoding', () => {
        test('should encode simple message', () => {
            const cipher = new TwoSquare('HELLO', 'KEYWORD');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBeGreaterThanOrEqual(4);
        });

        test('should handle lowercase', () => {
            const cipher = new TwoSquare('hello', 'keyword');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should handle repeated letters', () => {
            const cipher = new TwoSquare('BALLOON', 'KEYWORD');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });
    });

    describe('Decoding', () => {
        test('should decode simple message', () => {
            const cipher = new TwoSquare('HELLO', 'KEYWORD');
            const encoded = cipher.encode();
            const decoder = new TwoSquare(encoded, 'KEYWORD', true);
            const decoded = decoder.decode();
            expect(decoded.length).toBeGreaterThanOrEqual(4);
            expect(decoded).toContain('HEL');
        });

        test('should be reciprocal', () => {
            const cipher = new TwoSquare('ATTACK', 'KEYWORD');
            const encoded = cipher.encode();
            const decoded = new TwoSquare(encoded, 'KEYWORD', true).decode();
            expect(decoded.length).toBeGreaterThanOrEqual(6);
            expect(decoded).toContain('ATTAC');
        });
    });

    describe('Validation', () => {
        test('should throw error with empty keyword', () => {
            const cipher = new TwoSquare('HELLO', '');
            expect(() => cipher.encode()).toThrow();
        });

        test('should throw error with empty message', () => {
            const cipher = new TwoSquare('', 'KEYWORD');
            expect(() => cipher.encode()).toThrow();
        });
    });
});

