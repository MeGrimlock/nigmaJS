import 'regenerator-runtime/runtime';
import { ShortTextPatterns } from '../short-text-patterns.js';

describe("Short Text Patterns", () => {
    const englishText = "THE QUICK BROWN FOX";
    const spanishText = "EL RAPIDO ZORRO MARRON";
    const shortText = "HI";
    const veryShortText = "A";

    describe("getCommonWords", () => {
        test("should return English common words", () => {
            const words = ShortTextPatterns.getCommonWords('english');
            expect(words).toBeInstanceOf(Set);
            expect(words.size).toBeGreaterThan(0);
            expect(words.has('THE')).toBe(true);
            expect(words.has('AND')).toBe(true);
        });

        test("should return Spanish common words", () => {
            const words = ShortTextPatterns.getCommonWords('spanish');
            expect(words).toBeInstanceOf(Set);
            expect(words.size).toBeGreaterThan(0);
            expect(words.has('EL')).toBe(true);
            expect(words.has('LA')).toBe(true);
        });

        test("should return empty set for unknown language", () => {
            const words = ShortTextPatterns.getCommonWords('unknown');
            expect(words).toBeInstanceOf(Set);
            expect(words.size).toBe(0);
        });
    });

    describe("getCommonBigrams", () => {
        test("should return English common bigrams", () => {
            const bigrams = ShortTextPatterns.getCommonBigrams('english');
            expect(bigrams).toBeInstanceOf(Set);
            expect(bigrams.size).toBeGreaterThan(0);
            expect(bigrams.has('TH')).toBe(true);
            expect(bigrams.has('HE')).toBe(true);
        });

        test("should return empty set for unsupported language", () => {
            const bigrams = ShortTextPatterns.getCommonBigrams('spanish');
            expect(bigrams).toBeInstanceOf(Set);
            expect(bigrams.size).toBe(0);
        });
    });

    describe("getCommonTrigrams", () => {
        test("should return English common trigrams", () => {
            const trigrams = ShortTextPatterns.getCommonTrigrams('english');
            expect(trigrams).toBeInstanceOf(Set);
            expect(trigrams.size).toBeGreaterThan(0);
            expect(trigrams.has('THE')).toBe(true);
        });

        test("should return empty set for unsupported language", () => {
            const trigrams = ShortTextPatterns.getCommonTrigrams('spanish');
            expect(trigrams).toBeInstanceOf(Set);
            expect(trigrams.size).toBe(0);
        });
    });

    describe("score", () => {
        test("should score English text", () => {
            const result = ShortTextPatterns.score(englishText, 'english');

            expect(result).toHaveProperty('wordScore');
            expect(result).toHaveProperty('bigramScore');
            expect(result).toHaveProperty('trigramScore');
            expect(result).toHaveProperty('combinedScore');
            expect(result).toHaveProperty('wordCount');
            expect(result).toHaveProperty('bigramCount');
            expect(result).toHaveProperty('trigramCount');

            expect(result.combinedScore).toBeGreaterThanOrEqual(0);
            expect(result.combinedScore).toBeLessThanOrEqual(1);
        });

        test("should score Spanish text", () => {
            const result = ShortTextPatterns.score(spanishText, 'spanish');
            expect(result.combinedScore).toBeGreaterThanOrEqual(0);
            expect(result.combinedScore).toBeLessThanOrEqual(1);
        });

        test("should handle short text gracefully", () => {
            const result = ShortTextPatterns.score(shortText, 'english');
            expect(result.combinedScore).toBeGreaterThanOrEqual(0);
            expect(result.combinedScore).toBeLessThanOrEqual(1);
        });

        test("should return zero scores for unknown language", () => {
            const result = ShortTextPatterns.score(englishText, 'unknown');
            expect(result.combinedScore).toBe(0);
            expect(result.wordScore).toBe(0);
            expect(result.bigramScore).toBe(0);
            expect(result.trigramScore).toBe(0);
        });

        test("should count words correctly", () => {
            const result = ShortTextPatterns.score("THE AND THE", 'english');
            expect(result.wordCount).toBeGreaterThan(0);
            expect(result.wordScore).toBe(result.wordCount / 3); // 3 words, should match wordCount if all are common
        });
    });

    describe("analyzeShortText", () => {
        test("should analyze normal text", () => {
            const result = ShortTextPatterns.analyzeShortText(englishText);

            expect(result).toHaveProperty('symmetryScore');
            expect(result).toHaveProperty('length');
            expect(result).toHaveProperty('hasSymmetry');

            expect(typeof result.symmetryScore).toBe('number');
            expect(result.symmetryScore).toBeGreaterThanOrEqual(0);
            expect(result.symmetryScore).toBeLessThanOrEqual(1);
            expect(result.length).toBe(englishText.replace(/[^A-Z]/g, '').length);
        });

        test("should handle very short text", () => {
            const result = ShortTextPatterns.analyzeShortText(veryShortText);
            expect(result.symmetryScore).toBe(0);
            expect(result.length).toBe(1);
            expect(result.hasSymmetry).toBe(false);
        });

        test("should handle text too short for symmetry analysis", () => {
            const result = ShortTextPatterns.analyzeShortText(shortText);
            expect(result.symmetryScore).toBe(0);
            expect(result.hasSymmetry).toBe(false);
        });

        test("should detect symmetry patterns", () => {
            // Create a symmetric text: ABC -> XYZ (A->Z, B->Y, C->X)
            const symmetricText = "ABCXYZ";
            const result = ShortTextPatterns.analyzeShortText(symmetricText);

            expect(result.length).toBe(6);
            expect(result.symmetryScore).toBeGreaterThanOrEqual(0);
            expect(typeof result.hasSymmetry).toBe('boolean');
        });

        test("should return correct length", () => {
            const testText = "HELLO WORLD!";
            const result = ShortTextPatterns.analyzeShortText(testText);
            expect(result.length).toBe(10); // Only letters
        });
    });

    describe("detect", () => {
        test("should be alias for analyzeShortText", () => {
            const result1 = ShortTextPatterns.analyzeShortText(englishText);
            const result2 = ShortTextPatterns.detect(englishText);

            expect(result1).toEqual(result2);
        });
    });

    describe("validate", () => {
        test("should validate high-scoring text", () => {
            const result = ShortTextPatterns.validate("THE AND THE", 'english', 0.1);
            expect(typeof result).toBe('boolean');
        });

        test("should validate low-scoring text", () => {
            const result = ShortTextPatterns.validate("XYZ QWERTY", 'english', 0.5);
            expect(typeof result).toBe('boolean');
        });

        test("should respect threshold parameter", () => {
            const score = ShortTextPatterns.score("THE AND THE", 'english');
            const threshold = score.combinedScore + 0.1;

            const result = ShortTextPatterns.validate("THE AND THE", 'english', threshold);
            expect(result).toBe(false);
        });

        test("should handle unknown language", () => {
            const result = ShortTextPatterns.validate(englishText, 'unknown');
            expect(result).toBe(false);
        });
    });

    describe("static properties", () => {
        test("should have common words sets", () => {
            expect(ShortTextPatterns.commonWordsEnglish).toBeInstanceOf(Set);
            expect(ShortTextPatterns.commonWordsSpanish).toBeInstanceOf(Set);

            expect(ShortTextPatterns.commonWordsEnglish.size).toBeGreaterThan(0);
            expect(ShortTextPatterns.commonWordsSpanish.size).toBeGreaterThan(0);
        });

        test("should have common n-grams sets", () => {
            expect(ShortTextPatterns.commonBigramsEnglish).toBeInstanceOf(Set);
            expect(ShortTextPatterns.commonTrigramsEnglish).toBeInstanceOf(Set);

            expect(ShortTextPatterns.commonBigramsEnglish.size).toBeGreaterThan(0);
            expect(ShortTextPatterns.commonTrigramsEnglish.size).toBeGreaterThan(0);
        });
    });

    describe("edge cases", () => {
        test("should handle empty text", () => {
            const score = ShortTextPatterns.score("", 'english');
            const analysis = ShortTextPatterns.analyzeShortText("");
            const validation = ShortTextPatterns.validate("", 'english');

            expect(score.combinedScore).toBe(0);
            expect(analysis.symmetryScore).toBe(0);
            expect(analysis.length).toBe(0);
            expect(validation).toBe(false);
        });

        test("should handle text with no letters", () => {
            const text = "123!@#$%";
            const score = ShortTextPatterns.score(text, 'english');
            const analysis = ShortTextPatterns.analyzeShortText(text);

            expect(score.combinedScore).toBe(0);
            expect(analysis.length).toBe(0);
        });

        test("should handle case insensitivity", () => {
            const upperResult = ShortTextPatterns.score("THE", 'english');
            const lowerResult = ShortTextPatterns.score("the", 'english');

            expect(upperResult.wordScore).toBe(lowerResult.wordScore);
        });

        test("should handle mixed case", () => {
            const result = ShortTextPatterns.score("The Quick", 'english');
            expect(result.combinedScore).toBeGreaterThan(0);
        });
    });

    describe("language support", () => {
        test("should support English fully", () => {
            const words = ShortTextPatterns.getCommonWords('english');
            const bigrams = ShortTextPatterns.getCommonBigrams('english');
            const trigrams = ShortTextPatterns.getCommonTrigrams('english');

            expect(words.size).toBeGreaterThan(0);
            expect(bigrams.size).toBeGreaterThan(0);
            expect(trigrams.size).toBeGreaterThan(0);
        });

        test("should support Spanish partially", () => {
            const words = ShortTextPatterns.getCommonWords('spanish');
            const bigrams = ShortTextPatterns.getCommonBigrams('spanish');

            expect(words.size).toBeGreaterThan(0);
            expect(bigrams.size).toBe(0); // Spanish doesn't have bigrams/trigrams defined
        });

        test("should handle unsupported languages gracefully", () => {
            const score = ShortTextPatterns.score(englishText, 'klingon');
            expect(score.combinedScore).toBe(0);
        });
    });
});
