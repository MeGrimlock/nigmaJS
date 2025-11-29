import { TextUtils } from '../core/text-utils.js';

/**
 * Kasiski Examination: Finds repeated n-grams in ciphertext and calculates distances between them.
 * Used to estimate key length for polyalphabetic ciphers (Vigenère, etc.).
 */
export class Kasiski {
    /**
     * Finds all repeated n-grams of a given length and their positions.
     * @param {string} text - The ciphertext to analyze.
     * @param {number} ngramLength - The length of n-grams to search for (default: 3 for trigrams).
     * @returns {Object<string, number[]>} A map of n-gram -> array of positions where it appears.
     */
    static findRepeatedNGrams(text, ngramLength = 3) {
        const cleaned = TextUtils.onlyLetters(text || '');
        const positions = {};

        if (!cleaned || cleaned.length < ngramLength) {
            return positions;
        }

        const maxIndex = cleaned.length - ngramLength;
        for (let i = 0; i <= maxIndex; i++) {
            const ngram = cleaned.substring(i, i + ngramLength);
            if (!positions[ngram]) {
                positions[ngram] = [];
            }
            positions[ngram].push(i);
        }

        // Filter out n-grams that only appear once
        const repeated = {};
        for (const ngram in positions) {
            if (positions[ngram].length > 1) {
                repeated[ngram] = positions[ngram];
            }
        }

        return repeated;
    }

    /**
     * Calculates distances between repeated n-grams.
     * @param {Object<string, number[]>} repeatedNGrams - Output from findRepeatedNGrams.
     * @returns {number[]} An array of all distances between repetitions.
     */
    static calculateDistances(repeatedNGrams) {
        const distances = [];

        if (!repeatedNGrams) return distances;

        for (const ngram in repeatedNGrams) {
            const positions = repeatedNGrams[ngram];
            const len = positions.length;
            if (len < 2) continue;

            for (let i = 0; i < len - 1; i++) {
                const base = positions[i];
                for (let j = i + 1; j < len; j++) {
                    const d = positions[j] - base;
                    if (d > 0) {
                        distances.push(d);
                    }
                }
            }
        }

        return distances;
    }

    /**
     * Calculates the Greatest Common Divisor (GCD) of two numbers.
     * @param {number} a
     * @param {number} b
     * @returns {number} The GCD of a and b (always non-negative).
     */
    static gcd(a, b) {
        a = Math.abs(a | 0);
        b = Math.abs(b | 0);

        // Handle edge case gcd(0,0) = 0
        if (a === 0 && b === 0) return 0;

        while (b !== 0) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    /**
     * Finds the GCD of an array of numbers.
     * @param {number[]} numbers
     * @returns {number} The GCD of all numbers, or 0 if the array is empty.
     */
    static gcdArray(numbers) {
        if (!numbers || numbers.length === 0) return 0;
        if (numbers.length === 1) return Math.abs(numbers[0] | 0);

        // Use explicit class reference so this also works if destructured: const { gcdArray } = Kasiski;
        return numbers.reduce((acc, num) => Kasiski.gcd(acc, num));
    }

    /**
     * Suggests probable key lengths based on Kasiski examination.
     * IMPORTANT:
     * - Only key lengths >= 2 are considered (keyLength=1 is just Caesar/monoalphabetic).
     *
     * @param {string} text - The ciphertext to analyze.
     * @param {number} ngramLength - The length of n-grams to search for (default: 3).
     * @param {number} maxKeyLength - Maximum key length to consider (default: 20).
     * @returns {Array<{keyLength:number, length:number, score:number}>}
     *          An array of { keyLength, length (alias), score } sorted by score (descending).
     */
    static suggestKeyLengths(text, ngramLength = 3, maxKeyLength = 20) {
        const cleaned = TextUtils.onlyLetters(text || '');
        if (!cleaned || cleaned.length < ngramLength * 2) {
            // Need at least 2 n-grams of length n to have any repetition
            return [];
        }

        const repeated = this.findRepeatedNGrams(cleaned, ngramLength);
        const distances = this.calculateDistances(repeated);

        if (distances.length === 0) {
            // No repetitions found, likely monoalphabetic or very short text
            return [];
        }

        // Count how many distances are divisible by each possible key length
        const keyCounts = {};
        const maxCandidate = Math.min(maxKeyLength, cleaned.length); // can't have key > text length

        for (let keyLen = 2; keyLen <= maxCandidate; keyLen++) {
            keyCounts[keyLen] = 0;
        }

        for (const distance of distances) {
            // distance is always > 0 (filtered in calculateDistances)
            const maxForDistance = Math.min(maxCandidate, distance);
            for (let keyLen = 2; keyLen <= maxForDistance; keyLen++) {
                if (distance % keyLen === 0) {
                    keyCounts[keyLen]++;
                }
            }
        }

        // Convert to array and sort by count (score)
        const results = [];
        for (const keyLenStr in keyCounts) {
            const count = keyCounts[keyLenStr];
            if (count > 0) {
                const keyLength = parseInt(keyLenStr, 10);
                const score = count / distances.length; // Normalize by total distances

                results.push({
                    keyLength,
                    // Alias "length" for backwards compatibility with older code
                    // (e.g., CipherIdentifier that may use topKeyLength.length)
                    length: keyLength,
                    score
                });
            }
        }

        return results.sort((a, b) => b.score - a.score);
    }

    /**
     * Performs a full Kasiski examination on a ciphertext.
     * @param {string} text - The ciphertext to analyze.
     * @returns {{
     *   repeatedNGrams: Object<string, number[]>,
     *   distances: number[],
     *   suggestedKeyLengths: Array<{keyLength:number, length:number, score:number}>,
     *   hasRepetitions: boolean
     * }}
     */
    static examine(text) {
        const cleaned = TextUtils.onlyLetters(text || '');
        const repeated = this.findRepeatedNGrams(cleaned, 3);
        const distances = this.calculateDistances(repeated);
        const suggestedKeyLengths = this.suggestKeyLengths(cleaned, 3, 20);

        return {
            repeatedNGrams: repeated,
            repeats: Object.values(repeated),
            distances,
            suggestedKeyLengths,
            hasRepetitions: Object.keys(repeated).length > 0
        };
    }
}
