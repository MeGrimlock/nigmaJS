import { AdaptiveFrequencyAnalysis } from '../adaptive-frequency-analysis.js';

/**
 * Adaptive Frequency Analysis Tests
 *
 * Tests the context-aware frequency analysis for improved cipher type detection.
 */
describe('Adaptive Frequency Analysis', () => {

    describe('Basic Analysis', () => {
        test('should analyze monoalphabetic cipher', () => {
            // Simple Caesar cipher text
            const caesarText = "WKLVLVDFDHVDUBLSK"; // "THISISAECAESARCI" shifted by 3
            const result = AdaptiveFrequencyAnalysis.analyze(caesarText);

            expect(result).toHaveProperty('bestType');
            expect(result.bestType.type).toBeDefined();
            expect(result.confidence).toBeGreaterThan(0);
        });

        test('should handle short text', () => {
            const shortText = 'AB';
            const result = AdaptiveFrequencyAnalysis.analyze(shortText);

            expect(result.confidence).toBe(0);
            expect(result.bestType.type).toBe('unknown');
        });

        test('should analyze with cipher hints', () => {
            const text = 'WKLVLVDFDHVDUBLSK';
            const hints = { isPolyalphabetic: true, detectedPeriod: 5 };
            const result = AdaptiveFrequencyAnalysis.analyze(text, hints);

            expect(result).toHaveProperty('typeConfidences');
            expect(result.typeConfidences.polyalphabetic).toBeDefined();
        });
    });

    describe('Cipher Type Detection', () => {
        test('should detect monoalphabetic patterns', () => {
            // Text with typical monoalphabetic frequency distribution
            const monoText = "ETAOINSHRDLUCMFYWGPBVKXQJZ"; // English letter frequency order
            const result = AdaptiveFrequencyAnalysis.analyze(monoText);

            expect(result.adaptationResults.monoalphabetic).toBeDefined();
            expect(result.adaptationResults.monoalphabetic.score).toBeGreaterThan(0);
        });

        test('should detect polyalphabetic patterns', () => {
            // Vigenere-like text (should be more uniform across columns)
            const polyText = "WKLVLVDFDHVDUBLSKWKLVLVDFDHVDUBLSK"; // Repeated pattern
            const hints = { isPolyalphabetic: true, detectedPeriod: 5 };
            const result = AdaptiveFrequencyAnalysis.analyze(polyText, hints);

            expect(result.adaptationResults.polyalphabetic).toBeDefined();
        });

        test('should provide confidence scores for all types', () => {
            const text = 'HELLOWORDHOWAREYOU';
            const result = AdaptiveFrequencyAnalysis.analyze(text);

            expect(result.typeConfidences).toHaveProperty('monoalphabetic');
            expect(result.typeConfidences).toHaveProperty('polyalphabetic');
            expect(result.typeConfidences).toHaveProperty('transposition');
            expect(result.typeConfidences).toHaveProperty('dictionaryBased');
        });
    });

    describe('Column Analysis', () => {
        test('should analyze column frequencies for polyalphabetic detection', () => {
            const analysis = AdaptiveFrequencyAnalysis;
            const text = 'ABCDEFABCDEFABCDEF'; // Period 6 pattern
            const result = analysis._analyzeColumnFrequencies(text, 6, 'english');

            expect(result).toHaveProperty('uniformity');
            expect(result).toHaveProperty('peakRatio');
            expect(result.columnStats.length).toBeGreaterThan(0);
        });

        test('should handle short columns', () => {
            const analysis = AdaptiveFrequencyAnalysis;
            const text = 'ABC'; // Very short text
            const result = analysis._analyzeColumnFrequencies(text, 3, 'english');

            expect(result.uniformity).toBeDefined();
            expect(result.peakRatio).toBeDefined();
        });
    });

    describe('Language Support', () => {
        test('should work with different languages', () => {
            const text = 'WKLVLVDFDHVDUBLSK';
            const result = AdaptiveFrequencyAnalysis.analyze(text, {}, 'spanish');

            expect(result.language).toBe('spanish');
            expect(result).toHaveProperty('bestType');
        });

        test('should default to english', () => {
            const text = 'WKLVLVDFDHVDUBLSK';
            const result = AdaptiveFrequencyAnalysis.analyze(text);

            expect(result.language).toBe('english');
        });
    });

    describe('Detailed Analysis', () => {
        test('should provide detailed analysis for debugging', () => {
            const text = 'HELLOWORD';
            const result = AdaptiveFrequencyAnalysis.detailedAnalysis(text);

            expect(result).toHaveProperty('debug');
            expect(result.debug).toHaveProperty('textSample');
            expect(result.debug).toHaveProperty('timestamp');
        });
    });
});
