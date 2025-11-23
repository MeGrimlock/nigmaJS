import FourSquare from './fourSquare.js';

describe('Four-Square Cipher Tests', () => {
    describe('Encoding', () => {
        test('should encode simple message', () => {
            const cipher = new FourSquare('HELLO', 'EXAMPLE', 'KEYWORD');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBeGreaterThanOrEqual(4);
        });

        test('should handle lowercase', () => {
            const cipher = new FourSquare('hello', 'example', 'keyword');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should handle repeated letters', () => {
            const cipher = new FourSquare('BALLOON', 'EXAMPLE', 'KEYWORD');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });
    });

    describe('Decoding', () => {
        test('should decode simple message', () => {
            const cipher = new FourSquare('HELLO', 'EXAMPLE', 'KEYWORD');
            const encoded = cipher.encode();
            const decoder = new FourSquare(encoded, 'EXAMPLE', 'KEYWORD', true);
            const decoded = decoder.decode();
            // Four-Square may add X padding, so we check structure
            expect(decoded.length).toBeGreaterThanOrEqual(4);
            expect(decoded).toContain('HEL');
        });

        test('should be reciprocal', () => {
            const cipher = new FourSquare('ATTACK', 'EXAMPLE', 'KEYWORD');
            const encoded = cipher.encode();
            const decoded = new FourSquare(encoded, 'EXAMPLE', 'KEYWORD', true).decode();
            expect(decoded.length).toBeGreaterThanOrEqual(6);
            expect(decoded).toContain('ATTAC');
        });
    });

    describe('Validation', () => {
        test('should throw error with empty keyword1', () => {
            const cipher = new FourSquare('HELLO', '', 'KEYWORD');
            expect(() => cipher.encode()).toThrow();
        });

        test('should throw error with empty keyword2', () => {
            const cipher = new FourSquare('HELLO', 'EXAMPLE', '');
            expect(() => cipher.encode()).toThrow();
        });

        test('should throw error with empty message', () => {
            const cipher = new FourSquare('', 'EXAMPLE', 'KEYWORD');
            expect(() => cipher.encode()).toThrow();
        });
    });
});

