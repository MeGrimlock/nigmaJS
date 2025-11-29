import { NGramModel } from './ngram-model.js';
import { TextUtils } from '../core/text-utils.js';

// Import existing data models
import spanishData from './models/spanish.js';
import englishData from './models/english.js';
import frenchData from './models/french.js';
import germanData from './models/german.js';
import italianData from './models/italian.js';
import portugueseData from './models/portuguese.js';

/**
 * Advanced N-gram Scorer for cryptographic analysis.
 * 
 * This module provides sophisticated n-gram scoring using log-likelihood
 * for 3-grams and 4-grams. It's designed to be more reliable than simple
 * word coverage, especially for short texts.
 * 
 * Features:
 * - Supports multiple n-gram lengths (3 and 4) with automatic fallback
 * - Returns normalized scores [0, 1] for comparability
 * - Handles multiple languages
 * - Optimized for cryptographic use cases
 * 
 * References:
 * - "Cryptanalysis of Classical Ciphers Using Hill Climbing" (Gaines)
 * - "An Interactive Cryptanalysis Algorithm for the Vigenère Cipher" (Joux et al.)
 */

// Initialize models for both 3-grams and 4-grams
// We use 4-grams as primary (more discriminative) and 3-grams as fallback (for short texts)
const models4gram = {
    spanish: new NGramModel(spanishData.quadgrams, 4),
    english: new NGramModel(englishData.quadgrams, 4),
    french: new NGramModel(frenchData.quadgrams, 4),
    german: new NGramModel(germanData.quadgrams, 4),
    italian: new NGramModel(italianData.quadgrams, 4),
    portuguese: new NGramModel(portugueseData.quadgrams, 4),
};

const models3gram = {
    spanish: spanishData.trigrams ? new NGramModel(spanishData.trigrams, 3) : null,
    english: englishData.trigrams ? new NGramModel(englishData.trigrams, 3) : null,
    french: frenchData.trigrams ? new NGramModel(frenchData.trigrams, 3) : null,
    german: germanData.trigrams ? new NGramModel(germanData.trigrams, 3) : null,
    italian: italianData.trigrams ? new NGramModel(italianData.trigrams, 3) : null,
    portuguese: portugueseData.trigrams ? new NGramModel(portugueseData.trigrams, 3) : null,
};

/**
 * Normalizes a raw log-likelihood score to [0, 1] range.
 * Typical values:
 * - Good language text: -8.0 to -6.0 (avg -7.0)
 * - Random text: -10.0 to -9.0 (avg -9.5)
 * - Very bad text: < -10.0
 * 
 * @param {number} rawScore - Raw average log-likelihood per n-gram
 * @returns {number} Normalized score in [0, 1] range (higher is better)
 */
function normalizeScore(rawScore) {
    // Normalization: map [-10, -6] to [0, 1]
    // Formula: normalized = (score - min) / (max - min)
    const minScore = -10.0;
    const maxScore = -6.0;
    return Math.max(0, Math.min(1, (rawScore - minScore) / (maxScore - minScore)));
}

/**
 * Calculates raw average log-likelihood per n-gram.
 * @param {string} text - Text to score
 * @param {NGramModel} model - N-gram model to use
 * @returns {number} Raw average log-likelihood
 */
function calculateRawScore(text, model) {
    const cleaned = TextUtils.onlyLetters(text);
    if (cleaned.length < model.n) {
        return model.floor;
    }
    
    const totalScore = model.score(cleaned);
    const numNgrams = cleaned.length - model.n + 1;
    return numNgrams > 0 ? totalScore / numNgrams : model.floor;
}

export const Scorers = {
    /**
     * Scores text against a specific language using n-gram log-likelihood.
     * Returns raw score (for backward compatibility).
     * 
     * @param {string} text - Text to score
     * @param {string} languageId - Language code
     * @returns {number} Raw log-likelihood score (higher/closer to 0 is better)
     */
    scoreText: (text, languageId) => {
        const model = models4gram[languageId];
        if (!model) {
            throw new Error(`Language model '${languageId}' not found.`);
        }
        return calculateRawScore(text, model);
    },

    /**
     * Scores text with normalized output [0, 1].
     * Higher values indicate better language match.
     * 
     * @param {string} text - Text to score
     * @param {string} languageId - Language code
     * @param {Object} options - Options
     * @param {boolean} options.useFallback - Use 3-gram fallback for short texts (default: true)
     * @returns {number} Normalized score [0, 1]
     */
    scoreTextNormalized: (text, languageId, options = {}) => {
        const { useFallback = true } = options;
        const cleaned = TextUtils.onlyLetters(text);
        
        // Try 4-gram model first
        const model4 = models4gram[languageId];
        if (!model4) {
            throw new Error(`Language model '${languageId}' not found.`);
        }
        
        if (cleaned.length >= model4.n) {
            const rawScore = calculateRawScore(text, model4);
            return normalizeScore(rawScore);
        }
        
        // Text too short for 4-grams, try 3-gram fallback
        if (useFallback) {
            const model3 = models3gram[languageId];
            if (model3 && cleaned.length >= model3.n) {
                const rawScore = calculateRawScore(text, model3);
                // Adjust normalization for 3-grams (slightly different range)
                const minScore = -9.5;
                const maxScore = -5.5;
                return Math.max(0, Math.min(1, (rawScore - minScore) / (maxScore - minScore)));
            }
        }
        
        // Text too short for any model
        return 0.0;
    },

    /**
     * Scores multiple texts and returns the best one.
     * Useful for comparing multiple decryption candidates.
     * 
     * @param {Array<string>} texts - Array of texts to score
     * @param {string} languageId - Language code
     * @param {Object} options - Options
     * @param {boolean} options.normalized - Return normalized scores (default: true)
     * @returns {Object} { bestText, bestScore, scores: [{ text, score }] }
     */
    scoreMultiple: (texts, languageId, options = {}) => {
        const { normalized = true } = options;
        const scoreFn = normalized ? Scorers.scoreTextNormalized : Scorers.scoreText;
        
        const scores = texts.map(text => ({
            text,
            score: scoreFn(text, languageId, options)
        }));
        
        // Sort by score (descending)
        scores.sort((a, b) => b.score - a.score);
        
        return {
            bestText: scores[0].text,
            bestScore: scores[0].score,
            scores: scores
        };
    },

    /**
     * Scores text against all available languages and returns a ranking.
     * 
     * @param {string} text - Text to score
     * @param {Object} options - Options
     * @param {boolean} options.normalized - Return normalized scores (default: false for backward compatibility)
     * @returns {Array<{lang: string, score: number}>} Sorted high to low
     */
    rankLanguages: (text, options = {}) => {
        const { normalized = false } = options;
        const scoreFn = normalized ? Scorers.scoreTextNormalized : Scorers.scoreText;
        
        const results = [];
        for (const lang in models4gram) {
            results.push({
                lang,
                score: scoreFn(text, lang, options)
            });
        }
        
        // Sort descending (higher score is better)
        return results.sort((a, b) => b.score - a.score);
    },

    /**
     * Helper to get the underlying model instance if needed.
     * @param {string} lang - Language code
     * @param {number} ngramLength - N-gram length (3 or 4, default: 4)
     * @returns {NGramModel|null} Model instance or null if not found
     */
    getModel: (lang, ngramLength = 4) => {
        if (ngramLength === 4) {
            return models4gram[lang] || null;
        } else if (ngramLength === 3) {
            return models3gram[lang] || null;
        }
        return null;
    }
};

export default Scorers;

