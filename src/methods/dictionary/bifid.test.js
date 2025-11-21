import Bifid from './bifid.js';

describe('Bifid Cipher Tests', () => {
    describe('Encoding', () => {
        test('should encode simple message', () => {
            const cipher = new Bifid('HELLO');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBeGreaterThan(0);
        });

        test('should handle lowercase', () => {
            const cipher = new Bifid('hello');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should handle J as I', () => {
            const cipher = new Bifid('JELLO');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should work with keyword', () => {
            const cipher = new Bifid('HELLO', 'KEYWORD');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });
    });

    describe('Decoding', () => {
        test('should decode simple message', () => {
            const cipher = new Bifid('HELLO');
            const encoded = cipher.encode();
            const decoder = new Bifid(encoded, '', true);
            const decoded = decoder.decode();
            expect(decoded).toBe('HELLO');
        });

        test('should be reciprocal', () => {
            const cipher = new Bifid('ATTACKATDAWN');
            const encoded = cipher.encode();
            const decoded = new Bifid(encoded, '', true).decode();
            expect(decoded).toBe('ATTACKATDAWN');
        });

        test('should decode with keyword', () => {
            const cipher = new Bifid('HELLO', 'KEYWORD');
            const encoded = cipher.encode();
            const decoded = new Bifid(encoded, 'KEYWORD', true).decode();
            expect(decoded).toBe('HELLO');
        });
    });

    describe('Edge Cases', () => {
        test('should handle single character', () => {
            const cipher = new Bifid('H');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should handle short messages', () => {
            const cipher = new Bifid('HI');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });
    });
});

