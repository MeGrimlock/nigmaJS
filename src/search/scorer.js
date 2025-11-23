import { NGramModel } from '../language/ngram-model.js';
import { TextUtils } from '../core/text-utils.js';

// Import language data
import spanishData from '../language/models/spanish.js';
import englishData from '../language/models/english.js';
import frenchData from '../language/models/french.js';
import germanData from '../language/models/german.js';
import italianData from '../language/models/italian.js';
import portugueseData from '../language/models/portuguese.js';

/**
 * Optimized scorer for heuristic search algorithms.
 * Uses n-gram log-likelihood to evaluate decryption quality.
 * 
 * Based on the equation:
 * score(T) = Σ log(P(ngram_i))
 * 
 * References:
 * - "Cryptanalysis of Classical Ciphers Using Hill Climbing" (Gaines, adapted)
 * - "An Interactive Cryptanalysis Algorithm for the Vigenère Cipher" (Joux et al.)
 */
export class Scorer {
    /**
     * Creates a scorer for a specific language.
     * @param {string} language - Language code ('english', 'spanish', etc.)
     * @param {number} ngramLength - Length of n-grams to use (default: 4 for quadgrams)
     */
    constructor(language = 'english', ngramLength = 4) {
        this.language = language;
        this.ngramLength = ngramLength;
        
        // Load language model
        const languageData = this._getLanguageData(language);
        if (!languageData) {
            throw new Error(`Unsupported language: ${language}`);
        }
        
        // Create N-gram model
        this.model = new NGramModel(languageData.quadgrams, ngramLength, -10); // Lower floor for better discrimination
    }
    
    /**
     * Gets language data for a given language code.
     * @private
     */
    _getLanguageData(language) {
        const dataMap = {
            'spanish': spanishData,
            'english': englishData,
            'french': frenchData,
            'german': germanData,
            'italian': italianData,
            'portuguese': portugueseData
        };
        return dataMap[language.toLowerCase()];
    }
    
    /**
     * Scores a text using n-gram log-likelihood.
     * Returns the AVERAGE log-likelihood per n-gram for comparability.
     * Higher (less negative) scores indicate better matches to natural language.
     * 
     * @param {string} text - The text to score.
     * @returns {number} The average log-likelihood score (typically negative, closer to 0 is better).
     */
    score(text) {
        const cleaned = TextUtils.onlyLetters(text);
        if (cleaned.length < this.ngramLength) {
            return this.model.floor; // Very short text
        }
        
        const totalScore = this.model.score(text);
        const numNgrams = cleaned.length - this.ngramLength + 1;
        
        return totalScore / numNgrams; // Average score per n-gram
    }
    
    /**
     * Scores a text after applying a substitution key.
     * This is optimized for hill climbing where we repeatedly apply different keys.
     * 
     * @param {string} ciphertext - The original ciphertext.
     * @param {Object} key - A mapping object { 'A': 'Q', 'B': 'W', ... }
     * @returns {number} The log-likelihood score of the decrypted text.
     */
    scoreWithKey(ciphertext, key) {
        const decrypted = this.applyKey(ciphertext, key);
        return this.score(decrypted);
    }
    
    /**
     * Applies a substitution key to a ciphertext.
     * @param {string} ciphertext - The ciphertext to decrypt.
     * @param {Object} key - A mapping object { 'A': 'Q', 'B': 'W', ... }
     * @returns {string} The decrypted text.
     */
    applyKey(ciphertext, key) {
        const cleaned = TextUtils.onlyLetters(ciphertext);
        let result = '';
        for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i];
            result += key[char] || char; // Use key mapping or keep original if not in key
        }
        return result;
    }
    
    /**
     * Creates a random substitution key (permutation of the alphabet).
     * @returns {Object} A random key mapping.
     */
    static randomKey() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const shuffled = [...alphabet].sort(() => Math.random() - 0.5);
        
        const key = {};
        for (let i = 0; i < alphabet.length; i++) {
            key[alphabet[i]] = shuffled[i];
        }
        return key;
    }
    
    /**
     * Creates an identity key (no substitution).
     * @returns {Object} An identity key mapping.
     */
    static identityKey() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const key = {};
        for (const char of alphabet) {
            key[char] = char;
        }
        return key;
    }
    
    /**
     * Creates a key based on frequency analysis.
     * Maps most frequent ciphertext letters to most frequent plaintext letters.
     * 
     * @param {string} ciphertext - The ciphertext to analyze.
     * @param {string} language - The target language.
     * @returns {Object} A frequency-based key mapping.
     */
    static frequencyKey(ciphertext, language = 'english') {
        const cleaned = TextUtils.onlyLetters(ciphertext);
        
        // Count frequencies in ciphertext
        const counts = {};
        for (const char of cleaned) {
            counts[char] = (counts[char] || 0) + 1;
        }
        
        // Sort by frequency (descending)
        const cipherFreq = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        
        // Standard frequency order for English (most common first)
        const langFreq = {
            'english': 'ETAOINSHRDLCUMWFGYPBVKJXQZ',
            'spanish': 'EAOSRNIDLCTUMPBGVYQHFZJÑXKW',
            'french': 'ESAITNRULODCPMVQFBGHJXYZWK',
            'german': 'ENISRATDHULCGMOBWFKZPVJYXQ',
            'italian': 'EAIONLRTSCDUPMVGHFBQZYX',
            'portuguese': 'AEOSIRNMTDULCPVGQBFHJZXYKW'
        };
        
        const plaintextFreq = langFreq[language.toLowerCase()] || langFreq['english'];
        
        // Create mapping
        const key = {};
        for (let i = 0; i < cipherFreq.length; i++) {
            key[cipherFreq[i]] = plaintextFreq[i] || plaintextFreq[plaintextFreq.length - 1];
        }
        
        // Fill in missing letters with identity
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (const char of alphabet) {
            if (!key[char]) {
                key[char] = char;
            }
        }
        
        return key;
    }
    
    /**
     * Swaps two letters in a key.
     * @param {Object} key - The key to modify.
     * @param {string} char1 - First character.
     * @param {string} char2 - Second character.
     * @returns {Object} A new key with the swap applied.
     */
    static swapKey(key, char1, char2) {
        const newKey = { ...key };
        const temp = newKey[char1];
        newKey[char1] = newKey[char2];
        newKey[char2] = temp;
        return newKey;
    }
    
    /**
     * Copies a key.
     * @param {Object} key - The key to copy.
     * @returns {Object} A deep copy of the key.
     */
    static copyKey(key) {
        return { ...key };
    }
}

