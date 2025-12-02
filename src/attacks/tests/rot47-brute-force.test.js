import { ROT47BruteForce } from '../strategies/rot47-brute-force.js';

/**
 * ROT47 Brute Force Solver Tests
 *
 * Tests the ROT47 cipher solver functionality including:
 * - ASCII character shifting
 * - Multi-language support
 * - Confidence scoring
 * - Edge cases
 */
describe('ROT47 Brute Force Solver', () => {
    // ROT47 shifts printable ASCII characters (33-126)
    const englishPlain = "Hello, World! 123";
    const rot47Cipher = "w6==@, t5O2C 9;:"; // ROT47 of englishPlain

    describe('Basic Functionality', () => {
        test('should correctly solve ROT47 cipher', async () => {
            const solver = new ROT47BruteForce('english');
            const result = await solver.solve(rot47Cipher);

            expect(result.method).toBe('rot47-brute-force');
            expect(typeof result.key).toBe('number');
            expect(result.confidence).toBeGreaterThan(0.5);
            expect(result.plaintext).toContain('Hello');
        }, 5000); // Allow more time for brute force

        test('should return valid result structure', async () => {
            const solver = new ROT47BruteForce('english');
            const result = await solver.solve(rot47Cipher);

            expect(result).toHaveProperty('plaintext');
            expect(result).toHaveProperty('method');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('key');
        }, 5000);

        test('should find ROT47 key (47)', async () => {
            const solver = new ROT47BruteForce('english');
            const result = await solver.solve(rot47Cipher);

            expect(result.key).toBe(47);
            expect(result.confidence).toBeGreaterThan(0.8);
        }, 5000);
    });

    describe('Multi-language Support', () => {
        test('should work with different primary languages', async () => {
            const spanishSolver = new ROT47BruteForce('spanish');
            const result = await spanishSolver.solve(rot47Cipher);

            expect(result.method).toBe('rot47-brute-force');
            expect(typeof result.confidence).toBe('number');
        }, 5000);

        test('should try multiple languages when specified', async () => {
            const solver = new ROT47BruteForce('english');
            const result = await solver.solve(rot47Cipher, ['english', 'spanish', 'french']);

            expect(result.method).toBe('rot47-brute-force');
            expect(result.confidence).toBeGreaterThan(0.5);
        }, 10000);
    });

    describe('ASCII Character Handling', () => {
        test('should handle full ASCII printable range', async () => {
            const asciiText = "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
            const solver = new ROT47BruteForce('english');
            const result = await solver.solve(asciiText);

            expect(result.method).toBe('rot47-brute-force');
            expect(typeof result.key).toBe('number');
        }, 3000);

        test('should preserve non-printable characters', async () => {
            const textWithNewlines = "Hello\nWorld\t123";
            const solver = new ROT47BruteForce('english');
            const result = await solver.solve(textWithNewlines);

            expect(result.method).toBe('rot47-brute-force');
            expect(result.plaintext).toBeTruthy();
        });
    });

    describe('Error Handling', () => {
        test('should handle empty input', async () => {
            const solver = new ROT47BruteForce('english');
            const result = await solver.solve('');

            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
        });

        test('should handle very short input', async () => {
            const solver = new ROT47BruteForce('english');
            const result = await solver.solve('A');

            expect(typeof result.key).toBe('number');
            expect(result.confidence).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases', () => {
        test('should handle text with only symbols', async () => {
            const symbolsOnly = "!@#$%^&*()";
            const solver = new ROT47BruteForce('english');
            const result = await solver.solve(symbolsOnly);

            expect(result.method).toBe('rot47-brute-force');
            expect(typeof result.confidence).toBe('number');
        });

        test('should handle repeated characters', async () => {
            const repeatedText = "AAAAABBBBBCCCCC";
            const solver = new ROT47BruteForce('english');
            const result = await solver.solve(repeatedText);

            expect(result.method).toBe('rot47-brute-force');
            expect(typeof result.key).toBe('number');
        });
    });
});
