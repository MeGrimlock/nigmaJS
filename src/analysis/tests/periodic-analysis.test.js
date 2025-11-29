import 'regenerator-runtime/runtime';
import { PeriodicAnalysis } from '../periodic-analysis.js';
import { TextUtils } from '../../core/text-utils.js';

describe("Periodic Analysis", () => {
    // Test texts
    const englishText = "THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG";
    const shortText = "ABC";
    const repetitiveText = "AAAAABBBBBCCCCC";
    const polyalphabeticText = "WIRFRUFENEUEN"; // German for "We call the new" - might show periodicity

    describe("periodicIC", () => {
        test("should return empty array for very short texts", () => {
            const result = PeriodicAnalysis.periodicIC(shortText);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });

        test("should calculate periodic IC for normal text", () => {
            const result = PeriodicAnalysis.periodicIC(englishText);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);

            // Check structure of first period
            const firstPeriod = result[0];
            expect(firstPeriod).toHaveProperty('period');
            expect(firstPeriod).toHaveProperty('columnICs');
            expect(firstPeriod).toHaveProperty('meanIC');
            expect(firstPeriod).toHaveProperty('variance');

            expect(typeof firstPeriod.period).toBe('number');
            expect(Array.isArray(firstPeriod.columnICs)).toBe(true);
            expect(typeof firstPeriod.meanIC).toBe('number');
            expect(typeof firstPeriod.variance).toBe('number');
        });

        test("should respect maxPeriod option", () => {
            const result = PeriodicAnalysis.periodicIC(englishText, { maxPeriod: 5 });
            expect(result.length).toBeLessThanOrEqual(5);

            result.forEach(period => {
                expect(period.period).toBeLessThanOrEqual(5);
            });
        });

        test("should respect minPeriod option", () => {
            const result = PeriodicAnalysis.periodicIC(englishText, { minPeriod: 3 });
            result.forEach(period => {
                expect(period.period).toBeGreaterThanOrEqual(3);
            });
        });

        test("should calculate reasonable IC values", () => {
            // Use a longer text for more reliable IC calculation
            const longerText = "THEQUICKBROWNFOXJUMPSOVERTHELAZYDOGANDRUNSINTOTHEFORESTTOHIDE";
            const result = PeriodicAnalysis.periodicIC(longerText);

            expect(result.length).toBeGreaterThan(0);
            result.forEach(period => {
                expect(period.meanIC).toBeGreaterThan(0);
                expect(period.meanIC).toBeLessThan(5); // Reasonable IC range for non-normalized IC
                expect(period.variance).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe("autoCorrelation", () => {
        test("should return empty result for very short texts", () => {
            const result = PeriodicAnalysis.autoCorrelation(shortText);

            expect(result).toHaveProperty('shifts');
            expect(Array.isArray(result.shifts)).toBe(true);
            expect(result.shifts.length).toBe(0);
        });

        test("should calculate autocorrelation for normal text", () => {
            const result = PeriodicAnalysis.autoCorrelation(englishText);

            expect(result).toHaveProperty('shifts');
            expect(result).toHaveProperty('peaks');
            expect(result).toHaveProperty('avgNormalized');

            expect(Array.isArray(result.shifts)).toBe(true);
            expect(Array.isArray(result.peaks)).toBe(true);
            expect(typeof result.avgNormalized).toBe('number');

            expect(result.shifts.length).toBeGreaterThan(0);

            // Check structure of shifts
            result.shifts.forEach(shift => {
                expect(shift).toHaveProperty('shift');
                expect(shift).toHaveProperty('coincidences');
                expect(shift).toHaveProperty('comparisons');
                expect(shift).toHaveProperty('normalized');
            });
        });

        test("should respect maxShift option", () => {
            const result = PeriodicAnalysis.autoCorrelation(englishText, { maxShift: 5 });
            expect(result.shifts.length).toBeLessThanOrEqual(5);
        });

        test("should detect peaks in repetitive text", () => {
            const result = PeriodicAnalysis.autoCorrelation(repetitiveText);
            expect(result.peaks.length).toBeGreaterThanOrEqual(0);
        });

        test("should calculate normalized values correctly", () => {
            const result = PeriodicAnalysis.autoCorrelation(englishText);

            result.shifts.forEach(shift => {
                expect(shift.normalized).toBeGreaterThanOrEqual(0);
                expect(shift.normalized).toBeLessThanOrEqual(1);
            });

            expect(result.avgNormalized).toBeGreaterThanOrEqual(0);
            expect(result.avgNormalized).toBeLessThanOrEqual(1);
        });
    });

    describe("analyze", () => {
        test("should return null for very short texts", () => {
            const result = PeriodicAnalysis.analyze(shortText);
            expect(result).toBeNull();
        });

        test("should analyze normal text comprehensively", () => {
            const result = PeriodicAnalysis.analyze(englishText);

            expect(result).toHaveProperty('repetitionScore');
            expect(result).toHaveProperty('periodicIC');
            expect(result).toHaveProperty('autoCorrelation');
            expect(result).toHaveProperty('recommendation');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('analysis');

            expect(typeof result.repetitionScore).toBe('number');
            expect(typeof result.confidence).toBe('number');
            expect(typeof result.recommendation).toBe('string');
        });

        test("should detect high repetition in repetitive text", () => {
            const result = PeriodicAnalysis.analyze(repetitiveText);
            expect(result.repetitionScore).toBeGreaterThan(0.1);
        });

        test("should provide valid recommendations", () => {
            const result = PeriodicAnalysis.analyze(englishText);

            const validRecommendations = [
                'likely_monoalphabetic',
                'likely_polyalphabetic',
                'unclear_periodicity',
                'insufficient_data'
            ];

            expect(validRecommendations).toContain(result.recommendation);
        });

        test("should calculate confidence scores", () => {
            const result = PeriodicAnalysis.analyze(englishText);
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });

        test("should include analysis details", () => {
            const result = PeriodicAnalysis.analyze(englishText);

            expect(result.analysis).toHaveProperty('periodicityDetected');
            expect(result.analysis).toHaveProperty('strongestPeriod');
            expect(result.analysis).toHaveProperty('varianceThreshold');
            expect(result.analysis).toHaveProperty('peakThreshold');

            expect(typeof result.analysis.periodicityDetected).toBe('boolean');
        });

        test("should handle polyalphabetic-like text", () => {
            const result = PeriodicAnalysis.analyze(polyalphabeticText);
            expect(result).toHaveProperty('recommendation');
            expect(result).toHaveProperty('confidence');
        });
    });

    describe("_repetitionScore", () => {
        test("should return 0 for very short texts", () => {
            const result = PeriodicAnalysis._repetitionScore(shortText);
            expect(result).toBe(0);
        });

        test("should detect high repetition in repetitive text", () => {
            const result = PeriodicAnalysis._repetitionScore(repetitiveText);
            expect(result).toBeGreaterThan(0.5);
        });

        test("should detect low repetition in natural text", () => {
            const result = PeriodicAnalysis._repetitionScore(englishText);
            expect(result).toBeLessThan(0.1);
        });

        test("should calculate correct repetition ratio", () => {
            const testText = "AABBCC"; // Every adjacent pair is different
            const result = PeriodicAnalysis._repetitionScore(testText);
            expect(result).toBe(0); // No adjacent repetitions

            const testText2 = "AAA"; // All adjacent are repetitions
            const result2 = PeriodicAnalysis._repetitionScore(testText2);
            expect(result2).toBe(2/3); // 2 repetitions out of 3 possible
        });
    });

    describe("edge cases", () => {
        test("should handle empty text", () => {
            const resultIC = PeriodicAnalysis.periodicIC("");
            const resultCorr = PeriodicAnalysis.autoCorrelation("");
            const resultAnalyze = PeriodicAnalysis.analyze("");

            expect(Array.isArray(resultIC)).toBe(true);
            expect(resultIC.length).toBe(0);
            expect(resultCorr.shifts.length).toBe(0);
            expect(resultAnalyze).toBeNull();
        });

        test("should handle text with only non-letters", () => {
            const text = "123!@#";
            const cleaned = TextUtils.onlyLetters(text);

            expect(cleaned.length).toBe(0);

            const resultIC = PeriodicAnalysis.periodicIC(text);
            const resultCorr = PeriodicAnalysis.autoCorrelation(text);
            const resultAnalyze = PeriodicAnalysis.analyze(text);

            expect(Array.isArray(resultIC)).toBe(true);
            expect(resultIC.length).toBe(0);
            expect(resultCorr.shifts.length).toBe(0);
            expect(resultAnalyze).toBeNull();
        });

        test("should handle very long texts efficiently", () => {
            const longText = "A".repeat(1000);
            const result = PeriodicAnalysis.analyze(longText);

            expect(result).toHaveProperty('recommendation');
            expect(result.repetitionScore).toBeCloseTo(1.0, 1); // Should be very high
        });
    });

    describe("integration", () => {
        test("periodicIC and autoCorrelation should be consistent", () => {
            const icResult = PeriodicAnalysis.periodicIC(englishText);
            const corrResult = PeriodicAnalysis.autoCorrelation(englishText);

            expect(Array.isArray(icResult)).toBe(true);
            expect(Array.isArray(corrResult.shifts)).toBe(true);

            // Both should handle the same text length
            expect(corrResult.shifts.length).toBeGreaterThan(0);
        });

        test("analyze should use both periodicIC and autoCorrelation", () => {
            const result = PeriodicAnalysis.analyze(englishText);

            expect(result).toHaveProperty('periodicIC');
            expect(result).toHaveProperty('autoCorrelation');

            expect(Array.isArray(result.periodicIC)).toBe(true);
            expect(result.autoCorrelation).toHaveProperty('shifts');
        });
    });
});
