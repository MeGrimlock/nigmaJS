import { default as BasicCipher } from '../../basicCipher.js';
import { CipherValidator } from '../../utils/validation.js';

/**
 * Quagmire II Cipher
 * 
 * Similar to Quagmire I, but uses a different cipher alphabet for each
 * position based on the keyword. The cipher alphabet changes with each
 * character position.
 * 
 * Example:
 * Plaintext: HELLO
 * Keyword: KEY
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {String} keyword - Keyword for encryption
 * @param {String} indicator - Indicator keyword for alphabet selection
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */
export default class Quagmire2 extends BasicCipher {
    constructor(message, keyword = 'KEY', indicator = 'A', encoded = false, debug = false) {
        super(message, encoded, 'quagmire2', keyword, '', debug);
        this.indicator = indicator || 'A';
    }

    /**
     * Generate cipher alphabet based on indicator letter
     * @param {String} indicator - Letter that determines which alphabet to use
     * @returns {String} Cipher alphabet
     */
    generateCipherAlphabet(indicator) {
        const shift = indicator.toUpperCase().charCodeAt(0) - 65;
        let alphabet = '';
        
        for (let i = 0; i < 26; i++) {
            const index = (i + shift) % 26;
            alphabet += String.fromCharCode(index + 65);
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
     * Encode message using Quagmire II cipher
     * @param {String} message - Text to encode
     * @param {String} keyword - Keyword for encryption
     * @returns {String} Encoded message
     */
    encode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        if (!keyword || keyword.length === 0) {
            throw new Error('Quagmire II cipher requires a non-empty keyword');
        }

        const cleanMessage = message.toUpperCase();
        const cleanKey = keyword.toUpperCase().replace(/[^A-Z]/g, '');
        const indicatorKey = (this.indicator || 'A').toUpperCase().replace(/[^A-Z]/g, '');
        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < cleanMessage.length; i += 1) {
            const char = cleanMessage[i];

            if (/[A-Z]/.test(char)) {
                // Use indicator key to determine which alphabet to use
                const indicatorChar = indicatorKey[keyIndex % indicatorKey.length];
                const cipherAlpha = this.generateCipherAlphabet(indicatorChar);
                
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
     * Decode message using Quagmire II cipher
     * @param {String} message - Text to decode
     * @param {String} keyword - Keyword for decryption
     * @returns {String} Decoded message
     */
    decode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        if (!keyword || keyword.length === 0) {
            throw new Error('Quagmire II cipher requires a non-empty keyword');
        }

        const cleanMessage = message.toUpperCase();
        const cleanKey = keyword.toUpperCase().replace(/[^A-Z]/g, '');
        const indicatorKey = (this.indicator || 'A').toUpperCase().replace(/[^A-Z]/g, '');
        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < cleanMessage.length; i += 1) {
            const char = cleanMessage[i];

            if (/[A-Z]/.test(char)) {
                // Use indicator key to determine which alphabet to use
                const indicatorChar = indicatorKey[keyIndex % indicatorKey.length];
                const cipherAlpha = this.generateCipherAlphabet(indicatorChar);
                
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

