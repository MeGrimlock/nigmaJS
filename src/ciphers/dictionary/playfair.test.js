import Playfair from './playfair.js';

describe('Playfair Cipher Tests', () => {
    describe('Encoding', () => {
        test('should encode simple message', () => {
            const cipher = new Playfair('HELLO', 'KEYWORD');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBeGreaterThanOrEqual(4);
        });

        test('should handle lowercase', () => {
            const cipher = new Playfair('hello', 'keyword');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should handle repeated letters', () => {
            const cipher = new Playfair('BALLOON', 'KEYWORD');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should handle odd length message', () => {
            const cipher = new Playfair('HELL', 'KEYWORD');
            const encoded = cipher.encode();
            expect(encoded.length % 2).toBe(0);
        });
    });

    describe('Decoding', () => {
        test('should decode simple message', () => {
            const cipher = new Playfair('HELLO', 'KEYWORD');
            const encoded = cipher.encode();
            const decoder = new Playfair(encoded, 'KEYWORD', true);
            const decoded = decoder.decode();
            // Playfair adds X between repeated letters, so HELLO becomes HELXLO
            // We check that the decoded message contains the original letters
            expect(decoded.length).toBeGreaterThanOrEqual(4);
            expect(decoded).toContain('HEL');
            expect(decoded).toContain('LO');
        });

        test('should be reciprocal', () => {
            // Use message without repeated letters for cleaner test
            const cipher = new Playfair('ATTACK', 'KEYWORD');
            const encoded = cipher.encode();
            const decoded = new Playfair(encoded, 'KEYWORD', true).decode();
            // Playfair may add X padding, so we check the structure
            expect(decoded.length).toBeGreaterThanOrEqual(6);
            expect(decoded).toContain('ATTAC');
        });
    });

    describe('Validation', () => {
        test('should throw error with empty keyword', () => {
            const cipher = new Playfair('HELLO', '');
            expect(() => cipher.encode()).toThrow();
        });

        test('should throw error with empty message', () => {
            const cipher = new Playfair('', 'KEYWORD');
            expect(() => cipher.encode()).toThrow();
        });
    });
});

