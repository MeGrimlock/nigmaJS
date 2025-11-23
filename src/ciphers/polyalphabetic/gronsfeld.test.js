import Gronsfeld from './gronsfeld.js';

describe('Gronsfeld Cipher Tests', () => {
    describe('Encoding', () => {
        test('should encode simple message', () => {
            const cipher = new Gronsfeld('HELLO', '12345');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBe(5);
        });

        test('should handle lowercase', () => {
            const cipher = new Gronsfeld('hello', '12345');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should preserve spaces and punctuation', () => {
            const cipher = new Gronsfeld('HELLO WORLD', '12345');
            const encoded = cipher.encode();
            expect(encoded).toContain(' ');
        });

        test('should handle single digit key', () => {
            const cipher = new Gronsfeld('HELLO', '5');
            const encoded = cipher.encode();
            expect(encoded).toBe('MJQQT');
        });
    });

    describe('Decoding', () => {
        test('should decode simple message', () => {
            const cipher = new Gronsfeld('HELLO', '12345');
            const encoded = cipher.encode();
            const decoder = new Gronsfeld(encoded, '12345', true);
            const decoded = decoder.decode();
            expect(decoded).toBe('HELLO');
        });

        test('should be reciprocal', () => {
            const cipher = new Gronsfeld('ATTACKATDAWN', '12345');
            const encoded = cipher.encode();
            const decoded = new Gronsfeld(encoded, '12345', true).decode();
            expect(decoded).toBe('ATTACKATDAWN');
        });
    });

    describe('Validation', () => {
        test('should throw error with empty keyword', () => {
            const cipher = new Gronsfeld('HELLO', '');
            expect(() => cipher.encode()).toThrow();
        });

        test('should throw error with non-numeric keyword', () => {
            const cipher = new Gronsfeld('HELLO', 'ABC');
            expect(() => cipher.encode()).toThrow();
        });

        test('should throw error with empty message', () => {
            const cipher = new Gronsfeld('', '12345');
            expect(() => cipher.encode()).toThrow();
        });
    });
});

