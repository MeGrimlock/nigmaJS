import { Stats } from './stats.js';
import { Scorers } from '../language/scorers.js';
import { TextUtils } from '../core/text-utils.js';
import { LanguageAnalysis } from './analysis-core.js';

/**
 * Transposition Detector based on Ciphertext Linguisticity
 * 
 * This module distinguishes transposition ciphers from substitution ciphers
 * by analyzing the "linguisticity" of the ciphertext itself.
 * 
 * Key insight:
 * - Transposition: Preserves letter frequencies (good chi-squared) but breaks
 *   n-gram patterns (low n-gram score on ciphertext)
 * - Monoalphabetic substitution: Preserves letter frequencies (good chi-squared)
 *   and partially preserves n-gram patterns (moderate n-gram score)
 * - Polyalphabetic: Flattens letter frequencies (poor chi-squared) and breaks
 *   n-gram patterns (low n-gram score)
 * 
 * Strategy:
 * 1. Calculate chi-squared of ciphertext letters vs expected language distribution
 * 2. Calculate n-gram score of ciphertext (how "language-like" it appears)
 * 3. Compare patterns to distinguish cipher types
 * 
 * References:
 * - "Cryptanalysis: A Study of Ciphers and Their Solution" (Gaines)
 * - "The Codebreakers" (Kahn)
 */
export class TranspositionDetector {
    /**
     * Analyzes ciphertext to determine likelihood of transposition cipher.
     * 
     * @param {string} ciphertext - The ciphertext to analyze
     * @param {string} language - Target language for comparison
     * @returns {Object} { transpositionScore, chiSquaredLetters, ngramScoreCipher, recommendation }
     */
    static analyze(ciphertext, language = 'english') {
        const cleaned = TextUtils.onlyLetters(ciphertext);
        const length = cleaned.length;
        
        // Handle 'auto' language by defaulting to 'english'
        const langToUse = (language === 'auto' || !language) ? 'english' : language;
        
        if (length < 20) {
            return {
                transpositionScore: 0.5, // Ambiguous for short texts
                chiSquaredLetters: null,
                ngramScoreCipher: null,
                recommendation: 'insufficient_data'
            };
        }
        
        // 1. Calculate chi-squared of letter frequencies vs expected language distribution
        const chiSquaredLetters = this._calculateLetterChiSquared(cleaned, langToUse);
        
        // 2. Calculate n-gram score of ciphertext (how "language-like" it appears)
        const ngramScoreCipher = this._calculateCiphertextNgramScore(cleaned, langToUse);
        
        // 3. Determine transposition likelihood
        const transpositionScore = this._determineTranspositionScore(
            chiSquaredLetters,
            ngramScoreCipher,
            length
        );
        
        // 4. Generate recommendation
        let recommendation = 'ambiguous';
        if (transpositionScore > 0.6) {
            recommendation = 'likely_transposition';
        } else if (transpositionScore < 0.4) {
            recommendation = 'likely_substitution';
        }
        
        return {
            transpositionScore: transpositionScore,
            chiSquaredLetters: chiSquaredLetters,
            ngramScoreCipher: ngramScoreCipher,
            recommendation: recommendation
        };
    }
    
    /**
     * Calculates chi-squared of ciphertext letter frequencies vs expected language distribution.
     * Lower chi-squared = better match to language = more likely transposition or monoalphabetic.
     * 
     * @private
     */
    static _calculateLetterChiSquared(text, language) {
        // Handle 'auto' language by defaulting to 'english'
        const langToUse = (language === 'auto' || !language) ? 'english' : language;
        const langData = LanguageAnalysis.languages[langToUse] || LanguageAnalysis.languages.english;
        const expectedFreqs = langData ? langData.monograms : null;
        
        if (!expectedFreqs) {
            return null;
        }
        
        const freqData = Stats.frequency(text);
        const observedCounts = freqData.counts || {};
        const N = text.length;
        
        let chiSquared = 0;
        for (let i = 0; i < 26; i++) {
            const letter = String.fromCharCode(65 + i); // A-Z
            const p = (expectedFreqs[letter] || 0) / 100; // Convert percentage to probability
            const O = observedCounts[letter] || 0;      // Observed count
            const E = p * N;                            // Expected count
            
            if (E > 0) {
                chiSquared += Math.pow(O - E, 2) / E;
            } else if (O > 0) {
                chiSquared += O * 10; // Penalty for unexpected letters
            }
        }
        
        return chiSquared;
    }
    
