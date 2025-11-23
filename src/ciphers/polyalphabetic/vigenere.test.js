import Vigenere from './vigenere.js';

describe('Vigenere Cipher Tests', () => {
    test('should encode simple message', () => {
        const cipher = new Vigenere('HELLO', 'KEY');
        expect(cipher.encode()).toBe('RIJVS');
    });

    test('should decode simple message', () => {
        const cipher = new Vigenere('RIJVS', 'KEY', true);
        expect(cipher.decode()).toBe('HELLO');
    });

    test('should be reciprocal', () => {
        const cipher = new Vigenere('ATTACKATDAWN', 'LEMON');
        const encoded = cipher.encode();
        const decoded = new Vigenere(encoded, 'LEMON', true).decode();
        expect(decoded).toBe('ATTACKATDAWN');
    });

    test('should handle lowercase', () => {
        const cipher = new Vigenere('hello', 'key');
        expect(cipher.encode()).toBe('RIJVS');
    });

    test('should preserve spaces and punctuation', () => {
        const cipher = new Vigenere('HELLO WORLD', 'KEY');
        const encoded = cipher.encode();
        expect(encoded).toContain(' ');
    });

    test('should repeat keyword', () => {
        const cipher = new Vigenere('ABCDEFGH', 'AB');
        const encoded = cipher.encode();
        // A+A=A, B+B=C, C+A=C, D+B=E, E+A=E, F+B=G, G+A=G, H+B=I
        expect(encoded).toBe('ACCEEGGI');
    });

    test('should handle single letter keyword', () => {
        const cipher = new Vigenere('HELLO', 'C');
        const encoded = cipher.encode();
        const decoded = new Vigenere(encoded, 'C', true).decode();
        expect(decoded).toBe('HELLO');
    });

    test('should throw error with empty keyword', () => {
        const cipher = new Vigenere('HELLO', '');
        expect(() => cipher.encode()).toThrow();
    });
});
