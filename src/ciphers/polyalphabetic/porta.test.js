import Porta from './porta.js';

describe('Porta Cipher Tests', () => {
    describe('Encoding', () => {
        test('should encode simple message', () => {
            const cipher = new Porta('HELLO', 'KEY');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBe(5);
        });

        test('should handle lowercase', () => {
            const cipher = new Porta('hello', 'key');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should preserve spaces and punctuation', () => {
            const cipher = new Porta('HELLO WORLD', 'KEY');
            const encoded = cipher.encode();
            expect(encoded).toContain(' ');
        });
    });

    describe('Decoding', () => {
        test('should decode simple message', () => {
            const cipher = new Porta('HELLO', 'KEY');
            const encoded = cipher.encode();
            const decoder = new Porta(encoded, 'KEY', true);
            const decoded = decoder.decode();
            expect(decoded).toBe('HELLO');
        });

        test('should be reciprocal', () => {
            const cipher = new Porta('ATTACKATDAWN', 'LEMON');
            const encoded = cipher.encode();
            const decoded = new Porta(encoded, 'LEMON', true).decode();
            expect(decoded).toBe('ATTACKATDAWN');
        });
    });

    describe('Validation', () => {
        test('should throw error with empty keyword', () => {
            const cipher = new Porta('HELLO', '');
            expect(() => cipher.encode()).toThrow();
        });

        test('should throw error with empty message', () => {
            const cipher = new Porta('', 'KEY');
            expect(() => cipher.encode()).toThrow();
        });
    });
});

