import Quagmire1 from './quagmire1.js';
import Quagmire2 from './quagmire2.js';
import Quagmire3 from './quagmire3.js';
import Quagmire4 from './quagmire4.js';

describe('Quagmire Cipher Tests', () => {
    describe('Quagmire1', () => {
        test('should encode simple message', () => {
            const cipher = new Quagmire1('HELLO', 'KEY');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBe(5);
        });

        test('should decode simple message', () => {
            const cipher = new Quagmire1('HELLO', 'KEY');
            const encoded = cipher.encode();
            const decoder = new Quagmire1(encoded, 'KEY', '', true);
            const decoded = decoder.decode();
            expect(decoded).toBe('HELLO');
        });

        test('should be reciprocal', () => {
            const cipher = new Quagmire1('ATTACKATDAWN', 'LEMON');
            const encoded = cipher.encode();
            const decoded = new Quagmire1(encoded, 'LEMON', '', true).decode();
            expect(decoded).toBe('ATTACKATDAWN');
        });

        test('should handle lowercase', () => {
            const cipher = new Quagmire1('hello', 'key');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should preserve spaces and punctuation', () => {
            const cipher = new Quagmire1('HELLO WORLD', 'KEY');
            const encoded = cipher.encode();
            expect(encoded).toContain(' ');
        });

        test('should throw error with empty keyword', () => {
            const cipher = new Quagmire1('HELLO', '');
            expect(() => cipher.encode()).toThrow();
        });
    });

    describe('Quagmire2', () => {
        test('should encode simple message', () => {
            const cipher = new Quagmire2('HELLO', 'KEY', 'A');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBe(5);
        });

        test('should decode simple message', () => {
            const cipher = new Quagmire2('HELLO', 'KEY', 'A');
            const encoded = cipher.encode();
            const decoder = new Quagmire2(encoded, 'KEY', 'A', true);
            const decoded = decoder.decode();
            expect(decoded).toBe('HELLO');
        });

        test('should be reciprocal', () => {
            const cipher = new Quagmire2('ATTACKATDAWN', 'LEMON', 'ABC');
            const encoded = cipher.encode();
            const decoded = new Quagmire2(encoded, 'LEMON', 'ABC', true).decode();
            expect(decoded).toBe('ATTACKATDAWN');
        });

        test('should handle different indicators', () => {
            const cipher1 = new Quagmire2('HELLO', 'KEY', 'A');
            const cipher2 = new Quagmire2('HELLO', 'KEY', 'B');
            const encoded1 = cipher1.encode();
            const encoded2 = cipher2.encode();
            expect(encoded1).not.toBe(encoded2);
        });

        test('should throw error with empty keyword', () => {
            const cipher = new Quagmire2('HELLO', '');
            expect(() => cipher.encode()).toThrow();
        });
    });

    describe('Quagmire3', () => {
        test('should encode simple message', () => {
            const cipher = new Quagmire3('HELLO', 'KEY', 'A');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBe(5);
        });

        test('should decode simple message', () => {
            const cipher = new Quagmire3('HELLO', 'KEY', 'A');
            const encoded = cipher.encode();
            const decoder = new Quagmire3(encoded, 'KEY', 'A', true);
            const decoded = decoder.decode();
            expect(decoded).toBe('HELLO');
        });

        test('should be reciprocal', () => {
            const cipher = new Quagmire3('ATTACK', 'LEMON', 'ABC');
            const encoded = cipher.encode();
            const decoded = new Quagmire3(encoded, 'LEMON', 'ABC', true).decode();
            expect(decoded).toBe('ATTACK');
        });

        test('should handle different indicators', () => {
            const cipher1 = new Quagmire3('HELLO', 'KEY', 'A');
            const cipher2 = new Quagmire3('HELLO', 'KEY', 'B');
            const encoded1 = cipher1.encode();
            const encoded2 = cipher2.encode();
            expect(encoded1).not.toBe(encoded2);
        });

        test('should throw error with empty keyword', () => {
            const cipher = new Quagmire3('HELLO', '');
            expect(() => cipher.encode()).toThrow();
        });
    });

    describe('Quagmire4', () => {
        test('should encode simple message', () => {
            const cipher = new Quagmire4('HELLO', 'KEY', 'ABC');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBe(5);
        });

        test('should decode simple message', () => {
            const cipher = new Quagmire4('HELLO', 'KEY', 'ABC');
            const encoded = cipher.encode();
            const decoder = new Quagmire4(encoded, 'KEY', 'ABC', '', true);
            const decoded = decoder.decode();
            expect(decoded).toBe('HELLO');
        });

        test('should be reciprocal', () => {
            const cipher = new Quagmire4('ATTACK', 'LEMON', 'ABC');
            const encoded = cipher.encode();
            const decoded = new Quagmire4(encoded, 'LEMON', 'ABC', '', true).decode();
            expect(decoded).toBe('ATTACK');
        });

        test('should handle custom cipher alphabet', () => {
            const customAlpha = 'ZYXWVUTSRQPONMLKJIHGFEDCBA';
            const cipher = new Quagmire4('HELLO', 'KEY', 'ABC', customAlpha);
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should throw error with empty keyword', () => {
            const cipher = new Quagmire4('HELLO', '');
            expect(() => cipher.encode()).toThrow();
        });
    });
});

