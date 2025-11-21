import Route from './route.js';

describe('Route Cipher Tests', () => {
    describe('Encoding', () => {
        test('should encode with spiral route', () => {
            const cipher = new Route('HELLO', 3, 3, 'spiral');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBeGreaterThan(0);
        });

        test('should encode with zigzag route', () => {
            const cipher = new Route('HELLO', 3, 3, 'zigzag');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });

        test('should encode with column route', () => {
            const cipher = new Route('HELLO', 3, 3, 'column');
            const encoded = cipher.encode();
            expect(encoded).toBeTruthy();
        });
    });

    describe('Decoding', () => {
        test('should decode with spiral route', () => {
            const cipher = new Route('HELLO', 3, 3, 'spiral');
            const encoded = cipher.encode();
            const decoder = new Route(encoded, 3, 3, 'spiral', true);
            const decoded = decoder.decode();
            expect(decoded).toContain('HELLO');
        });

        test('should be reciprocal with spiral', () => {
            const cipher = new Route('ATTACK', 4, 4, 'spiral');
            const encoded = cipher.encode();
            const decoded = new Route(encoded, 4, 4, 'spiral', true).decode();
            expect(decoded).toContain('ATTACK');
        });

        test('should decode with zigzag route', () => {
            const cipher = new Route('HELLO', 3, 3, 'zigzag');
            const encoded = cipher.encode();
            const decoder = new Route(encoded, 3, 3, 'zigzag', true);
            const decoded = decoder.decode();
            expect(decoded).toContain('HELLO');
        });
    });

    describe('Validation', () => {
        test('should throw error with less than 2 rows', () => {
            const cipher = new Route('HELLO', 1, 3);
            expect(() => cipher.encode()).toThrow();
        });

        test('should throw error with less than 2 columns', () => {
            const cipher = new Route('HELLO', 3, 1);
            expect(() => cipher.encode()).toThrow();
        });

        test('should throw error with empty message', () => {
            const cipher = new Route('', 3, 3);
            expect(() => cipher.encode()).toThrow();
        });
    });
});

