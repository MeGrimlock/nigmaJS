import { PolyalphabeticSolver } from '../polyalphabetic-solver.js';

/**
 * Advanced Polyalphabetic Cipher Strategy
 * 
 * Wraps PolyalphabeticSolver for Beaufort, Porta, Gronsfeld, and Quagmire ciphers.
 */
export class PolyalphabeticStrategy {
    constructor(language = 'english') {
        this.language = language;
    }

    /**
     * Solves advanced polyalphabetic ciphers (Beaufort, Porta, Gronsfeld, Quagmire).
     * @param {string} ciphertext - The encrypted text
     * @returns {Promise<Object>} Result with plaintext, method, confidence, score, key, etc.
     */
    async solve(ciphertext) {
        const polyalphabeticSolver = new PolyalphabeticSolver(this.language);
        const result = polyalphabeticSolver.solve(ciphertext);
        
        return {
            plaintext: result.plaintext,
            method: result.method || 'polyalphabetic',
            confidence: result.confidence || 0.5,
            score: result.score,
            key: result.key
        };
    }
}

