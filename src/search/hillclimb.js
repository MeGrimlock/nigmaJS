import 'regenerator-runtime/runtime';
import { Scorer } from './scorer.js';
import { TextUtils } from '../core/text-utils.js';

/**
 * Hill Climbing algorithm for breaking substitution ciphers.
 * 
 * Algorithm:
 * 1. Start with an initial key (random or frequency-based)
 * 2. Evaluate the score of the decrypted text
 * 3. Try all possible swaps of two letters in the key
 * 4. If a swap improves the score, accept it and repeat
 * 5. Stop when no swap improves the score (local maximum)
 * 
 * References:
 * - "Cryptanalysis of Classical Ciphers Using Hill Climbing" (Gaines)
 * - "A Fast Method for the Cryptanalysis of Substitution Ciphers" (Jakobsen, 1995)
 */
export class HillClimb {
    /**
     * Creates a Hill Climbing solver.
     * @param {string} language - Target language ('english', 'spanish', etc.)
     */
    constructor(language = 'english') {
        this.language = language;
        this.scorer = new Scorer(language, 4); // Use quadgrams
    }
    
    /**
     * Solves a substitution cipher using hill climbing.
     * 
     * @param {string} ciphertext - The ciphertext to decrypt.
     * @param {Object} options - Solver options.
     * @param {string} options.initMethod - Initialization method ('random', 'frequency', 'identity').
     * @param {number} options.maxIterations - Maximum iterations before giving up (default: 10000).
     * @param {number} options.restarts - Number of random restarts (default: 1).
     * @returns {Object} Result object with { plaintext, key, score, iterations }.
     */
    solve(ciphertext, options = {}) {
        const {
            initMethod = 'frequency',
            maxIterations = 10000,
            restarts = 1
        } = options;
        
        let bestResult = null;
        
        // Try multiple restarts to avoid local maxima
        for (let restart = 0; restart < restarts; restart++) {
            const result = this._singleRun(ciphertext, initMethod, maxIterations);
            
            if (!bestResult || result.score > bestResult.score) {
                bestResult = result;
            }
        }
        
        return bestResult;
    }
    
    /**
     * Single hill climbing run.
     * @private
     */
    _singleRun(ciphertext, initMethod, maxIterations) {
        const cleaned = TextUtils.onlyLetters(ciphertext);
        
        // Initialize key
        let currentKey = this._initializeKey(cleaned, initMethod);
        let currentScore = this.scorer.scoreWithKey(cleaned, currentKey);
        
        let iteration = 0;
        let improved = true;
        
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        // Main loop: keep improving until stuck
        while (improved && iteration < maxIterations) {
            improved = false;
            iteration++;
            
            // Try all possible swaps
            for (let i = 0; i < alphabet.length; i++) {
                for (let j = i + 1; j < alphabet.length; j++) {
                    const char1 = alphabet[i];
                    const char2 = alphabet[j];
                    
                    // Swap
                    const newKey = Scorer.swapKey(currentKey, char1, char2);
                    const newScore = this.scorer.scoreWithKey(cleaned, newKey);
                    
                    // If improvement, accept and restart inner loop
                    if (newScore > currentScore) {
                        currentKey = newKey;
                        currentScore = newScore;
                        improved = true;
                        break; // Restart with new key
                    }
                }
                if (improved) break; // Restart outer loop
            }
        }
        
        const plaintext = this.scorer.applyKey(cleaned, currentKey);
        
        return {
            plaintext: plaintext,
            key: currentKey,
            score: currentScore,
            iterations: iteration,
            method: 'hillclimb'
        };
    }
    
    /**
     * Initializes a key based on the specified method.
     * @private
     */
    _initializeKey(ciphertext, method) {
        switch (method) {
            case 'random':
                return Scorer.randomKey();
            case 'frequency':
                return Scorer.frequencyKey(ciphertext, this.language);
            case 'identity':
                return Scorer.identityKey();
            default:
                return Scorer.frequencyKey(ciphertext, this.language);
        }
    }
    
    /**
     * Solves with a generator for progress tracking.
     * Yields progress updates during the search.
     * 
     * @param {string} ciphertext - The ciphertext to decrypt.
     * @param {Object} options - Solver options.
     * @yields {Object} Progress updates { iteration, score, plaintext, progress }.
     */
    *solveGenerator(ciphertext, options = {}) {
        const {
            initMethod = 'frequency',
            maxIterations = 10000
        } = options;
        
        const cleaned = TextUtils.onlyLetters(ciphertext);
        
        let currentKey = this._initializeKey(cleaned, initMethod);
        let currentScore = this.scorer.scoreWithKey(cleaned, currentKey);
        
        let iteration = 0;
        let improved = true;
        
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        // Yield initial state
        yield {
            iteration: 0,
            score: currentScore,
            plaintext: this.scorer.applyKey(cleaned, currentKey),
            progress: 0,
            method: 'hillclimb'
        };
        
        while (improved && iteration < maxIterations) {
            improved = false;
            iteration++;
            
            for (let i = 0; i < alphabet.length; i++) {
                for (let j = i + 1; j < alphabet.length; j++) {
                    const char1 = alphabet[i];
                    const char2 = alphabet[j];
                    
                    const newKey = Scorer.swapKey(currentKey, char1, char2);
                    const newScore = this.scorer.scoreWithKey(cleaned, newKey);
                    
                    if (newScore > currentScore) {
                        currentKey = newKey;
                        currentScore = newScore;
                        improved = true;
                        
                        // Yield progress every improvement
                        yield {
                            iteration: iteration,
                            score: currentScore,
                            plaintext: this.scorer.applyKey(cleaned, currentKey),
                            progress: Math.min((iteration / maxIterations) * 100, 99),
                            method: 'hillclimb'
                        };
                        
                        break;
                    }
                }
                if (improved) break;
            }
        }
        
        // Final result
        yield {
            iteration: iteration,
            score: currentScore,
            plaintext: this.scorer.applyKey(cleaned, currentKey),
            progress: 100,
            method: 'hillclimb',
            key: currentKey
        };
    }
}

