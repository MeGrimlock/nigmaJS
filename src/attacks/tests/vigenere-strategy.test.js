import { VigenereStrategy } from '../strategies/vigenere-strategy.js';

/**
 * Vigenere Strategy Tests
 *
 * Tests the Vigenere cipher strategy functionality.
 */
describe('Vigenere Strategy', () => {
    describe('Basic Functionality', () => {
        test('should solve Vigenere cipher', async () => {
            const solver = new VigenereStrategy('english');
            const result = await solver.solve('HELLO');

            expect(result).toHaveProperty('method');
            expect(result).toHaveProperty('plaintext');
            expect(result).toHaveProperty('confidence');
            expect(typeof result.confidence).toBe('number');
        });

        test('should handle empty input', async () => {
            const solver = new VigenereStrategy('english');
            const result = await solver.solve('');

            expect(result.confidence).toBe(0);
        });
    });
});
