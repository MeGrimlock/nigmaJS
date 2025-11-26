import { HillClimb } from '../../search/hillclimb.js';
import { SimulatedAnnealing } from '../../search/simulated-annealing.js';

/**
 * Substitution Cipher Strategy
 * 
 * Wraps Hill Climbing and Simulated Annealing for monoalphabetic substitution ciphers.
 */
export class SubstitutionStrategy {
    constructor(language = 'english') {
        this.language = language;
    }

    /**
     * Solves substitution cipher using heuristic search.
     * @param {string} ciphertext - The encrypted text
     * @param {string} method - 'hillclimb' or 'annealing'
     * @returns {Promise<Object>} Result with plaintext, method, confidence, score, key, etc.
     */
    async solve(ciphertext, method = 'hillclimb') {
        const solver = method === 'annealing' 
            ? new SimulatedAnnealing(this.language)
            : new HillClimb(this.language);
        
        const result = solver.solve(ciphertext, {
            initMethod: 'frequency',
            maxIterations: method === 'annealing' ? 20000 : 5000,
            restarts: 2
        });
        
        // Calculate confidence based on score
        // Good English quadgram scores are typically > -3
        const confidence = Math.min(1, Math.max(0, (result.score + 7) / 4));
        
        return {
            plaintext: result.plaintext,
            method: method === 'annealing' ? 'simulated-annealing' : 'hill-climbing',
            confidence: confidence,
            score: result.score,
            key: result.key
        };
    }
}

