import 'regenerator-runtime/runtime';
import { Scorer } from './scorer.js';
import { TextUtils } from '../core/text-utils.js';

/**
 * Simulated Annealing algorithm for breaking substitution ciphers.
 * 
 * Extends Hill Climbing by accepting "bad" moves with a probability that decreases over time.
 * This allows the algorithm to escape local maxima.
 * 
 * Algorithm:
 * 1. Start with an initial key and temperature T
 * 2. At each iteration:
 *    - Try a random swap
 *    - If it improves the score, accept it
 *    - If it worsens the score, accept it with probability P = exp(-ΔE / T)
 * 3. Decrease temperature: T = T * coolingRate
 * 4. Stop when temperature is too low or max iterations reached
 * 
 * References:
 * - "Optimization by Simulated Annealing" (Kirkpatrick et al., 1983)
 * - "Simulated Annealing for Cryptanalysis" (Spillman, 1993)
 */
export class SimulatedAnnealing {
    /**
     * Creates a Simulated Annealing solver.
     * @param {string} language - Target language ('english', 'spanish', etc.)
     */
    constructor(language = 'english') {
        this.language = language;
        this.scorer = new Scorer(language, 4);
    }
    
    /**
     * Solves a substitution cipher using simulated annealing.
     * 
     * @param {string} ciphertext - The ciphertext to decrypt.
     * @param {Object} options - Solver options.
     * @param {string} options.initMethod - Initialization method ('random', 'frequency', 'identity').
     * @param {number} options.maxIterations - Maximum iterations (default: 50000).
     * @param {number} options.initialTemp - Initial temperature (default: 20).
     * @param {number} options.coolingRate - Cooling rate per iteration (default: 0.9999).
     * @param {number} options.restarts - Number of random restarts (default: 1).
     * @returns {Object} Result object with { plaintext, key, score, iterations }.
     */
    solve(ciphertext, options = {}) {
        const {
            initMethod = 'frequency',
            maxIterations = 50000,
            initialTemp = 20,
            coolingRate = 0.9999,
            restarts = 1
        } = options;
        
        let bestResult = null;
        
        for (let restart = 0; restart < restarts; restart++) {
            const result = this._singleRun(ciphertext, initMethod, maxIterations, initialTemp, coolingRate);
            
            if (!bestResult || result.score > bestResult.score) {
                bestResult = result;
            }
        }
        
        return bestResult;
    }
    
    /**
     * Single simulated annealing run.
     * @private
     */
    _singleRun(ciphertext, initMethod, maxIterations, initialTemp, coolingRate) {
        const cleaned = TextUtils.onlyLetters(ciphertext);
        
        let currentKey = this._initializeKey(cleaned, initMethod);
        let currentScore = this.scorer.scoreWithKey(cleaned, currentKey);
        
        let bestKey = Scorer.copyKey(currentKey);
        let bestScore = currentScore;
        
        let temperature = initialTemp;
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            // Random swap
            const i = Math.floor(Math.random() * alphabet.length);
            const j = Math.floor(Math.random() * alphabet.length);
            
            if (i === j) continue; // Skip if same letter
            
            const char1 = alphabet[i];
            const char2 = alphabet[j];
            
            const newKey = Scorer.swapKey(currentKey, char1, char2);
            const newScore = this.scorer.scoreWithKey(cleaned, newKey);
            
            const delta = newScore - currentScore;
            
            // Accept if improvement OR with probability based on temperature
            if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
                currentKey = newKey;
                currentScore = newScore;
                
                // Track best ever seen
                if (currentScore > bestScore) {
                    bestKey = Scorer.copyKey(currentKey);
                    bestScore = currentScore;
                }
            }
            
            // Cool down
            temperature *= coolingRate;
            
            // Early stop if temperature is too low
            if (temperature < 0.01) break;
        }
        
        const plaintext = this.scorer.applyKey(cleaned, bestKey);
        
        return {
            plaintext: plaintext,
            key: bestKey,
            score: bestScore,
            iterations: maxIterations,
            method: 'simulated-annealing'
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
     * 
     * @param {string} ciphertext - The ciphertext to decrypt.
     * @param {Object} options - Solver options.
     * @yields {Object} Progress updates.
     */
    *solveGenerator(ciphertext, options = {}) {
        const {
            initMethod = 'frequency',
            maxIterations = 50000,
            initialTemp = 20,
            coolingRate = 0.9999
        } = options;
        
        const cleaned = TextUtils.onlyLetters(ciphertext);
        
        let currentKey = this._initializeKey(cleaned, initMethod);
        let currentScore = this.scorer.scoreWithKey(cleaned, currentKey);
        
        let bestKey = Scorer.copyKey(currentKey);
        let bestScore = currentScore;
        
        let temperature = initialTemp;
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        // Yield initial state
        yield {
            iteration: 0,
            score: currentScore,
            plaintext: this.scorer.applyKey(cleaned, currentKey),
            progress: 0,
            temperature: temperature,
            method: 'simulated-annealing'
        };
        
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            const i = Math.floor(Math.random() * alphabet.length);
            const j = Math.floor(Math.random() * alphabet.length);
            
            if (i === j) continue;
            
            const char1 = alphabet[i];
            const char2 = alphabet[j];
            
            const newKey = Scorer.swapKey(currentKey, char1, char2);
            const newScore = this.scorer.scoreWithKey(cleaned, newKey);
            
            const delta = newScore - currentScore;
            
            if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
                currentKey = newKey;
                currentScore = newScore;
                
                if (currentScore > bestScore) {
                    bestKey = Scorer.copyKey(currentKey);
                    bestScore = currentScore;
                    
                    // Yield progress on improvements
                    if (iteration % 100 === 0) {
                        yield {
                            iteration: iteration,
                            score: bestScore,
                            plaintext: this.scorer.applyKey(cleaned, bestKey),
                            progress: (iteration / maxIterations) * 100,
                            temperature: temperature,
                            method: 'simulated-annealing'
                        };
                    }
                }
            }
            
            temperature *= coolingRate;
            
            if (temperature < 0.01) break;
        }
        
        // Final result
        yield {
            iteration: maxIterations,
            score: bestScore,
            plaintext: this.scorer.applyKey(cleaned, bestKey),
            progress: 100,
            temperature: temperature,
            method: 'simulated-annealing',
            key: bestKey
        };
    }
}

