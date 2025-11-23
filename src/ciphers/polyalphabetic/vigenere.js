import { default as BasicCipher } from '../../core/basicCipher.js';
import { CipherValidator } from '../../core/validation.js';

/**
 * Vigenere Cipher
 * 
 * A polyalphabetic substitution cipher that uses a keyword to determine
 * different Caesar shifts for each letter. Each letter in the plaintext
 * is shifted by the value of the corresponding letter in the repeating keyword.
 * 
 * Example:
 * Plaintext: HELLO
 * Keyword:   KEY
 * 
 * H + K = R, E + E = I, L + Y = J, L + K = V, O + E = S
 * Ciphertext: RIJVS
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {String} keyword - Keyword for encryption
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */

export default class Vigenere extends BasicCipher {
    constructor(message, keyword = 'KEY', encoded = false, debug = false) {
        super(message, encoded, 'vigenere', keyword, '', debug);
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
     * Encode message using Vigenere cipher
     * @param {String} message - Text to encode
     * @param {String} keyword - Keyword for encryption
     * @returns {String} Encoded message
     */
    encode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        if (!keyword || keyword.length === 0) {
            throw new Error('Vigenere cipher requires a non-empty keyword');
        }

        const cleanMessage = message.toUpperCase();
        const cleanKey = keyword.toUpperCase().replace(/[^A-Z]/g, '');
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
     * Decode message using Vigenere cipher
     * @param {String} message - Text to decode
     * @param {String} keyword - Keyword for decryption
     * @returns {String} Decoded message
     */
    decode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        if (!keyword || keyword.length === 0) {
            throw new Error('Vigenere cipher requires a non-empty keyword');
        }

        const cleanMessage = message.toUpperCase();
        const cleanKey = keyword.toUpperCase().replace(/[^A-Z]/g, '');
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
