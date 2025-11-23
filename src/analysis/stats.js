import { TextUtils } from '../core/text-utils.js';

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
    }
};

export default Stats;

