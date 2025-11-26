import { TextUtils } from '../core/text-utils.js';
import { LanguageAnalysis } from './analysis.js';

/**
 * Basic statistical analysis for ciphertexts.
 */
export const Stats = {
    /**
     * Calculates character frequencies.
     * @param {string} text 
     * @returns {Object} Map of char -> count and char -> percentage
     */
    frequency: (text) => {
        const clean = TextUtils.onlyLetters(text);
        const counts = {};
        const len = clean.length;

        for (const char of clean) {
            counts[char] = (counts[char] || 0) + 1;
        }

        const histogram = {};
        for (const char in counts) {
            histogram[char] = counts[char] / len;
        }

        return {
            length: len,
            counts,
            histogram
        };
    },

    /**
     * Calculates Index of Coincidence (IoC).
     * IoC ≈ 0.038 for random text (uniform), ≈ 0.067 for English/Spanish.
     * Normalized IoC (x26) ≈ 1.0 for random, ≈ 1.73 for English.
     * @param {string} text 
     * @param {boolean} normalized - Multiply by 26 (default: true)
     */
    indexOfCoincidence: (text, normalized = true) => {
        const clean = TextUtils.onlyLetters(text);
        const len = clean.length;
        if (len <= 1) return 0;

        const counts = {};
        for (const char of clean) {
            counts[char] = (counts[char] || 0) + 1;
        }

        let sum = 0;
        for (const char in counts) {
            const n = counts[char];
            sum += n * (n - 1);
        }

        const ioc = sum / (len * (len - 1));
        return normalized ? ioc * 26 : ioc;
    },

    /**
     * Calculates Shannon Entropy.
     * Random text ≈ 4.7 (log2(26)).
     * English/Spanish ≈ 4.0 - 4.2.
     * @param {string} text 
     */
    entropy: (text) => {
        const { histogram } = Stats.frequency(text);
        let entropy = 0;
        
        for (const char in histogram) {
            const p = histogram[char];
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        }
        return entropy;
    },

    /**
     * Calculates Index of Coincidence with dictionary validation.
     * Returns adjusted IoC: IC * (1 + dictionaryBonus)
     * @param {string} text - Text to analyze
     * @param {string} language - Target language for dictionary validation
     * @param {boolean} normalized - Multiply by 26 (default: true)
     * @returns {Promise<Object>} { ioc, dictionaryBonus, adjustedIoc }
     */
    indexOfCoincidenceWithValidation: async (text, language = 'english', normalized = true) => {
        // Calculate normal IoC
        const ioc = Stats.indexOfCoincidence(text, normalized);
        
        // Dictionary validation bonus
        let dictionaryBonus = 0;
        try {
            const dict = LanguageAnalysis.getDictionary(language);
            if (dict) {
                // Extract words from text and check against dictionary
                const words = text.toUpperCase()
                    .split(/\s+/)
                    .map(w => TextUtils.onlyLetters(w))
                    .filter(w => w.length >= 3); // Only consider words >= 3 chars
                
                if (words.length > 0) {
                    let validWords = 0;
                    for (const word of words) {
                        if (dict.has(word)) {
                            validWords++;
                        }
                    }
                    // Dictionary bonus: percentage of valid words (0-1)
                    // Higher word coverage = higher confidence in IoC
                    dictionaryBonus = validWords / words.length;
                }
            }
        } catch (error) {
            // Dictionary not available, continue with normal IoC
            console.warn('[Stats] Dictionary validation failed:', error);
        }
        
        // Adjusted IoC: if dictionary validates words, increase confidence
        // Formula: adjustedIoc = ioc * (1 + dictionaryBonus * 0.1)
        // Max 10% bonus if all words are valid
        const adjustedIoc = ioc * (1 + dictionaryBonus * 0.1);
        
        return {
            ioc,
            dictionaryBonus,
            adjustedIoc
        };
    },

    /**
     * Calculates chi-squared with dictionary validation.
     * Combines frequency-based chi-squared with dictionary word validation.
     * @param {string} text - Text to analyze
     * @param {Object} expectedFreqs - Expected letter frequencies
     * @param {string} language - Target language for dictionary validation
     * @returns {Promise<Object>} { chiSquared, dictionaryScore, combinedScore }
     */
    chiSquaredWithDictionary: async (text, expectedFreqs, language = 'english') => {
        // Calculate normal chi-squared
        const observedFreqs = Stats.frequency(text).histogram;
        let chiSquared = 0;
        
        for (const letter in expectedFreqs) {
            const expected = expectedFreqs[letter] || 0;
            const observed = observedFreqs[letter] || 0;
            if (expected > 0) {
                chiSquared += Math.pow(observed - expected, 2) / expected;
            } else if (observed > 0) {
                // Penalty for observed but not expected
                chiSquared += observed * 10;
            }
        }
        
        // Dictionary validation score
        let dictionaryScore = 0;
        try {
            const dict = LanguageAnalysis.getDictionary(language);
            if (dict) {
                // Extract words from text and check against dictionary
                const words = text.toUpperCase()
                    .split(/\s+/)
                    .map(w => TextUtils.onlyLetters(w))
                    .filter(w => w.length >= 3);
                
                if (words.length > 0) {
                    let validWords = 0;
                    for (const word of words) {
                        if (dict.has(word)) {
                            validWords++;
                        }
                    }
                    // Dictionary score: percentage of valid words (0-1)
                    dictionaryScore = validWords / words.length;
                }
            }
        } catch (error) {
            // Dictionary not available, continue with chi-squared only
            console.warn('[Stats] Dictionary validation failed:', error);
        }
        
        // Combined score: lower chi-squared is better, higher dictionary score is better
        // Formula: combinedScore = chiSquared * (1 - dictionaryScore * 0.3)
        // If 100% words valid, reduce chi-squared by 30%
        const combinedScore = chiSquared * (1 - dictionaryScore * 0.3);
        
        return {
            chiSquared,
            dictionaryScore,
            combinedScore
        };
    }
};

export default Stats;