    /**
     * Calculates n-gram score of ciphertext itself.
     * This measures how "language-like" the ciphertext appears.
     * 
     * For transposition: n-gram score is moderate (some patterns survive)
     * For monoalphabetic: n-gram score is better (more patterns survive)
     * For polyalphabetic: n-gram score is poor (patterns broken)
     * 
     * @private
     */
    static _calculateCiphertextNgramScore(text, language) {
        try {
            // Handle 'auto' language by defaulting to 'english'
            let langToUse = (language === 'auto' || !language) ? 'english' : language;

            // If the specified language doesn't exist, fall back to english silently
            try {
                Scorers.scoreTextNormalized('test', langToUse, { useFallback: true });
            } catch (testError) {
                // Language model doesn't exist, use english instead
                langToUse = 'english';
            }

            // Use normalized n-gram score [0, 1]
            return Scorers.scoreTextNormalized(text, langToUse, { useFallback: true });
        } catch (error) {
            // Only warn for unexpected errors, not for missing language models
            if (!error.message.includes('not found')) {
                console.warn('[TranspositionDetector] Error calculating n-gram score:', error);
            }
            return 0;
        }
    }
    
    /**
     * Determines transposition score based on chi-squared and n-gram analysis.
     * 
     * Logic:
     * - Good chi-squared (low value) + moderate n-gram score → likely transposition
     * - Good chi-squared + good n-gram score → likely monoalphabetic
     * - Poor chi-squared + poor n-gram score → likely polyalphabetic
     * 
     * @private
     */
    static _determineTranspositionScore(chiSquaredLetters, ngramScoreCipher, textLength) {
        if (chiSquaredLetters === null || ngramScoreCipher === null) {
            return 0.5; // Ambiguous
        }
        
        let score = 0.5; // Start neutral
        
        // Normalize chi-squared to [0, 1] range
        // Typical values:
        // - Good match (transposition/monoalphabetic): 20-50
        // - Poor match (polyalphabetic): 100-200+
        // Normalize: map [0, 200] to [1, 0] (lower chi-squared = better = higher score)
        const normalizedChiSq = Math.max(0, Math.min(1, 1 - (chiSquaredLetters / 200)));
        
        // Evidence 1: Good letter frequencies (low chi-squared) suggests transposition or monoalphabetic
        if (normalizedChiSq > 0.7) {
            // Very good letter frequencies
            // Now check n-gram score to distinguish transposition vs monoalphabetic
            if (ngramScoreCipher < 0.3) {
                // Good letters but poor n-grams → likely transposition
                score += 0.3;
            } else if (ngramScoreCipher > 0.5) {
                // Good letters and good n-grams → likely monoalphabetic (not transposition)
                score -= 0.3;
            } else {
                // Moderate n-grams → ambiguous, slight boost for transposition
                score += 0.1;
            }
        } else if (normalizedChiSq < 0.3) {
            // Poor letter frequencies → likely polyalphabetic (not transposition)
            score -= 0.4;
        }
        
        // Evidence 2: N-gram score pattern
        // Transposition: n-gram score is moderate (0.2-0.4) because some patterns survive
        // Monoalphabetic: n-gram score is better (0.4-0.7) because more patterns survive
        // Random/polyalphabetic: n-gram score is poor (<0.2)
        if (ngramScoreCipher >= 0.2 && ngramScoreCipher < 0.4 && normalizedChiSq > 0.6) {
            // Moderate n-grams + good letters → transposition pattern
            score += 0.2;
        } else if (ngramScoreCipher > 0.5 && normalizedChiSq > 0.6) {
            // Good n-grams + good letters → monoalphabetic pattern (not transposition)
            score -= 0.2;
        }
        
        // Evidence 3: For longer texts, transposition is more detectable
        if (textLength >= 100) {
            // More confidence in longer texts
            if (score > 0.5) {
                score = Math.min(1, score + 0.1);
            }
        }
        
        // Clamp to [0, 1]
        return Math.max(0, Math.min(1, score));
    }
    
    /**
     * Compares two ciphertexts to determine which is more likely transposition.
     * 
     * @param {string} ciphertext1 - First ciphertext
     * @param {string} ciphertext2 - Second ciphertext
     * @param {string} language - Target language
     * @returns {Object} { moreLikelyTransposition: 1|2, analysis1, analysis2 }
     */
    static compare(ciphertext1, ciphertext2, language = 'english') {
        const analysis1 = TranspositionDetector.analyze(ciphertext1, language);
        const analysis2 = TranspositionDetector.analyze(ciphertext2, language);

        const scoreDiff = analysis1.transpositionScore - analysis2.transpositionScore;

        return {
            text1Analysis: analysis1,
            text2Analysis: analysis2,
            comparison: {
                scoreDifference: scoreDiff,
                interpretation: scoreDiff > 0.1 ? 'text1_more_likely_transposition' :
                               scoreDiff < -0.1 ? 'text2_more_likely_transposition' :
                               'similar_transposition_likelihood'
            },
            recommendation: scoreDiff > 0.1 ? 'text1_more_likely_transposition' :
                           scoreDiff < -0.1 ? 'text2_more_likely_transposition' :
                           'similar_likelihood'
        };
    }
}

export default TranspositionDetector;

