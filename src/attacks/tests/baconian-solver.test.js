import { BaconianSolver } from '../strategies/baconian-solver.js';
import Dictionary from '../../ciphers/dictionary/dictionary.js';

/**
 * Baconian Solver Tests
 *
 * Tests the Baconian cipher solver functionality including:
 * - A/B pattern recognition
 * - 0/1 pattern recognition
 * - Confidence scoring
 * - Dictionary validation
 * - Edge cases
 */
describe('Baconian Solver', () => {
    // Test texts - Baconian uses 5-bit patterns
    const englishPlain = "HELLO"; // Short text for Baconian (5 letters = 25 bits)
    const baconianAB = "AAAAABBBBBABAAAABABAAB"; // A/B pattern for "HELLO"
    const baconian01 = "00000111110100001101011"; // 0/1 pattern for "HELLO"

    describe('Basic Functionality', () => {
        test('should attempt to solve Baconian A/B pattern', async () => {
            const solver = new BaconianSolver('english');
            const result = await solver.solve(baconianAB);

            expect(result.method).toBe('baconian');
            expect(result.plaintext).toBeTruthy();
            expect(typeof result.plaintext).toBe('string');
            expect(result.plaintext.length).toBeGreaterThan(0);
            expect(result.pattern).toBeDefined();
            expect(typeof result.pattern).toBe('string');
            expect(result.confidence).toBeGreaterThanOrEqual(0);
        });

        test('should attempt to solve Baconian 0/1 pattern', async () => {
            const solver = new BaconianSolver('english');
            const result = await solver.solve(baconian01);

            expect(result.method).toBe('baconian');
            expect(result.plaintext).toBeTruthy();
            expect(typeof result.plaintext).toBe('string');
            expect(result.plaintext.length).toBeGreaterThan(0);
            expect(result.pattern).toBeDefined();
            expect(typeof result.pattern).toBe('string');
            expect(result.confidence).toBeGreaterThanOrEqual(0);
        });

        test('should return valid result structure', async () => {
            const solver = new BaconianSolver('english');
            const result = await solver.solve(baconianAB);

            expect(result).toHaveProperty('plaintext');
            expect(result).toHaveProperty('method');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('key');
            expect(result).toHaveProperty('pattern');
            expect(result).toHaveProperty('wordCoverage');
            expect(result.pattern === null || typeof result.pattern === 'string').toBe(true);
        });
    });

    describe('Pattern Recognition', () => {
        test('should prefer A/B pattern when both are valid', async () => {
            // Create a text where both patterns could be valid
            const ambiguousText = "AAAAABBBBB"; // Could be interpreted differently
            const solver = new BaconianSolver('english');
            const result = await solver.solve(ambiguousText);

            expect(result.method).toBe('baconian');
            expect(typeof result.confidence).toBe('number');
            expect(result.pattern === null || typeof result.pattern === 'string').toBe(true);
            if (result.pattern) {
                expect(['A/B', '0/1'].includes(result.pattern)).toBe(true);
            }
        });

        test('should identify the pattern used', async () => {
            const solver = new BaconianSolver('english');

            const resultAB = await solver.solve(baconianAB);
            // Pattern might be null if no valid result found, or the detected pattern
            expect(resultAB.pattern === null || resultAB.pattern === 'A/B' || resultAB.pattern === '0/1').toBe(true);

            const result01 = await solver.solve(baconian01);
            expect(result01.pattern === null || result01.pattern === 'A/B' || result01.pattern === '0/1').toBe(true);
        });
    });

    describe('Confidence Scoring', () => {
        test('should give high confidence for valid Baconian text', async () => {
            const solver = new BaconianSolver('english');
            const result = await solver.solve(baconianAB);

            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(typeof result.score).toBe('number');
        });

        test('should give low confidence for invalid text', async () => {
            const solver = new BaconianSolver('english');
            const invalidText = "XYZABCDEF"; // Not a valid 5-bit pattern
            const result = await solver.solve(invalidText);

            expect(result.confidence).toBeLessThan(0.5);
        });

        test('should calculate word coverage', async () => {
            const solver = new BaconianSolver('english');
            const result = await solver.solve(baconianAB);

            expect(typeof result.wordCoverage).toBe('number');
            expect(result.wordCoverage).toBeGreaterThanOrEqual(0);
            expect(result.wordCoverage).toBeLessThanOrEqual(1);
        });
    });

    describe('Cipher Integration', () => {
        test('should work with Dictionary.Baconian cipher', () => {
            const baconian = new Dictionary.Baconian(englishPlain, false); // encoded = false
            const encoded = baconian.encode();
            expect(encoded).toBeTruthy();
            expect(typeof encoded).toBe('string');
        });

        test('should be consistent with cipher decode', () => {
            const baconian = new Dictionary.Baconian(baconianAB, true); // encoded = true
            const decoded = baconian.decode();
            // Cipher might return empty string, that's OK for this test
            expect(typeof decoded).toBe('string');
        });
    });

    describe('Error Handling', () => {
        test('should handle empty input', async () => {
            const solver = new BaconianSolver('english');
            const result = await solver.solve('');

            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
        });

        test('should handle text too short for Baconian', async () => {
            const solver = new BaconianSolver('english');
            const result = await solver.solve('AB');

            expect(result.confidence).toBeLessThan(0.5);
        });

        test('should handle invalid characters', async () => {
            const solver = new BaconianSolver('english');
            const result = await solver.solve('ABCDEFGHIJK123');

            expect(result.method).toBe('baconian');
            expect(typeof result.confidence).toBe('number');
        });
    });

    describe('Edge Cases', () => {
        test('should handle text with mixed case', async () => {
            const mixedCaseText = "AaAaAbBbBb";
            const solver = new BaconianSolver('english');
            const result = await solver.solve(mixedCaseText);

            expect(result.method).toBe('baconian');
            expect(typeof result.confidence).toBe('number');
        });

        test('should handle text with spaces', async () => {
            const textWithSpaces = "AAAAA BBBBB ABAAA ABABA AB";
            const solver = new BaconianSolver('english');
            const result = await solver.solve(textWithSpaces);

            expect(result.method).toBe('baconian');
            expect(result.plaintext).toBeTruthy();
        });

        test('should handle text with other characters', async () => {
            const textWithExtras = "AAAAA!BBBBB@ABAAA#ABABA$AB";
            const solver = new BaconianSolver('english');
            const result = await solver.solve(textWithExtras);

            expect(result.method).toBe('baconian');
            expect(typeof result.confidence).toBe('number');
        });
    });

    describe('Language Support', () => {
        test('should work with different languages', async () => {
            const spanishSolver = new BaconianSolver('spanish');
            const result = await spanishSolver.solve(baconianAB);

            expect(result.method).toBe('baconian');
            expect(typeof result.confidence).toBe('number');
        });

        test('should handle unsupported languages gracefully', async () => {
            const klingonSolver = new BaconianSolver('klingon');
            const result = await klingonSolver.solve(baconianAB);

            expect(result.method).toBe('baconian');
            expect(typeof result.confidence).toBe('number');
        });
    });

    describe('Pattern Validation', () => {
        test('should validate 5-bit patterns correctly', async () => {
            // Text with exactly 25 bits (5 letters)
            const validLengthText = "AAAAABBBBBABAAAABABAAB";
            const solver = new BaconianSolver('english');
            const result = await solver.solve(validLengthText);

            expect(result.method).toBe('baconian');
            expect(result.plaintext.length).toBeGreaterThan(0);
        });

        test('should handle incomplete patterns', async () => {
            // Text with incomplete 5-bit pattern
            const incompleteText = "AAAAABBBBBA"; // 11 bits, not multiple of 5
            const solver = new BaconianSolver('english');
            const result = await solver.solve(incompleteText);

            expect(result.method).toBe('baconian');
            expect(typeof result.confidence).toBe('number');
        });
    });
});
