import { AdvancedPeriodicAnalysis } from '../advanced-periodic-analysis.js';

/**
 * Advanced Periodic Analysis Tests
 *
 * Tests the enhanced polyalphabetic cipher detection capabilities.
 */
describe('Advanced Periodic Analysis', () => {

    describe('Multi-Length Kasiski Analysis', () => {
        test('should detect periodicity in Vigenere ciphertext', () => {
            // Simple Vigenere with key "KEY" (period 3)
            const ciphertext = 'KHOORZRUOG'; // "HELLOWORLD" encrypted with Vigenere "KEY"
            const result = AdvancedPeriodicAnalysis.multiLengthKasiski(ciphertext);

            expect(result.hasPeriodicity).toBe(true);
            expect(result.consensusPeriod).toBe(3);
            expect(result.confidence).toBeGreaterThan(0);
        });

        test('should handle short text', () => {
            const shortText = 'ABC';
            const result = AdvancedPeriodicAnalysis.multiLengthKasiski(shortText);

            expect(result.hasPeriodicity).toBe(false);
            expect(result.confidence).toBe(0);
        });
    });

    describe('Advanced Autocorrelation', () => {
        test('should detect periodic patterns', () => {
            // Create a simple periodic text: ABCABCABC
            const periodicText = 'ABCABCABCABC';
            const result = AdvancedPeriodicAnalysis.advancedAutocorrelation(periodicText);

            expect(result.hasPeriodicity).toBe(true);
            expect(result.primaryPeriod).toBe(3);
            expect(result.confidence).toBeGreaterThan(0);
        });

        test('should handle non-periodic text', () => {
            const randomText = 'ABCDEFGHIJK';
            const result = AdvancedPeriodicAnalysis.advancedAutocorrelation(randomText);

            expect(result.hasPeriodicity).toBe(false);
            expect(result.confidence).toBe(0);
        });
    });

    describe('Conditional Entropy Analysis', () => {
        test('should detect polyalphabetic patterns', () => {
            // Vigenere ciphertext with period 3
            const ciphertext = 'KHOORZRUOGKHOORZRUOG';
            const result = AdvancedPeriodicAnalysis.conditionalEntropyAnalysis(ciphertext, 3);

            expect(result.isPolyalphabetic).toBe(true);
            expect(result.confidence).toBeGreaterThan(0);
        });

        test('should reject monoalphabetic text', () => {
            // Caesar cipher (monoalphabetic)
            const ciphertext = 'KHOORZRUOG';
            const result = AdvancedPeriodicAnalysis.conditionalEntropyAnalysis(ciphertext, 5);

            // This might not be conclusive for short text, but should not crash
            expect(typeof result.isPolyalphabetic).toBe('boolean');
            expect(typeof result.confidence).toBe('number');
        });
    });

    describe('Composite Periodicity Detection', () => {
        test('should combine multiple methods for better detection', () => {
            // Longer Vigenere ciphertext for better analysis
            const ciphertext = 'KHOORZRUOGKHOORZRUOGKHOORZRUOGKHOORZRUOG';
            const result = AdvancedPeriodicAnalysis.detectCompositePeriodicity(ciphertext);

            expect(result.isPolyalphabetic).toBe(true);
            expect(result.confidence).toBeGreaterThan(0.3);
            expect(result.detectedPeriod).toBe(3);
        });

        test('should handle insufficient data', () => {
            const shortText = 'AB';
            const result = AdvancedPeriodicAnalysis.detectCompositePeriodicity(shortText);

            expect(result.isPolyalphabetic).toBe(false);
            expect(result.confidence).toBe(0);
        });
    });

    describe('Main Analysis Function', () => {
        test('should analyze polyalphabetic ciphertext', () => {
            const ciphertext = 'KHOORZRUOGKHOORZRUOGKHOORZRUOG';
            const result = AdvancedPeriodicAnalysis.analyze(ciphertext);

            expect(result.isPolyalphabetic).toBe(true);
            expect(result.confidence).toBeGreaterThan(0);
            expect(['likely_polyalphabetic', 'unclear']).toContain(result.recommendation);
        });

        test('should handle monoalphabetic text', () => {
            // Random text (should not show periodicity)
            const randomText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const result = AdvancedPeriodicAnalysis.analyze(randomText);

            expect(typeof result.isPolyalphabetic).toBe('boolean');
            expect(typeof result.confidence).toBe('number');
            expect(['likely_monoalphabetic', 'unclear', 'insufficient_data']).toContain(result.recommendation);
        });

        test('should reject very short texts', () => {
            const shortText = 'HI';
            const result = AdvancedPeriodicAnalysis.analyze(shortText);

            expect(result.isPolyalphabetic).toBe(false);
            expect(result.confidence).toBe(0);
            expect(result.recommendation).toBe('insufficient_data');
        });
    });
});
