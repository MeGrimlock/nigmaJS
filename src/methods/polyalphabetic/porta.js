import { default as BasicCipher } from '../../basicCipher.js';
import { CipherValidator } from '../../utils/validation.js';

/**
 * Porta Cipher
 * 
 * A polyalphabetic substitution cipher that uses mutually reversible alphabets.
 * The cipher uses 13 pairs of alphabets, where each pair is mutually reversible.
 * The key letter determines which alphabet pair to use.
 * 
 * Alphabet pairs (A-M map to pairs 0-12):
 * Each pair has two alphabets that are reverses of each other
 * 
 * Example:
 * Plaintext: HELLO
 * Keyword:   KEY
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {String} keyword - Keyword for encryption
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */

export default class Porta extends BasicCipher {
    constructor(message, keyword = 'KEY', encoded = false, debug = false) {
        super(message, encoded, 'porta', keyword, '', debug);
        this.alphabetPairs = this.generateAlphabetPairs();
    }

    /**
     * Generate the 13 mutually reversible alphabet pairs
     * Porta cipher uses a specific pattern where each pair is mutually reversible
     * @returns {Array} Array of 13 alphabet pairs
     */
    generateAlphabetPairs() {
        const pairs = [];
        const baseAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        // Porta uses 13 pairs (A-M map to pairs 0-12)
        // Each pair has two alphabets that are mutually reversible
        for (let i = 0; i < 13; i++) {
            const pair = [];
            
            // First alphabet of pair: split into two halves
            // First half (A-M): normal order starting from position i
            // Second half (N-Z): reverse order starting from position 25-i
            let first = '';
            // First 13 letters (A-M)
            for (let j = 0; j < 13; j++) {
                first += baseAlphabet[(j + i) % 13];
            }
            // Second 13 letters (N-Z) in reverse
            for (let j = 0; j < 13; j++) {
                first += baseAlphabet[25 - ((j + i) % 13)];
            }
            
            // Second alphabet: mutually reversible with first
            // For Porta, the second alphabet is the reverse mapping
            // We need to create a lookup that reverses the first alphabet
            let second = '';
            // Create reverse mapping: for each position in first, find where it maps
            for (let pos = 0; pos < 26; pos++) {
                const char = baseAlphabet[pos];
                const indexInFirst = first.indexOf(char);
                second += baseAlphabet[indexInFirst];
            }
            
            pair.push(first);
            pair.push(second);
            pairs.push(pair);
        }
        
        return pairs;
    }

    /**
     * Get alphabet pair index from key letter
     * A-M map to pairs 0-12, N-Z map to pairs 0-12 (same as A-M)
     * @param {String} letter - Key letter
     * @returns {Number} Pair index (0-12)
     */
    getPairIndex(letter) {
        const charCode = letter.toUpperCase().charCodeAt(0) - 65;
        return charCode % 13;
    }

    /**
     * Encode message using Porta cipher
     * @param {String} message - Text to encode
     * @param {String} keyword - Keyword for encryption
     * @returns {String} Encoded message
     */
    encode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        if (!keyword || keyword.length === 0) {
            throw new Error('Porta cipher requires a non-empty keyword');
        }

        const cleanMessage = message.toUpperCase();
        const cleanKey = keyword.toUpperCase().replace(/[^A-Z]/g, '');
        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < cleanMessage.length; i += 1) {
            const char = cleanMessage[i];

            if (/[A-Z]/.test(char)) {
                const keyChar = cleanKey[keyIndex % cleanKey.length];
                const pairIndex = this.getPairIndex(keyChar);
                const pair = this.alphabetPairs[pairIndex];
                
                // Use first alphabet of the pair for encoding
                const charIndex = char.charCodeAt(0) - 65;
                result += pair[0][charIndex];
                keyIndex += 1;
            } else {
                result += char; // Keep non-alphabetic characters
            }
        }

        return result;
    }

    /**
     * Decode message using Porta cipher
     * Porta uses mutually reversible alphabets: find position in first alphabet
     * @param {String} message - Text to decode
     * @param {String} keyword - Keyword for decryption
     * @returns {String} Decoded message
     */
    decode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        if (!keyword || keyword.length === 0) {
            throw new Error('Porta cipher requires a non-empty keyword');
        }

        const cleanMessage = message.toUpperCase();
        const cleanKey = keyword.toUpperCase().replace(/[^A-Z]/g, '');
        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < cleanMessage.length; i += 1) {
            const char = cleanMessage[i];

            if (/[A-Z]/.test(char)) {
                const keyChar = cleanKey[keyIndex % cleanKey.length];
                const pairIndex = this.getPairIndex(keyChar);
                const pair = this.alphabetPairs[pairIndex];
                
                // For decoding, find the position of the cipher char in first alphabet
                // then map it back using the second alphabet (which is the reverse)
                const posInFirst = pair[0].indexOf(char);
                if (posInFirst !== -1) {
                    // The second alphabet maps back to original
                    result += String.fromCharCode(posInFirst + 65);
                } else {
                    result += char;
                }
                keyIndex += 1;
            } else {
                result += char; // Keep non-alphabetic characters
            }
        }

        return result;
    }
}

