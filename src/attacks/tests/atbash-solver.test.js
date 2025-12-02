import { AtbashSolver } from '../strategies/atbash-solver.js';
import Dictionary from '../../ciphers/dictionary/dictionary.js';

/**
 * Atbash Solver Tests
 *
 * Tests the Atbash cipher solver functionality including:
 * - Basic decryption
 * - Confidence scoring
 * - Dictionary validation
 * - Error handling
 * - Edge cases
 */
describe('Atbash Solver', () => {
    // Test texts
    const englishPlain = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG";
    const englishCipher = "gsv jfrxp yildm ulc qfnkh levi gsv ozab wlt"; // Atbash of englishPlain (preserves case)

    describe('Basic Functionality', () => {
        test('should attempt to decrypt Atbash cipher', async () => {
            const solver = new AtbashSolver('english');
            const result = await solver.solve(englishCipher);

            expect(result.method).toBe('atbash');
            expect(result.key).toBeNull();
            expect(result.confidence).toBeGreaterThan(0.1);
            expect(result.plaintext).toBeTruthy();
            expect(typeof result.plaintext).toBe('string');
        });

        test('should return valid result structure', async () => {
            const solver = new AtbashSolver('english');
            const result = await solver.solve(englishCipher);

            expect(result).toHaveProperty('plaintext');
            expect(result).toHaveProperty('method');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('key');
            expect(result).toHaveProperty('wordCoverage');
        });

        test('should handle different languages', async () => {
            const spanishSolver = new AtbashSolver('spanish');
            const result = await spanishSolver.solve(englishCipher);

            expect(result.method).toBe('atbash');
            expect(typeof result.confidence).toBe('number');
        });
    });

    describe('Confidence Scoring', () => {
        test('should give high confidence for valid English text', async () => {
            const solver = new AtbashSolver('english');
            const result = await solver.solve(englishCipher);

            expect(result.confidence).toBeGreaterThan(0.6);
            expect(result.score).toBeGreaterThan(-20);
        });

        test('should give low confidence for invalid cipher', async () => {
            const solver = new AtbashSolver('english');
            const invalidCipher = "XYZ ABC DEF GHI"; // Random text
            const result = await solver.solve(invalidCipher);

            expect(result.confidence).toBeLessThan(0.7);
        });

        test('should calculate word coverage correctly', async () => {
            const solver = new AtbashSolver('english');
            const result = await solver.solve(englishCipher);

            expect(typeof result.wordCoverage).toBe('number');
            expect(result.wordCoverage).toBeGreaterThanOrEqual(0);
            expect(result.wordCoverage).toBeLessThanOrEqual(1);
        });
    });

    describe('Error Handling', () => {
        test('should handle empty input gracefully', async () => {
            const solver = new AtbashSolver('english');
            const result = await solver.solve('');

            expect(result.plaintext).toBe('');
            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
        });

        test('should handle null input gracefully', async () => {
            const solver = new AtbashSolver('english');
            const result = await solver.solve(null);

            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
        });

        test('should handle very short input', async () => {
            const solver = new AtbashSolver('english');
            const result = await solver.solve('AB');

            expect(result.method).toBe('atbash');
            expect(typeof result.confidence).toBe('number');
        });
    });

    describe('Cipher Integration', () => {
        test('should work with Dictionary.Atbash cipher', () => {
            // Verify our test data is correct by using the cipher directly
            const atbash = new Dictionary.Atbash(englishPlain, false); // encoded = false
            const encrypted = atbash.encode();
            expect(encrypted.toUpperCase()).toBe(englishCipher.toUpperCase());
        });

        test('should be consistent with cipher decode', () => {
            const atbash = new Dictionary.Atbash(englishCipher, true); // encoded = true
            const decrypted = atbash.decode();
            expect(decrypted.toUpperCase()).toContain('THE QUICK BROWN FOX');
        });
    });

    describe('Edge Cases', () => {
        test('should handle text with numbers and punctuation', async () => {
            const cipherWithExtras = "GSV JFRXP! 123 YILDM";
            const solver = new AtbashSolver('english');
            const result = await solver.solve(cipherWithExtras);

            expect(result.method).toBe('atbash');
            expect(result.plaintext).toBeTruthy();
        });

        test('should handle case sensitivity', async () => {
            const mixedCaseCipher = "Gsv Jfrxp Yildm Ulc";
            const solver = new AtbashSolver('english');
            const result = await solver.solve(mixedCaseCipher);

            expect(result.confidence).toBeGreaterThan(0.3);
        });

        test('should handle repeated characters', async () => {
            const repeatedCipher = "TTTT UUUU VVVV";
            const solver = new AtbashSolver('english');
            const result = await solver.solve(repeatedCipher);

            expect(result.method).toBe('atbash');
            expect(typeof result.confidence).toBe('number');
        });
    });
});
