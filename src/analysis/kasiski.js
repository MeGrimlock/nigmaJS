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
     * @returns {Object} A map of n-gram -> array of positions where it appears.
     */
    static findRepeatedNGrams(text, ngramLength = 3) {
        const cleaned = TextUtils.onlyLetters(text);
        const positions = {};

        if (cleaned.length < ngramLength) {
            return positions;
        }

        for (let i = 0; i <= cleaned.length - ngramLength; i++) {
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
     * @param {Object} repeatedNGrams - Output from findRepeatedNGrams.
     * @returns {Array<number>} An array of all distances between repetitions.
     */
    static calculateDistances(repeatedNGrams) {
        const distances = [];

        for (const ngram in repeatedNGrams) {
            const positions = repeatedNGrams[ngram];
            for (let i = 0; i < positions.length - 1; i++) {
                for (let j = i + 1; j < positions.length; j++) {
                    distances.push(positions[j] - positions[i]);
                }
            }
        }

        return distances;
    }

    /**
     * Calculates the Greatest Common Divisor (GCD) of two numbers.
     * @param {number} a
     * @param {number} b
     * @returns {number} The GCD of a and b.
     */
    static gcd(a, b) {
        while (b !== 0) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    /**
     * Finds the GCD of an array of numbers.
     * @param {Array<number>} numbers
     * @returns {number} The GCD of all numbers, or 0 if the array is empty.
     */
    static gcdArray(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((acc, num) => this.gcd(acc, num));
    }

    /**
     * Suggests probable key lengths based on Kasiski examination.
     * @param {string} text - The ciphertext to analyze.
     * @param {number} ngramLength - The length of n-grams to search for (default: 3).
     * @param {number} maxKeyLength - Maximum key length to consider (default: 20).
     * @returns {Array<Object>} An array of { keyLength: number, score: number } sorted by score (descending).
     */
    static suggestKeyLengths(text, ngramLength = 3, maxKeyLength = 20) {
        const repeated = this.findRepeatedNGrams(text, ngramLength);
        const distances = this.calculateDistances(repeated);

        if (distances.length === 0) {
            // No repetitions found, likely monoalphabetic or very short text
            return [];
        }

        // Count how many distances are divisible by each possible key length
        const keyCounts = {};
        for (let keyLen = 2; keyLen <= maxKeyLength; keyLen++) {
            keyCounts[keyLen] = 0;
        }

        for (const distance of distances) {
            for (let keyLen = 2; keyLen <= Math.min(maxKeyLength, distance); keyLen++) {
                if (distance % keyLen === 0) {
                    keyCounts[keyLen]++;
                }
            }
        }

        // Convert to array and sort by count (score)
        const results = [];
        for (const keyLen in keyCounts) {
            if (keyCounts[keyLen] > 0) {
                results.push({
                    keyLength: parseInt(keyLen),
                    score: keyCounts[keyLen] / distances.length // Normalize by total distances
                });
            }
        }

        return results.sort((a, b) => b.score - a.score);
    }

    /**
     * Performs a full Kasiski examination on a ciphertext.
     * @param {string} text - The ciphertext to analyze.
     * @returns {Object} An object containing repeated n-grams, distances, and suggested key lengths.
     */
    static examine(text) {
        const repeated = this.findRepeatedNGrams(text, 3);
        const distances = this.calculateDistances(repeated);
        const keyLengths = this.suggestKeyLengths(text, 3, 20);

        return {
            repeatedNGrams: repeated,
            distances: distances,
            suggestedKeyLengths: keyLengths,
            hasRepetitions: Object.keys(repeated).length > 0
        };
    }
}

