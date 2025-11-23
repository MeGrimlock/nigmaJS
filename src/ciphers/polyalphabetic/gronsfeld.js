import { default as BasicCipher } from '../../core/basicCipher.js';
import { CipherValidator } from '../../core/validation.js';

/**
 * Gronsfeld Cipher
 * 
 * A polyalphabetic substitution cipher similar to Vigenère, but uses numeric keys
 * instead of alphabetic keys. Each digit in the key represents a Caesar shift.
 * 
 * Example:
 * Plaintext: HELLO
 * Keyword:   12345
 * 
 * H + 1 = I
 * E + 2 = G
 * L + 3 = O
 * L + 4 = P
 * O + 5 = T
 * 
 * Ciphertext: IGOPT
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {String} keyword - Numeric keyword for encryption (digits 0-9)
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */

export default class Gronsfeld extends BasicCipher {
    constructor(message, keyword = '12345', encoded = false, debug = false) {
        super(message, encoded, 'gronsfeld', keyword, '', debug);
    }

    /**
     * Get the shift value from a digit character
     * @param {String} digit - Single digit character (0-9)
     * @returns {Number} Shift value (0-9)
     */
    getShift(digit) {
        const num = parseInt(digit, 10);
        return isNaN(num) ? 0 : num;
    }

    /**
     * Encode message using Gronsfeld cipher
     * @param {String} message - Text to encode
     * @param {String} keyword - Numeric keyword for encryption
     * @returns {String} Encoded message
     */
    encode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        if (!keyword || keyword.length === 0) {
            throw new Error('Gronsfeld cipher requires a non-empty numeric keyword');
        }

        const cleanMessage = message.toUpperCase();
        const cleanKey = keyword.replace(/[^0-9]/g, '');

        if (cleanKey.length === 0) {
            throw new Error('Gronsfeld cipher requires a numeric keyword (digits 0-9)');
        }

        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < cleanMessage.length; i += 1) {
            const char = cleanMessage[i];

            if (/[A-Z]/.test(char)) {
                const charCode = char.charCodeAt(0) - 65;
                const shift = this.getShift(cleanKey[keyIndex % cleanKey.length]);
                const encodedChar = String.fromCharCode(((charCode + shift) % 26) + 65);
                result += encodedChar;
                keyIndex += 1;
            } else {
                result += char; // Keep non-alphabetic characters
            }
        }

        return result;
    }

    /**
     * Decode message using Gronsfeld cipher
     * @param {String} message - Text to decode
     * @param {String} keyword - Numeric keyword for decryption
     * @returns {String} Decoded message
     */
    decode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        if (!keyword || keyword.length === 0) {
            throw new Error('Gronsfeld cipher requires a non-empty numeric keyword');
        }

        const cleanMessage = message.toUpperCase();
        const cleanKey = keyword.replace(/[^0-9]/g, '');

        if (cleanKey.length === 0) {
            throw new Error('Gronsfeld cipher requires a numeric keyword (digits 0-9)');
        }

        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < cleanMessage.length; i += 1) {
            const char = cleanMessage[i];

            if (/[A-Z]/.test(char)) {
                const charCode = char.charCodeAt(0) - 65;
                const shift = this.getShift(cleanKey[keyIndex % cleanKey.length]);
                const decodedChar = String.fromCharCode(((charCode - shift + 26) % 26) + 65);
                result += decodedChar;
                keyIndex += 1;
            } else {
                result += char; // Keep non-alphabetic characters
            }
        }

        return result;
    }
}

