import 'regenerator-runtime/runtime';
import { TranspositionDetector } from '../transposition-detector.js';

describe("Transposition Detector", () => {
    // Test texts
    const englishPlain = "THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG";
    const shortText = "ABC";
    const transpositionText = "TBJOFTHEQUICKBROWNFOXJUMPSOVERELAZYDG"; // Route transposition example

    describe("analyze", () => {
        test("should analyze normal English text", () => {
            const result = TranspositionDetector.analyze(englishPlain, 'english');

            expect(result).toHaveProperty('transpositionScore');
            expect(result).toHaveProperty('chiSquaredLetters');
            expect(result).toHaveProperty('ngramScoreCipher');
            expect(result).toHaveProperty('recommendation');

            expect(typeof result.transpositionScore).toBe('number');
            expect(result.transpositionScore).toBeGreaterThanOrEqual(0);
            expect(result.transpositionScore).toBeLessThanOrEqual(1);

            expect(typeof result.recommendation).toBe('string');
        });

        test("should handle short texts", () => {
            const result = TranspositionDetector.analyze(shortText, 'english');

            expect(result.transpositionScore).toBe(0.5);
            expect(result.chiSquaredLetters).toBeNull();
            expect(result.ngramScoreCipher).toBeNull();
            expect(result.recommendation).toBe('insufficient_data');
        });

        test("should handle 'auto' language parameter", () => {
            const result = TranspositionDetector.analyze(englishPlain, 'auto');
            expect(result).toHaveProperty('transpositionScore');
            expect(typeof result.transpositionScore).toBe('number');
        });

        test("should provide valid recommendations", () => {
            const result = TranspositionDetector.analyze(englishPlain, 'english');

            const validRecommendations = [
                'likely_transposition',
                'likely_substitution',
                'likely_polyalphabetic',
                'unclear_cipher_type',
                'insufficient_data',
                'ambiguous'
            ];

            expect(validRecommendations).toContain(result.recommendation);
        });

        test("should calculate chi-squared for letter frequencies", () => {
            const result = TranspositionDetector.analyze(englishPlain, 'english');

            if (result.chiSquaredLetters !== null) {
                expect(typeof result.chiSquaredLetters).toBe('number');
                expect(result.chiSquaredLetters).toBeGreaterThanOrEqual(0);
            }
        });

        test("should calculate n-gram score for ciphertext", () => {
            const result = TranspositionDetector.analyze(englishPlain, 'english');

            if (result.ngramScoreCipher !== null) {
                expect(typeof result.ngramScoreCipher).toBe('number');
                expect(result.ngramScoreCipher).toBeGreaterThanOrEqual(0);
                expect(result.ngramScoreCipher).toBeLessThanOrEqual(1);
            }
        });
    });

    describe("compare", () => {
        test("should compare two ciphertexts", () => {
            const result = TranspositionDetector.compare(
                englishPlain,
                transpositionText,
                'english'
            );

            expect(result).toHaveProperty('text1Analysis');
            expect(result).toHaveProperty('text2Analysis');
            expect(result).toHaveProperty('comparison');
            expect(result).toHaveProperty('recommendation');

            expect(result.text1Analysis).toHaveProperty('transpositionScore');
            expect(result.text2Analysis).toHaveProperty('transpositionScore');
            expect(typeof result.recommendation).toBe('string');
        });

        test("should provide meaningful comparison", () => {
            const result = TranspositionDetector.compare(
                englishPlain,
                transpositionText,
                'english'
            );

            expect(result.comparison).toHaveProperty('scoreDifference');
            expect(result.comparison).toHaveProperty('interpretation');

            expect(typeof result.comparison.scoreDifference).toBe('number');
            expect(typeof result.comparison.interpretation).toBe('string');
        });

        test("should handle short texts in comparison", () => {
            const result = TranspositionDetector.compare(
                shortText,
                "DEF",
                'english'
            );

            expect(result.text1Analysis.recommendation).toBe('insufficient_data');
            expect(result.text2Analysis.recommendation).toBe('insufficient_data');
        });
    });

    describe("_calculateLetterChiSquared", () => {
        test("should calculate chi-squared for letter frequencies", () => {
            const result = TranspositionDetector._calculateLetterChiSquared(englishPlain, 'english');

            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThanOrEqual(0);
        });

        test("should handle different languages", () => {
            const resultEnglish = TranspositionDetector._calculateLetterChiSquared(englishPlain, 'english');
            const resultSpanish = TranspositionDetector._calculateLetterChiSquared(englishPlain, 'spanish');

            expect(typeof resultEnglish).toBe('number');
            expect(typeof resultSpanish).toBe('number');
            // Results may differ based on language model
        });

        test("should handle short texts gracefully", () => {
            const result = TranspositionDetector._calculateLetterChiSquared(shortText, 'english');
            expect(typeof result).toBe('number');
        });
    });

    describe("_calculateCiphertextNgramScore", () => {
        test("should calculate n-gram score for ciphertext", () => {
            const result = TranspositionDetector._calculateCiphertextNgramScore(englishPlain, 'english');

            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(1);
        });

        test("should handle short texts", () => {
            const result = TranspositionDetector._calculateCiphertextNgramScore(shortText, 'english');
            expect(typeof result).toBe('number');
            // May return 0 for very short texts
        });

        test("should handle different languages", () => {
            const resultEnglish = TranspositionDetector._calculateCiphertextNgramScore(englishPlain, 'english');
            expect(typeof resultEnglish).toBe('number');

            // Should handle unsupported languages gracefully
            const resultUnsupported = TranspositionDetector._calculateCiphertextNgramScore(englishPlain, 'klingon');
            expect(typeof resultUnsupported).toBe('number');
        });
    });

    describe("_determineTranspositionScore", () => {
        test("should determine transposition score based on metrics", () => {
            const result = TranspositionDetector._determineTranspositionScore(10, 0.2, 100);

            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(1);
        });

        test("should handle different chi-squared values", () => {
            const lowChi = TranspositionDetector._determineTranspositionScore(5, 0.2, 100);
            const highChi = TranspositionDetector._determineTranspositionScore(50, 0.2, 100);

            expect(typeof lowChi).toBe('number');
            expect(typeof highChi).toBe('number');
        });

        test("should handle different n-gram scores", () => {
            const lowNgram = TranspositionDetector._determineTranspositionScore(10, 0.1, 100);
            const highNgram = TranspositionDetector._determineTranspositionScore(10, 0.8, 100);

            expect(typeof lowNgram).toBe('number');
            expect(typeof highNgram).toBe('number');
        });

        test("should handle different text lengths", () => {
            const shortText = TranspositionDetector._determineTranspositionScore(10, 0.2, 30);
            const longText = TranspositionDetector._determineTranspositionScore(10, 0.2, 1000);

            expect(typeof shortText).toBe('number');
            expect(typeof longText).toBe('number');
        });
    });

    describe("edge cases", () => {
        test("should handle empty text", () => {
            const result = TranspositionDetector.analyze("", 'english');
            expect(result.recommendation).toBe('insufficient_data');
        });

        test("should handle text with no letters", () => {
            const result = TranspositionDetector.analyze("123!@#", 'english');
            expect(result.recommendation).toBe('insufficient_data');
        });

        test("should handle very long texts", () => {
            const longText = "A".repeat(1000);
            const result = TranspositionDetector.analyze(longText, 'english');
            expect(typeof result.transpositionScore).toBe('number');
        });

        test("should handle unsupported languages", () => {
            const result = TranspositionDetector.analyze(englishPlain, 'klingon');
            expect(typeof result.transpositionScore).toBe('number');
            expect(result.recommendation).toBeDefined();
        });
    });

    describe("integration with transposition text", () => {
        test("should detect transposition patterns", () => {
            const result = TranspositionDetector.analyze(transpositionText, 'english');

            expect(result).toHaveProperty('transpositionScore');
            expect(result).toHaveProperty('recommendation');

            // Transposition text should potentially score differently than plain text
            const plainResult = TranspositionDetector.analyze(englishPlain, 'english');

            // Both should be valid numbers
            expect(typeof result.transpositionScore).toBe('number');
            expect(typeof plainResult.transpositionScore).toBe('number');
        });

        test("should compare plain vs transposition text", () => {
            const comparison = TranspositionDetector.compare(
                englishPlain,
                transpositionText,
                'english'
            );

            expect(comparison).toHaveProperty('comparison');
            expect(comparison.comparison).toHaveProperty('scoreDifference');
            expect(typeof comparison.comparison.scoreDifference).toBe('number');
        });
    });

    describe("algorithm validation", () => {
        test("transposition score should be reasonable", () => {
            const result = TranspositionDetector.analyze(englishPlain, 'english');

            // For plaintext, transposition score should be in reasonable range
            expect(result.transpositionScore).toBeGreaterThanOrEqual(0);
            expect(result.transpositionScore).toBeLessThanOrEqual(1);

            // Should have a definitive recommendation
            expect(result.recommendation).toBeDefined();
            expect(typeof result.recommendation).toBe('string');
        });

        test("should handle edge case where chi-squared is null", () => {
            // Force a case where chi-squared might be null (very short text)
            const result = TranspositionDetector.analyze("AB", 'english');
            expect(result.recommendation).toBe('insufficient_data');
        });
    });
});
