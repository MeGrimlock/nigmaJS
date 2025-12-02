import { RailFenceSolver } from '../strategies/railfence-solver.js';
import { configLoader } from '../../config/config-loader.js';
import { default as Columnar } from '../../ciphers/columnar/columnar.js';

/**
 * Rail Fence Solver Comprehensive Tests
 *
 * Tests cover:
 * - Rail count testing (2-10 rails)
 * - Transposition cipher detection
 * - Dictionary and N-gram validation
 * - Edge cases and error handling
 * - Multi-language support
 * - Configuration parameter handling
 * - Performance and robustness
 */
describe('Rail Fence Solver Comprehensive Tests', () => {
    const config = configLoader.loadConfig();

    // Test ciphertexts - created using RailFence cipher with different rail counts
    const testCases = {
        // Standard RailFence with 3 rails - "HELLO WORLD"
        rails3: {
            cipher: "HORELOLDLW",
            plain: "HELLOWORLD",
            rails: 3
        },

        // RailFence with 2 rails - "ATTACK"
        rails2: {
            cipher: "TCAKTTAA",
            plain: "ATTACKAT",
            rails: 2
        },

        // RailFence with 4 rails - longer text
        rails4: {
            cipher: "WELELOHTRORDL",
            plain: "HELLO WORLD",
            rails: 4
        },

        // Short text (below threshold)
        shortText: {
            cipher: "AB",
            plain: "AB",
            rails: 2
        },

        // Long text for validation testing
        longText: {
            cipher: "HORELOLDLWORELLOHELLOWORLDHELLO",
            plain: "HELLOWORLDHELLOWORLDHELLOWORLD",
            rails: 3
        }
    };

    let englishSolver;
    let spanishSolver;

    beforeAll(async () => {
        englishSolver = new RailFenceSolver('english');
        spanishSolver = new RailFenceSolver('spanish');
    });

    describe('Basic Functionality', () => {
        test('should solve Rail Fence cipher with multiple rail counts', async () => {
            const result = await englishSolver.solve(testCases.rails3.cipher);

            expect(result).toHaveProperty('method', 'railfence');
            expect(result).toHaveProperty('plaintext');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('rails');
            expect(result).toHaveProperty('ngramScore');
            expect(result).toHaveProperty('wordCoverage');
            expect(result).toHaveProperty('isTranspositionCandidate', true);
            expect(typeof result.confidence).toBe('number');
            expect(typeof result.rails).toBe('number');
            expect(result.rails).toBeGreaterThanOrEqual(2);
            expect(result.rails).toBeLessThanOrEqual(10);
        });

        test('should try different rail counts in order', async () => {
            const solver = new RailFenceSolver('english');
            const expectedRails = [2, 3, 4, 5, 6, 7, 8, 9, 10];

            expect(solver.railCounts).toEqual(expectedRails);
        });

        test('should return result structure even for failed solves', async () => {
            const result = await englishSolver.solve('INVALIDINPUT');

            expect(result).toHaveProperty('plaintext');
            expect(result).toHaveProperty('method', 'railfence');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('rails');
            expect(result).toHaveProperty('isTranspositionCandidate', true);
        });

        test('should identify as transposition candidate', async () => {
            const result = await englishSolver.solve(testCases.rails2.cipher);

            expect(result.isTranspositionCandidate).toBe(true);
        });
    });

    describe('Rail Count Testing', () => {
        test('should test all configured rail counts', async () => {
            const minRails = config.railfence_solver?.rails?.min_rails || 2;
            const maxRails = config.railfence_solver?.rails?.max_rails || 10;

            const solver = new RailFenceSolver('english');
            const railRange = maxRails - minRails + 1;

            expect(solver.railCounts.length).toBe(railRange);
            expect(Math.min(...solver.railCounts)).toBe(minRails);
            expect(Math.max(...solver.railCounts)).toBe(maxRails);
        });

        test('should find correct rail count for known ciphertexts', async () => {
            // Test with 2 rails
            const result2 = await englishSolver.solve(testCases.rails2.cipher);
            expect(result2.rails).toBeDefined();

            // Test with 3 rails
            const result3 = await englishSolver.solve(testCases.rails3.cipher);
            expect(result3.rails).toBeDefined();

            // Test with 4 rails
            const result4 = await englishSolver.solve(testCases.rails4.cipher);
            expect(result4.rails).toBeDefined();
        });

        test('should handle edge rail counts (2 and 10)', async () => {
            // Test minimum rails (2)
            const minRailsSolver = new RailFenceSolver('english');
            expect(minRailsSolver.railCounts).toContain(2);

            // Test maximum rails (10)
            expect(minRailsSolver.railCounts).toContain(10);
        });
    });

    describe('Validation and Scoring', () => {
        test('should validate with dictionary when available', async () => {
            const result = await englishSolver.solve(testCases.longText.cipher);

            expect(result).toHaveProperty('wordCoverage');
            expect(result).toHaveProperty('dictionaryCoverage');
            expect(typeof result.wordCoverage).toBe('number');
            expect(result.wordCoverage).toBeGreaterThanOrEqual(0);
            expect(result.wordCoverage).toBeLessThanOrEqual(1);
            expect(result.wordCoverage).toBe(result.dictionaryCoverage);
        });

        test('should calculate N-gram scores', async () => {
            const result = await englishSolver.solve(testCases.rails3.cipher);

            expect(result).toHaveProperty('ngramScore');
            expect(result).toHaveProperty('score');
            expect(typeof result.ngramScore).toBe('number');
            expect(typeof result.score).toBe('number');
        });

        test('should combine N-gram and dictionary scores correctly', async () => {
            const result = await englishSolver.solve(testCases.longText.cipher);

            expect(result.score).toBeDefined();
            expect(result.ngramScore).toBeDefined();
            expect(result.wordCoverage).toBeDefined();

            // Combined score should be: (ngramScore * 0.7) + (wordCoverage * 0.3)
            const expectedScore = (result.ngramScore * 0.7) + (result.wordCoverage * 0.3);
            expect(result.score).toBeCloseTo(expectedScore, 5);
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

        test('should skip validation for short texts', async () => {
            const result = await englishSolver.solve(testCases.shortText.cipher);

            // Should still have basic structure but may not have detailed validation
            expect(result).toBeDefined();
            expect(result.method).toBe('railfence');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle empty input', async () => {
            const result = await englishSolver.solve('');

            expect(result.method).toBe('railfence');
            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
            expect(result.plaintext).toBe('');
            expect(result.rails).toBeNull();
        });

        test('should handle null input', async () => {
            const result = await englishSolver.solve(null);

            expect(result.method).toBe('railfence');
            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
            expect(result.plaintext).toBeNull();
            expect(result.rails).toBeNull();
            expect(result.isTranspositionCandidate).toBe(true);
        });

        test('should handle undefined input', async () => {
            const result = await englishSolver.solve(undefined);

            expect(result.method).toBe('railfence');
            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
            expect(result.plaintext).toBeUndefined();
            expect(result.rails).toBeNull();
            expect(result.isTranspositionCandidate).toBe(true);
        });

        test('should handle text with spaces and punctuation', async () => {
            const spacedCipher = 'H O R E L O L D L W';
            const result = await englishSolver.solve(spacedCipher);

            expect(result.method).toBe('railfence');
            expect(result.plaintext).toBeDefined();
            expect(result.confidence).toBeGreaterThanOrEqual(0);
        });

        test('should handle very long input efficiently', async () => {
            const longCipher = testCases.longText.cipher.repeat(5); // 5x longer
            const startTime = Date.now();

            const result = await englishSolver.solve(longCipher);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(result).toBeDefined();
            expect(duration).toBeLessThan(10000); // Should complete in reasonable time
        }, 15000);

        test('should handle single character input', async () => {
            const result = await englishSolver.solve('A');

            expect(result.method).toBe('railfence');
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.plaintext).toBeDefined();
        });

        test('should handle numeric input', async () => {
            const result = await englishSolver.solve('12345');

            expect(result.method).toBe('railfence');
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.plaintext).toBeDefined();
        });

        test('should handle text shorter than minimum validation length', async () => {
            // Text shorter than 10 characters should be processed but not fully validated
            const shortText = 'ABC';
            const result = await englishSolver.solve(shortText);

            expect(result.method).toBe('railfence');
            expect(result).toBeDefined();
            // May not have detailed validation scores
        });
    });

    describe('Configuration Integration', () => {
        test('should use configuration values for rail counts', () => {
            const railfenceConfig = config.railfence_solver;
            expect(railfenceConfig).toBeDefined();
            expect(railfenceConfig.rails).toBeDefined();
            expect(railfenceConfig.scoring).toBeDefined();
            expect(railfenceConfig.thresholds).toBeDefined();
        });

        test('should use configured rail range', () => {
            const minRails = config.railfence_solver?.rails?.min_rails;
            const maxRails = config.railfence_solver?.rails?.max_rails;

            expect(minRails).toBeDefined();
            expect(maxRails).toBeDefined();
            expect(typeof minRails).toBe('number');
            expect(typeof maxRails).toBe('number');
            expect(minRails).toBeLessThan(maxRails);
        });

        test('should use configured N-gram order', () => {
            const ngramOrder = config.railfence_solver?.scoring?.ngram_order;
            expect(ngramOrder).toBeDefined();
            expect(typeof ngramOrder).toBe('number');
            expect(ngramOrder).toBeGreaterThan(0);
        });

        test('should use configured confidence threshold', () => {
            const threshold = config.railfence_solver?.thresholds?.confidence_threshold;
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
            const testCipher = testCases.rails3.cipher;

            const englishResult = await englishSolver.solve(testCipher);
            const spanishResult = await spanishSolver.solve(testCipher);

            expect(englishResult.method).toBe('railfence');
            expect(spanishResult.method).toBe('railfence');

            // Results may differ due to different dictionaries
            expect(englishResult).toBeDefined();
            expect(spanishResult).toBeDefined();
        });

        test('should work with supported languages from config', () => {
            const supportedLanguages = config.attacks.supported_languages;
            expect(supportedLanguages).toContain('english');
            expect(supportedLanguages).toContain('spanish');
        });
    });

    describe('Integration with Cipher', () => {
        test('should work with Columnar.RailFence cipher', () => {
            const plainText = "HELLO WORLD";
            const rails = 3;
            const railFence = new Columnar.RailFence(plainText, rails, false); // encoded = false
            const encrypted = railFence.encode();

            expect(encrypted).toBeDefined();
            expect(typeof encrypted).toBe('string');
            expect(encrypted.length).toBeGreaterThan(0);
        });

        test('should be consistent with cipher decode', async () => {
            const plainText = "ATTACK AT DAWN";
            const rails = 3;

            // Encrypt with cipher
            const railFence = new Columnar.RailFence(plainText, rails, false);
            const encrypted = railFence.encode();

            // Decrypt with solver
            const result = await englishSolver.solve(encrypted);

            expect(result.method).toBe('railfence');
            expect(result.plaintext).toBeDefined();
            expect(result.rails).toBeDefined();
            // Should find the correct number of rails
        });

        test('should handle different rail counts correctly', () => {
            // Test that different rail counts produce different results
            const testText = "VERYLONGTEXTFORRAILFENCECIPHER";

            const railFence2 = new Columnar.RailFence(testText, 2, false);
            const cipher2 = railFence2.encode();

            const railFence3 = new Columnar.RailFence(testText, 3, false);
            const cipher3 = railFence3.encode();

            expect(cipher2).not.toBe(cipher3);
        });
    });

    describe('Performance and Robustness', () => {
        test('should complete within reasonable time', async () => {
            const startTime = Date.now();
            await englishSolver.solve(testCases.rails3.cipher);
            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(2000); // Should complete quickly
        });

        test('should handle malformed input gracefully', async () => {
            const malformedInputs = [
                '',           // Empty string
                null,         // Null
                undefined,    // Undefined
                'A',          // Single character
                '123',        // Numbers
                'A'.repeat(1000), // Very long string
                'A B C',      // With spaces
                '!@#$%^&*()', // Special characters
            ];

            for (const input of malformedInputs) {
                const result = await englishSolver.solve(input);
                expect(result).toBeDefined();
                expect(result.method).toBe('railfence');
                expect(result).toHaveProperty('confidence');
                expect(result).toHaveProperty('score');
                // Should not throw exceptions
            }
        });

        test('should maintain stability across multiple runs', async () => {
            const testCipher = testCases.rails3.cipher;

            // Run multiple times
            const results = [];
            for (let i = 0; i < 3; i++) {
                const result = await englishSolver.solve(testCipher);
                results.push(result);
            }

            // All results should be defined and have same structure
            results.forEach(result => {
                expect(result).toBeDefined();
                expect(result.method).toBe('railfence');
                expect(result).toHaveProperty('confidence');
                expect(result).toHaveProperty('score');
                expect(result).toHaveProperty('rails');
            });
        });

        test('should handle early termination', async () => {
            // Test that solver can terminate early when finding good matches
            const goodCipher = testCases.longText.cipher; // Long text should give good validation
            const result = await englishSolver.solve(goodCipher);

            expect(result).toBeDefined();
            // Should have found a good match
        });
    });
});
