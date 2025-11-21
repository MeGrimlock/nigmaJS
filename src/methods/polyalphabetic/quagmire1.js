import { default as BasicCipher } from '../../basicCipher.js';
import { CipherValidator } from '../../utils/validation.js';

/**
 * Quagmire I Cipher
 * 
 * A polyalphabetic substitution cipher similar to Vigenère, but uses a fixed
 * cipher alphabet instead of the standard alphabet. The keyword determines
 * which row of the Vigenère square to use, and the cipher alphabet is used
 * for substitution.
 * 
 * Example:
 * Plaintext: HELLO
 * Keyword: KEY
 * Cipher Alphabet: ZYXWVUTSRQPONMLKJIHGFEDCBA (reversed)
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {String} keyword - Keyword for encryption
 * @param {String} cipherAlphabet - Custom alphabet for substitution (optional)
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */
export default class Quagmire1 extends BasicCipher {
    constructor(message, keyword = 'KEY', cipherAlphabet = '', encoded = false, debug = false) {
        super(message, encoded, 'quagmire1', keyword, '', debug);
        this.cipherAlphabet = cipherAlphabet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }

    /**
     * Generate cipher alphabet from keyword or use provided one
     * @param {String} keyword - Keyword for generating alphabet
     * @returns {String} Cipher alphabet
     */
    generateCipherAlphabet(keyword) {
        if (this.cipherAlphabet && this.cipherAlphabet.length === 26) {
            return this.cipherAlphabet.toUpperCase();
        }
        
        // If no custom alphabet, use keyword to generate one
        const cleanKey = keyword.toUpperCase().replace(/[^A-Z]/g, '');
        const used = new Set();
        let alphabet = '';
        
        // Add keyword letters first
        for (const char of cleanKey) {
            if (!used.has(char)) {
                alphabet += char;
                used.add(char);
            }
        }
        
        // Add remaining letters
        for (let i = 65; i <= 90; i++) {
            const char = String.fromCharCode(i);
            if (!used.has(char)) {
                alphabet += char;
            }
        }
        
        return alphabet;
    }

    /**
     * Get the shift value for a letter (A=0, B=1, ..., Z=25)
     * @param {String} letter - Single letter
     * @returns {Number} Shift value
     */
    getShift(letter) {
        return letter.toUpperCase().charCodeAt(0) - 65;
    }

    /**
     * Encode message using Quagmire I cipher
     * @param {String} message - Text to encode
     * @param {String} keyword - Keyword for encryption
     * @returns {String} Encoded message
     */
    encode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        if (!keyword || keyword.length === 0) {
            throw new Error('Quagmire I cipher requires a non-empty keyword');
        }

        const cleanMessage = message.toUpperCase();
        const cleanKey = keyword.toUpperCase().replace(/[^A-Z]/g, '');
        const cipherAlpha = this.generateCipherAlphabet(keyword);
        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < cleanMessage.length; i += 1) {
            const char = cleanMessage[i];

            if (/[A-Z]/.test(char)) {
                const charCode = char.charCodeAt(0) - 65;
                const shift = this.getShift(cleanKey[keyIndex % cleanKey.length]);
                const cipherIndex = (charCode + shift) % 26;
                result += cipherAlpha[cipherIndex];
                keyIndex += 1;
            } else {
                result += char; // Keep non-alphabetic characters
            }
        }

        return result;
    }

    /**
     * Decode message using Quagmire I cipher
     * @param {String} message - Text to decode
     * @param {String} keyword - Keyword for decryption
     * @returns {String} Decoded message
     */
    decode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        if (!keyword || keyword.length === 0) {
            throw new Error('Quagmire I cipher requires a non-empty keyword');
        }

        const cleanMessage = message.toUpperCase();
        const cleanKey = keyword.toUpperCase().replace(/[^A-Z]/g, '');
        const cipherAlpha = this.generateCipherAlphabet(keyword);
        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < cleanMessage.length; i += 1) {
            const char = cleanMessage[i];

            if (/[A-Z]/.test(char)) {
                const shift = this.getShift(cleanKey[keyIndex % cleanKey.length]);
                const cipherIndex = cipherAlpha.indexOf(char);
                if (cipherIndex !== -1) {
                    const decodedIndex = (cipherIndex - shift + 26) % 26;
                    result += String.fromCharCode(decodedIndex + 65);
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

