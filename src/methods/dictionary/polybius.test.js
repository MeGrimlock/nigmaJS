import Polybius from './polybius.js';

describe('Polybius Square Cipher Tests', () => {
    test('should encode simple message', () => {
        const cipher = new Polybius('HELLO');
        expect(cipher.encode()).toBe('23 15 31 31 34');
    });

    test('should decode simple message', () => {
        const cipher = new Polybius('23 15 31 31 34', '', true);
        expect(cipher.decode()).toBe('HELLO');
    });

    test('should be reciprocal', () => {
        const cipher = new Polybius('TESTING');
        const encoded = cipher.encode();
        const decoded = new Polybius(encoded, '', true).decode();
        expect(decoded).toBe('TESTING');
    });

    test('should work with keyword', () => {
        const cipher = new Polybius('HELLO', 'SECRET');
        const encoded = cipher.encode();
        const decoded = new Polybius(encoded, 'SECRET', true).decode();
        expect(decoded).toBe('HELLO');
    });

    test('should treat I and J as same', () => {
        const cipherI = new Polybius('I');
        const cipherJ = new Polybius('J');
        expect(cipherI.encode()).toBe(cipherJ.encode());
    });

    test('should handle lowercase', () => {
        const cipher = new Polybius('hello');
        expect(cipher.encode()).toBe('23 15 31 31 34');
    });

    test('should ignore special characters', () => {
        const cipher = new Polybius('HELLO, WORLD!');
        const clean = new Polybius('HELLOWORLD');
        expect(cipher.encode()).toBe(clean.encode());
    });

    test('should generate correct grid', () => {
        const cipher = new Polybius('A');
        expect(cipher.grid[0][0]).toBe('A');
        expect(cipher.grid[4][4]).toBe('Z');
    });
});
