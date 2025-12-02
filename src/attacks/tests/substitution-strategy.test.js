import { SubstitutionStrategy } from '../strategies/substitution-strategy.js';

/**
 * Substitution Strategy Tests
 *
 * Tests the Substitution cipher strategy functionality.
 */
describe('Substitution Strategy', () => {
    describe('Basic Functionality', () => {
        test('should solve Substitution cipher', async () => {
            const solver = new SubstitutionStrategy('english');
            const result = await solver.solve('HELLO');

            expect(result).toHaveProperty('method');
            expect(result).toHaveProperty('plaintext');
            expect(result).toHaveProperty('confidence');
            expect(typeof result.confidence).toBe('number');
        });

        test('should handle empty input', async () => {
            const solver = new SubstitutionStrategy('english');
            const result = await solver.solve('');

            expect(result.confidence).toBe(0);
        });
    });
});
