import { AmscoSolver } from '../strategies/amsco-solver.js';

/**
 * Amsco Solver Tests
 *
 * Tests the Amsco cipher solver functionality.
 */
describe('Amsco Solver', () => {
    describe('Basic Functionality', () => {
        test('should solve Amsco cipher', async () => {
            const solver = new AmscoSolver('english');
            const result = await solver.solve('HELLO');

            expect(result).toHaveProperty('method');
            expect(result).toHaveProperty('plaintext');
            expect(result).toHaveProperty('confidence');
            expect(typeof result.confidence).toBe('number');
        });

        test('should handle empty input', async () => {
            const solver = new AmscoSolver('english');
            const result = await solver.solve('');

            expect(result.confidence).toBe(0);
        });
    });
});
