import 'regenerator-runtime/runtime';
import { ICSampleCorrection } from '../ic-sample-correction.js';

describe("IC Sample Correction", () => {
    describe("expectedIC", () => {
        test("should return correct IC for English with sufficient text length", () => {
            const result = ICSampleCorrection.expectedIC(1000, 'english');
            expect(result).toBeCloseTo(1.73, 2);
        });

        test("should return correct IC for Spanish", () => {
            const result = ICSampleCorrection.expectedIC(1000, 'spanish');
            expect(result).toBeCloseTo(1.94, 2);
        });

        test("should adjust IC for very short texts (< 20 chars)", () => {
            const result = ICSampleCorrection.expectedIC(15, 'english');
            expect(result).toBeCloseTo(1.73, 2); // Should return base IC
        });

        test("should adjust IC for short texts (20-50 chars)", () => {
            const result = ICSampleCorrection.expectedIC(30, 'english');
            expect(result).toBeCloseTo(1.73 * 0.98, 2); // Should be slightly lower
        });

        test("should use custom base IC when provided", () => {
            const result = ICSampleCorrection.expectedIC(1000, 'english', 2.0);
            expect(result).toBe(2.0);
        });
    });

    describe("expectedStdDev", () => {
        test("should return Infinity for very short texts", () => {
            const result = ICSampleCorrection.expectedStdDev(1, 1.73);
            expect(result).toBe(Infinity);
        });

        test("should calculate correct standard deviation", () => {
            const result = ICSampleCorrection.expectedStdDev(1000, 1.73);
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(1.0); // Should be reasonable value
        });

        test("should decrease as text length increases", () => {
            const shortText = ICSampleCorrection.expectedStdDev(100, 1.73);
            const longText = ICSampleCorrection.expectedStdDev(1000, 1.73);
            expect(longText).toBeLessThan(shortText);
        });
    });

    describe("tolerance", () => {
        test("should calculate appropriate tolerance", () => {
            const result = ICSampleCorrection.tolerance(1000, 1.73);
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(1.0); // Should be reasonable tolerance
        });

        test("should scale with kSigma parameter", () => {
            const tolerance1 = ICSampleCorrection.tolerance(1000, 1.73, 2.0);
            const tolerance2 = ICSampleCorrection.tolerance(1000, 1.73, 3.0);
            expect(tolerance2).toBeGreaterThan(tolerance1);
        });
    });

    describe("tolerancePercent", () => {
        test("should calculate percentage tolerance", () => {
            const result = ICSampleCorrection.tolerancePercent(1000, 1.73);
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(100); // Should be percentage
        });
    });

    describe("getToleranceConfig", () => {
        test("should return complete tolerance configuration", () => {
            const result = ICSampleCorrection.getToleranceConfig(1000, 1.73);

            expect(result).toHaveProperty('absolute');
            expect(result).toHaveProperty('percent');
            expect(result).toHaveProperty('stdDev');
            expect(result).toHaveProperty('expectedIC');
            expect(result).toHaveProperty('kSigma');

            expect(result.absolute).toBeGreaterThan(0);
            expect(result.percent).toBeGreaterThan(0);
            expect(result.stdDev).toBeGreaterThan(0);
            expect(result.expectedIC).toBe(1.73);
        });

        test("should clamp percentage tolerance to min/max bounds", () => {
            // Very short text should have high percentage tolerance
            const result = ICSampleCorrection.getToleranceConfig(10, 1.73);
            expect(result.percent).toBeGreaterThanOrEqual(5);
            expect(result.percent).toBeLessThanOrEqual(60);
        });

        test("should respect custom kSigma", () => {
            const result = ICSampleCorrection.getToleranceConfig(1000, 1.73, { kSigma: 3.0 });
            expect(result.kSigma).toBe(3.0);
        });
    });

    describe("validate", () => {
        test("should validate IC within expected range", () => {
            // Test with IC close to expected
            const result = ICSampleCorrection.validate(1.73, 1000, 'english');

            expect(result).toHaveProperty('valid');
            expect(result).toHaveProperty('expectedIC');
            expect(result).toHaveProperty('actualIC');
            expect(result).toHaveProperty('tolerance');
            expect(result).toHaveProperty('zScore');
            expect(result).toHaveProperty('stdDev');

            expect(result.valid).toBe(true);
            expect(result.expectedIC).toBeCloseTo(1.73, 2);
            expect(result.actualIC).toBe(1.73);
        });

        test("should reject IC outside tolerance", () => {
            // Test with IC far from expected (random-like)
            const result = ICSampleCorrection.validate(1.0, 1000, 'english');
            expect(result.valid).toBe(false);
            expect(result.difference).toBeGreaterThan(result.tolerance);
        });

        test("should calculate zScore correctly", () => {
            const result = ICSampleCorrection.validate(1.73, 1000, 'english');
            expect(result.zScore).toBeGreaterThanOrEqual(0);
            expect(typeof result.zScore).toBe('number');
        });
    });

    describe("getExpectedRange", () => {
        test("should return valid IC range", () => {
            const result = ICSampleCorrection.getExpectedRange(1000, 'english');

            expect(result).toHaveProperty('min');
            expect(result).toHaveProperty('max');
            expect(result).toHaveProperty('expected');
            expect(result).toHaveProperty('tolerance');

            expect(result.min).toBeLessThan(result.expected);
            expect(result.max).toBeGreaterThan(result.expected);
            expect(result.max - result.min).toBeCloseTo(result.tolerance * 2, 1);
        });

        test("should work with custom base IC", () => {
            const result = ICSampleCorrection.getExpectedRange(1000, 'english', 2.0);
            expect(result.expected).toBe(2.0);
            expect(result.min).toBeLessThan(2.0);
            expect(result.max).toBeGreaterThan(2.0);
        });
    });

    describe("edge cases", () => {
        test("should handle very short texts gracefully", () => {
            const expectedIC = ICSampleCorrection.expectedIC(5, 'english');
            const stdDev = ICSampleCorrection.expectedStdDev(5, expectedIC);

            expect(expectedIC).toBeGreaterThan(0);
            expect(stdDev).toBeGreaterThan(0);
        });

        test("should handle different languages", () => {
            const englishIC = ICSampleCorrection.expectedIC(1000, 'english');
            const spanishIC = ICSampleCorrection.expectedIC(1000, 'spanish');

            expect(englishIC).toBeCloseTo(1.73, 2);
            expect(spanishIC).toBeCloseTo(1.94, 2);
            expect(spanishIC).toBeGreaterThan(englishIC);
        });

        test("should handle unknown languages gracefully", () => {
            const result = ICSampleCorrection.expectedIC(1000, 'unknown');
            expect(result).toBeCloseTo(1.73, 2); // Should fall back to English
        });
    });
});
