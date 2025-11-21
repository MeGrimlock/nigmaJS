import { default as BasicCipher } from '../../basicCipher.js';
import { CipherValidator } from '../../utils/validation.js';

/**
 * Beaufort Cipher
 * 
 * A polyalphabetic substitution cipher similar to Vigenère, but uses subtraction
 * instead of addition. The cipher is self-reciprocal when using the same key.
 * 
 * Formula: C = (K - P) mod 26
 * Where C is ciphertext, K is key letter, P is plaintext letter
 * 
 * Example:
 * Plaintext: HELLO
 * Keyword:   KEY
 * 
 * K - H = (10 - 7) mod 26 = 3 = D
 * E - E = (4 - 4) mod 26 = 0 = A
 * Y - L = (24 - 11) mod 26 = 13 = N
 * K - L = (10 - 11) mod 26 = 25 = Z
 * E - O = (4 - 14) mod 26 = 16 = Q
 * 
 * Ciphertext: DANZQ
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {String} keyword - Keyword for encryption
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */

export default class Beaufort extends BasicCipher {
    constructor(message, keyword = 'KEY', encoded = false, debug = false) {
        super(message, encoded, 'beaufort', keyword, '', debug);
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
     * Encode message using Beaufort cipher
     * @param {String} message - Text to encode
     * @param {String} keyword - Keyword for encryption
     * @returns {String} Encoded message
     */
    encode = (message = this.message, keyword = this.key) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(keyword, 'string');

        if (!keyword || keyword.length === 0) {
            throw new Error('Beaufort cipher requires a non-empty keyword');
        }

        const cleanMessage = message.toUpperCase();
        const cleanKey = keyword.toUpperCase().replace(/[^A-Z]/g, '');
        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < cleanMessage.length; i += 1) {
            const char = cleanMessage[i];

            if (/[A-Z]/.test(char)) {
                const charCode = char.charCodeAt(0) - 65;
                const keyShift = this.getShift(cleanKey[keyIndex % cleanKey.length]);
                // Beaufort: C = (K - P) mod 26
                const encodedChar = String.fromCharCode(((keyShift - charCode + 26) % 26) + 65);
                result += encodedChar;
                keyIndex += 1;
            } else {
                result += char; // Keep non-alphabetic characters
            }
        }

        return result;
    }

    /**
     * Decode message using Beaufort cipher
     * Beaufort is self-reciprocal: decoding is the same as encoding
     * @param {String} message - Text to decode
     * @param {String} keyword - Keyword for decryption
     * @returns {String} Decoded message
     */
    decode = (message = this.message, keyword = this.key) => {
        // Beaufort is self-reciprocal, so decode is the same as encode
        return this.encode(message, keyword);
    }
}

