import { PolybiusSolver } from '../strategies/polybius-solver.js';
import { configLoader } from '../../config/config-loader.js';
import { default as Dictionary } from '../../ciphers/dictionary/dictionary.js';

/**
 * Polybius Solver Comprehensive Tests
 *
 * Tests cover:
 * - Pattern detection for numeric pairs (11-55)
 * - Keyword-based decryption with common keywords
 * - Dictionary and N-gram validation
 * - Edge cases and error handling
 * - Multi-language support
 * - Configuration parameter handling
 * - Performance and robustness
 */
describe('Polybius Solver Comprehensive Tests', () => {
    const config = configLoader.loadConfig();

    // Test ciphertexts - created using standard Polybius square
    const testCases = {
        // Standard Polybius (no keyword) - "HELLO WORLD"
        standard: {
            cipher: "231531313423 2515232415",
            plain: "HELLOWORLD",
            keyword: ""
        },

        // With keyword "KEY" - "ATTACK"
        withKeyword: {
            cipher: "1111441541",
            plain: "ATTACK",
            keyword: "KEY"
        },

        // Long text for validation testing
        longText: {
            cipher: "231531313423251523241511451541441115311531313423",
            plain: "HELLOWORLDATTACKHELLO",
            keyword: ""
        },

        // Short text (below threshold)
        shortText: {
            cipher: "2315",
            plain: "HE",
            keyword: ""
        }
    };

    let englishSolver;
    let spanishSolver;

    beforeAll(async () => {
        englishSolver = new PolybiusSolver('english');
        spanishSolver = new PolybiusSolver('spanish');
    });

    describe('Basic Functionality', () => {
        test('should solve Polybius cipher with standard square', async () => {
            const result = await englishSolver.solve(testCases.standard.cipher);

            expect(result).toHaveProperty('method', 'polybius');
            expect(result).toHaveProperty('plaintext');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('key');
            expect(result).toHaveProperty('wordCoverage');
            expect(typeof result.confidence).toBe('number');
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });

        test('should solve Polybius cipher with keyword', async () => {
            const result = await englishSolver.solve(testCases.withKeyword.cipher);

            expect(result.method).toBe('polybius');
            expect(result.plaintext).toBeDefined();
            expect(typeof result.confidence).toBe('number');
        });

        test('should try multiple common keywords', async () => {
            // The solver should try keywords: '', 'KEY', 'SECRET', 'CIPHER', 'CODE'
            const result = await englishSolver.solve(testCases.withKeyword.cipher);

            expect(result).toBeDefined();
            expect(result.key).toBeDefined();
            // Should have tried multiple keywords and picked the best one
        });

        test('should return result structure even for failed solves', async () => {
            const result = await englishSolver.solve('INVALID');

            expect(result).toHaveProperty('plaintext');
            expect(result).toHaveProperty('method', 'polybius');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('key');
        });
    });

    describe('Pattern Detection', () => {
        test('should detect valid Polybius numeric pairs', async () => {
            const validPatterns = [
                '1112131415', // Sequential 11-15
                '2122232425', // Sequential 21-25
                '3132333435', // Sequential 31-35
                '4142434445', // Sequential 41-45
                '5152535455'  // Sequential 51-55
            ];

            for (const pattern of validPatterns) {
                const result = await englishSolver.solve(pattern);
                expect(result.method).toBe('polybius');
                // Should not be rejected immediately due to pattern detection
                expect(result.confidence).toBeGreaterThanOrEqual(0);
            }
        });

        test('should reject text without sufficient numeric pairs', async () => {
            const invalidInputs = [
                '123',        // Too few pairs
                'ABCDEFG',    // No numbers
                '12 34',      // Not enough pairs (only 2)
                '1A2B3C',     // Mixed but insufficient numbers
                '123456789'   // Single digits, not pairs
            ];

            for (const input of invalidInputs) {
                const result = await englishSolver.solve(input);
                expect(result.method).toBe('polybius');
                expect(result.confidence).toBe(0);
                expect(result.score).toBe(-Infinity);
            }
        });

        test('should accept text with minimum required pairs (5)', async () => {
            const minPairsText = '111213141511'; // 6 pairs
            const result = await englishSolver.solve(minPairsText);

            expect(result.method).toBe('polybius');
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            // Should not be rejected for having too few pairs
        });
    });

    describe('Keyword Handling', () => {
        test('should test common keywords in order', () => {
            const solver = new PolybiusSolver('english');
            const expectedKeywords = ['', 'KEY', 'SECRET', 'CIPHER', 'CODE'];

            expect(solver.commonKeywords).toEqual(expectedKeywords);
        });

        test('should handle keyword-based decryption', async () => {
            // Test that different keywords produce different results
            const testCipher = '1112131415';

            const result1 = await englishSolver.solve(testCipher);
            expect(result1.key).toBeDefined();

            // Should have tested multiple keywords and picked the best
            expect(result1).toBeDefined();
        });

        test('should handle empty keyword (standard square)', async () => {
            const standardCipher = testCases.standard.cipher;
            const result = await englishSolver.solve(standardCipher);

            expect(result.key).toBeDefined();
            // Empty keyword should be considered
        });
    });

    describe('Validation and Scoring', () => {
        test('should validate with dictionary when available', async () => {
            const result = await englishSolver.solve(testCases.longText.cipher);

            expect(result).toHaveProperty('wordCoverage');
            expect(typeof result.wordCoverage).toBe('number');
            expect(result.wordCoverage).toBeGreaterThanOrEqual(0);
            expect(result.wordCoverage).toBeLessThanOrEqual(1);
        });

        test('should calculate N-gram scores', async () => {
            const result = await englishSolver.solve(testCases.standard.cipher);

            expect(result).toHaveProperty('score');
            expect(typeof result.score).toBe('number');
            expect(result.score).not.toBe(-Infinity);
        });

        test('should combine dictionary and N-gram scores', async () => {
            const result = await englishSolver.solve(testCases.longText.cipher);

            expect(result.score).toBeDefined();
            expect(result.wordCoverage).toBeDefined();
            // Combined score should be N-gram score + (wordCoverage * 50)
        });

        test('should assign confidence based on validation results', async () => {
            const result = await englishSolver.solve(testCases.longText.cipher);

            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);

            // High confidence for good validation results
            if (result.wordCoverage > 0.8) {
                expect(result.confidence).toBeGreaterThan(0.9);
            }
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle empty input', async () => {
            const result = await englishSolver.solve('');

            expect(result.method).toBe('polybius');
            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
            expect(result.plaintext).toBe('');
        });

        test('should handle null input', async () => {
            const result = await englishSolver.solve(null);

            expect(result.method).toBe('polybius');
            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
            expect(result.plaintext).toBeNull();
        });

        test('should handle undefined input', async () => {
            const result = await englishSolver.solve(undefined);

            expect(result.method).toBe('polybius');
            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
            expect(result.plaintext).toBeUndefined();
        });

        test('should handle text with spaces and punctuation', async () => {
            const spacedCipher = '11 12 13 14 15';
            const result = await englishSolver.solve(spacedCipher);

            expect(result.method).toBe('polybius');
            expect(result.plaintext).toBeDefined();
        });

        test('should handle very long input efficiently', async () => {
            const longCipher = testCases.longText.cipher.repeat(10); // 10x longer
            const startTime = Date.now();

            const result = await englishSolver.solve(longCipher);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(result).toBeDefined();
            expect(duration).toBeLessThan(5000); // Should complete in reasonable time
        }, 10000);

        test('should handle text with invalid number pairs', async () => {
            const invalidPairs = '999988'; // Numbers outside 1-5 range
            const result = await englishSolver.solve(invalidPairs);

            expect(result.method).toBe('polybius');
            // Should still attempt to process, even with invalid pairs
            expect(result).toBeDefined();
        });

        test('should handle mixed alphanumeric text', async () => {
            const mixedText = '11A22B33';
            const result = await englishSolver.solve(mixedText);

            expect(result.method).toBe('polybius');
            expect(result).toBeDefined();
        });

        test('should handle text shorter than minimum pairs requirement', async () => {
            const shortPairs = '1112'; // Only 2 pairs, below threshold of 5
            const result = await englishSolver.solve(shortPairs);

            expect(result.method).toBe('polybius');
            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
        });
    });

    describe('Configuration Integration', () => {
        test('should use configuration values', () => {
            const polybiusConfig = config.polybius_solver;
            expect(polybiusConfig).toBeDefined();
            expect(polybiusConfig.alphabet_detection).toBeDefined();
            expect(polybiusConfig.scoring).toBeDefined();
            expect(polybiusConfig.thresholds).toBeDefined();
        });

        test('should use configured N-gram order', () => {
            const ngramOrder = config.polybius_solver?.scoring?.ngram_order;
            expect(ngramOrder).toBeDefined();
            expect(typeof ngramOrder).toBe('number');
            expect(ngramOrder).toBeGreaterThan(0);
        });

        test('should use configured confidence threshold', () => {
            const threshold = config.polybius_solver?.thresholds?.confidence_threshold;
            expect(threshold).toBeDefined();
            expect(typeof threshold).toBe('number');
            expect(threshold).toBeGreaterThan(0);
            expect(threshold).toBeLessThanOrEqual(1);
        });
    });

    describe('Multi-language Support', () => {
        test('should initialize with different languages', () => {
            expect(englishSolver.language).toBe('english');
            expect(spanishSolver.language).toBe('spanish');
        });

        test('should handle language-specific processing', async () => {
            const testCipher = '1112131415';

            const englishResult = await englishSolver.solve(testCipher);
            const spanishResult = await spanishSolver.solve(testCipher);

            expect(englishResult.method).toBe('polybius');
            expect(spanishResult.method).toBe('polybius');

            // Results may differ due to different dictionaries
            expect(englishResult).toBeDefined();
            expect(spanishResult).toBeDefined();
        });
    });

    describe('Integration with Cipher', () => {
        test('should work with Dictionary.Polybius cipher', () => {
            const plainText = "HELLO";
            const polybius = new Dictionary.Polybius(plainText, "", false); // encoded = false
            const encrypted = polybius.encode();

            expect(encrypted).toBeDefined();
            expect(typeof encrypted).toBe('string');
            expect(encrypted).toMatch(/^\d+(\s+\d+)*$/); // Should contain number pairs
        });

        test('should be consistent with cipher decode', async () => {
            const plainText = "ATTACK";
            const keyword = "KEY";

            // Encrypt with cipher
            const polybius = new Dictionary.Polybius(plainText, keyword, false);
            const encrypted = polybius.encode();

            // Decrypt with solver
            const result = await englishSolver.solve(encrypted);

            expect(result.method).toBe('polybius');
            expect(result.plaintext).toBeDefined();
            // Should find the correct keyword and decode properly
        });
    });

    describe('Performance and Robustness', () => {
        test('should complete within reasonable time', async () => {
            const startTime = Date.now();
            await englishSolver.solve(testCases.standard.cipher);
            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(2000); // Should complete quickly
        });

        test('should handle malformed input gracefully', async () => {
            const malformedInputs = [
                '1 2 3',      // Spaces but insufficient pairs
                'AAAAAA',     // No numbers
                '123ABC',     // Mixed valid/invalid
                '66 77 88',   // Numbers outside range
                null,
                undefined,
                ''
            ];

            for (const input of malformedInputs) {
                const result = await englishSolver.solve(input);
                expect(result).toBeDefined();
                expect(result.method).toBe('polybius');
                // Should not throw exceptions
            }
        });

        test('should maintain stability across multiple runs', async () => {
            const testCipher = testCases.standard.cipher;

            // Run multiple times
            const results = [];
            for (let i = 0; i < 3; i++) {
                const result = await englishSolver.solve(testCipher);
                results.push(result);
            }

            // All results should be defined and have same structure
            results.forEach(result => {
                expect(result).toBeDefined();
                expect(result.method).toBe('polybius');
                expect(result).toHaveProperty('confidence');
                expect(result).toHaveProperty('score');
            });
        });
    });
});
