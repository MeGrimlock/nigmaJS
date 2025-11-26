import { VigenereSolver } from './vigenere-solver.js';

/**
 * Vigenère Cipher Strategy Wrapper
 * 
 * Wraps VigenereSolver for use in Orchestrator strategy pattern.
 */
export class VigenereStrategy {
    constructor(language = 'english') {
        this.language = language;
    }

    /**
     * Solves Vigenère cipher using Friedman test.
     * @param {string} ciphertext - The encrypted text
     * @param {number} suggestedKeyLength - Optional suggested key length
     * @returns {Promise<Object>} Result with plaintext, method, confidence, score, key, etc.
     */
    async solve(ciphertext, suggestedKeyLength = null) {
        const solver = new VigenereSolver(this.language);
        const result = await solver.solve(ciphertext);
        
        // VigenereSolver may return confidence 0 if it fails
        // Use IoC as a proxy for confidence
        const confidence = result.confidence || (result.analysis?.avgIoC > 1.3 ? 0.7 : 0.3);
        
        return {
            plaintext: result.plaintext,
            method: 'vigenere-friedman',
            confidence: confidence,
            score: result.analysis?.avgIoC || result.analysis?.ioc || 0,
            key: result.key
        };
    }
}

