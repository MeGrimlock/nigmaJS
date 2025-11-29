import { TextUtils } from '../core/text-utils.js';
import { LanguageAnalysis } from './analysis-core.js';

/**
 * Basic statistical analysis for ciphertexts.
 */
export const Stats = {
    /**
     * Calculates character frequencies.
     * @param {string} text - Text to analyze (will be cleaned internally unless assumeCleaned=true)
     * @param {boolean} assumeCleaned - If true, assumes text is already cleaned (A-Z only, no spaces)
     * @returns {{length:number, counts:Object<string,number>, histogram:Object<string,number>}}
     */
    frequency: (text, assumeCleaned = false) => {
        const clean = assumeCleaned ? (text || '') : TextUtils.onlyLetters(text || '');
        const counts = {};
        const len = clean.length;

        if (len === 0) {
            return {
                length: 0,
                counts: {},
                histogram: {}
            };
        }

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
     * Calculates n-gram frequencies from cleaned text (assumes text is already normalized).
     * Works with continuous text (no spaces required).
     * @param {string} text - Cleaned text (A-Z only, no spaces) - assumes already normalized
     * @param {number} n - N-gram size (2 for bigrams, 3 for trigrams, etc.)
     * @returns {Object<string,number>} Map of n-gram -> frequency (0-1 probability)
     */
    ngramFrequencies: (text, n = 2) => {
        if (!text || text.length < n) return {};

        const freq = {};
        const total = text.length - n + 1;

        for (let i = 0; i <= text.length - n; i++) {
            const gram = text.slice(i, i + n);
            freq[gram] = (freq[gram] || 0) + 1;
        }

        // Normalize to probabilities (0-1)
        for (const g in freq) {
            freq[g] /= total;
        }

        return freq;
    },

    /**
     * Gets top N most frequent letters from cleaned text.
     * @param {string} text - Cleaned text (assumes already normalized A-Z)
     * @param {number} topN - Number of top letters to return
     * @returns {Array<{letter: string, count: number, frequency: number}>}
     */
    getTopLetters: (text, topN = 10) => {
        const freqData = Stats.frequency(text, true); // Assume cleaned
        const entries = Object.entries(freqData.counts)
            .map(([letter, count]) => ({
                letter,
                count,
                frequency: (freqData.histogram[letter] || 0) * 100 // Convert to percentage
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, topN);

        return entries;
    },

    /**
     * Gets top N most frequent n-grams from cleaned text.
     * @param {string} text - Cleaned text (assumes already normalized A-Z, no spaces)
     * @param {number} n - N-gram size
     * @param {number} topN - Number of top n-grams to return
     * @returns {Array<{gram: string, count: number, frequency: number}>}
     */
    getTopNGrams: (text, n = 2, topN = 10) => {
        if (!text || text.length < n) {
            return [];
        }

        const freq = Stats.ngramFrequencies(text, n);
        const total = text.length - n + 1;

        const entries = Object.entries(freq)
            .map(([gram, probability]) => ({
                gram,
                count: Math.round(probability * total),
                frequency: probability * 100 // Convert to percentage
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, topN);

        return entries;
    },

    /**
     * Calculates Index of Coincidence (IoC).
     * IoC ≈ 0.038 for random text (uniform), ≈ 0.067 for English/Spanish.
     * Normalized IoC (x26) ≈ 1.0 for random, ≈ 1.73 for English.
     *
     * CRITICAL: This function ALWAYS cleans the text internally to ensure
     * only letters A-Z are counted. This prevents IC distortion from spaces,
     * numbers, punctuation, etc.
     *
     * @param {string} text
     * @param {boolean} normalized - Multiply by 26 (default: true)
     * @returns {number}
     */
    indexOfCoincidence: (text, normalized = true) => {
        if (!text) return 0;

        // Always clean text internally - only letters A-Z
        const cleaned = text
            .toUpperCase()
            .replace(/[^A-Z]/g, '');

        const N = cleaned.length;
        if (N < 2) return 0;

        // Use array for counts (more efficient than object for A-Z)
        const counts = new Array(26).fill(0);
        for (const ch of cleaned) {
            const idx = ch.charCodeAt(0) - 65; // A=0, Z=25
            if (idx >= 0 && idx < 26) {
                counts[idx]++;
            }
        }

        let sum = 0;
        for (const n of counts) {
            sum += n * (n - 1);
        }

        const ioc = sum / (N * (N - 1));
        return normalized ? ioc * 26 : ioc;
    },

    /**
     * Calculates Shannon Entropy.
     * Random text ≈ 4.7 (log2(26)).
     * English/Spanish ≈ 4.0 - 4.2.
     * @param {string} text
     * @returns {number}
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
     * Internal helper: extract candidate words for dictionary validation.
     * @param {string} text
     * @returns {string[]} Uppercase words (letters only) with length >= 3
     */
    _extractDictionaryWords: (text) => {
        if (!text) return [];
        return text
            .toUpperCase()
            .split(/\s+/)
            .map(w => TextUtils.onlyLetters(w))
            .filter(w => w.length >= 3);
    },

    /**
     * Calculates Index of Coincidence with dictionary validation.
     * Returns adjusted IoC: IC * (1 + dictionaryBonus)
     * @param {string} text - Text to analyze
     * @param {string} language - Target language for dictionary validation
     * @param {boolean} normalized - Multiply by 26 (default: true)
     * @returns {Promise<{ioc:number, dictionaryBonus:number, adjustedIoc:number}>}
     */
    indexOfCoincidenceWithValidation: async (text, language = 'english', normalized = true) => {
        // Calculate normal IoC
        const ioc = Stats.indexOfCoincidence(text, normalized);

        // Dictionary validation bonus
        let dictionaryBonus = 0;
        try {
            const dict = LanguageAnalysis.getDictionary(language);
            if (dict) {
                const words = Stats._extractDictionaryWords(text);
                if (words.length > 0) {
                    let validWords = 0;
                    for (const word of words) {
                        if (dict.has(word)) {
                            validWords++;
                        }
                    }
                    dictionaryBonus = validWords / words.length; // 0-1
                }
            }
        } catch (error) {
            // Dictionary not available, continue with normal IoC
            console.warn('[Stats] Dictionary validation failed:', error);
        }

        // Adjusted IoC: max 10% bonus if all words are valid
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
     *
     * IMPORTANT:
     * - expectedFreqs may be:
     *   - probabilities (0-1), e.g. 0.082
     *   - or percentages (0-100), e.g. 8.2
     *   This function auto-detects and normalizes to probabilities.
     *
     * @param {string} text - Text to analyze
     * @param {Object<string, number>} expectedFreqs - Expected letter frequencies (0-1 or 0-100)
     * @param {string} language - Target language for dictionary validation
     * @returns {Promise<{chiSquared:number, dictionaryScore:number, combinedScore:number}>}
     */
    chiSquaredWithDictionary: async (text, expectedFreqs, language = 'english') => {
        // Normalize expected frequencies to probabilities (0-1)
        const normalizedExpected = {};
        if (expectedFreqs && typeof expectedFreqs === 'object') {
            let sum = 0;
            for (const letter in expectedFreqs) {
                const v = expectedFreqs[letter] || 0;
                if (Number.isFinite(v)) {
                    sum += v;
                }
            }

            const assumePercentages = sum > 1.5; // sum≈100 → percentages, sum≈1 → probabilities

            for (const letter in expectedFreqs) {
                const raw = expectedFreqs[letter] || 0;
                normalizedExpected[letter] = assumePercentages ? raw / 100 : raw;
            }
        }

        // Calculate normal chi-squared over letters A-Z
        const observedFreqs = Stats.frequency(text).histogram;
        let chiSquared = 0;

        for (const letter in normalizedExpected) {
            const expected = normalizedExpected[letter] || 0;
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
                const words = Stats._extractDictionaryWords(text);
                if (words.length > 0) {
                    let validWords = 0;
                    for (const word of words) {
                        if (dict.has(word)) {
                            validWords++;
                        }
                    }
                    dictionaryScore = validWords / words.length; // 0-1
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
