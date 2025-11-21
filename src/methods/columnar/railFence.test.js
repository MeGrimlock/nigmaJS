import RailFence from './railFence.js';

describe('Rail Fence Cipher Tests', () => {
    describe('Encoding', () => {
        test('should encode simple message with 3 rails', () => {
            const cipher = new RailFence('HELLO', 3);
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBe(5);
        });

        test('should encode with 2 rails', () => {
            const cipher = new RailFence('HELLO', 2);
            const encoded = cipher.encode();
            expect(encoded).toBe('HLOEL');
        });

        test('should handle lowercase', () => {
            const cipher = new RailFence('hello', 3);
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should ignore non-alphabetic characters', () => {
            const cipher = new RailFence('HELLO WORLD', 3);
            const encoded = cipher.encode();
            expect(encoded).not.toContain(' ');
        });
    });

    describe('Decoding', () => {
        test('should decode simple message', () => {
            const cipher = new RailFence('HELLO', 3);
            const encoded = cipher.encode();
            const decoder = new RailFence(encoded, 3, true);
            const decoded = decoder.decode();
            expect(decoded).toBe('HELLO');
        });

        test('should be reciprocal', () => {
            const cipher = new RailFence('ATTACKATDAWN', 3);
            const encoded = cipher.encode();
            const decoded = new RailFence(encoded, 3, true).decode();
            expect(decoded).toBe('ATTACKATDAWN');
        });

        test('should decode with 2 rails', () => {
            const cipher = new RailFence('HELLO', 2);
            const encoded = cipher.encode();
            const decoded = new RailFence(encoded, 2, true).decode();
            expect(decoded).toBe('HELLO');
        });
    });

    describe('Validation', () => {
        test('should throw error with less than 2 rails', () => {
            const cipher = new RailFence('HELLO', 1);
            expect(() => cipher.encode()).toThrow();
        });

        test('should throw error with empty message', () => {
            const cipher = new RailFence('', 3);
            expect(() => cipher.encode()).toThrow();
        });
    });
});

