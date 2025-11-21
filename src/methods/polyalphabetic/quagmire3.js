import { default as BasicCipher } from '../../basicCipher.js';
import { CipherValidator } from '../../utils/validation.js';

/**
 * Quagmire III Cipher
 * 
 * Uses a variable cipher alphabet that changes based on the plaintext itself.
 * The alphabet is determined by the current position in the message and the keyword.
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

export default class Quagmire3 extends BasicCipher {
    constructor(message, keyword = 'KEY', indicator = 'KEY', encoded = false, debug = false) {
        super(message, encoded, 'quagmire3', keyword, '', debug);
        this.indicator = indicator || 'KEY';
        this.keyedAlphabet = this.buildKeyedAlphabet(keyword);
    }

    /**
     * Construye el alfabeto keyed (K3: mismo para pt y ct)
     * Ej: KEY = AUTOMOBILE -> AUTOMBILECDFGHJKNPQRSVWXYZ
     */
    buildKeyedAlphabet(key) {
        const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
        const used = new Set();
        let result = '';

        for (const ch of cleanKey) {
            if (!used.has(ch)) {
                used.add(ch);
                result += ch;
            }
        }

        for (let i = 0; i < 26; i++) {
            const ch = String.fromCharCode(65 + i);
            if (!used.has(ch)) {
                used.add(ch);
                result += ch;
            }
        }

        return result;
    }

    /** índice de una letra dentro del alfabeto keyed */
    indexInKeyed(letter) {
        return this.keyedAlphabet.indexOf(letter.toUpperCase());
    }

    /**
     * Encode Quagmire III (Keyed Vigenère)
     * keyword => define el alfabeto keyed (this.keyedAlphabet)
     * indicator => key de tipo Vigenère
     */
    encode = (message = this.message, indicatorKey = this.indicator) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(this.key, 'string');
        CipherValidator.validateKey(indicatorKey, 'string');

        if (!this.key || this.key.length === 0) {
            throw new Error('Quagmire III cipher requires a non-empty keyword');
        }

        const cleanMessage = message.toUpperCase();
        const cleanIndicator = indicatorKey.toUpperCase().replace(/[^A-Z]/g, '');

        if (!cleanIndicator.length) {
            throw new Error('Quagmire III cipher requires a non-empty indicator key');
        }

        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < cleanMessage.length; i++) {
            const ch = cleanMessage[i];

            if (/[A-Z]/.test(ch)) {
                const pIndex = this.indexInKeyed(ch);
                const kChar = cleanIndicator[keyIndex % cleanIndicator.length];
                const kIndex = this.indexInKeyed(kChar);

                if (pIndex === -1 || kIndex === -1) {
                    // letra fuera del alfabeto keyed (no debería pasar)
                    result += ch;
                } else {
                    const cIndex = (pIndex + kIndex) % 26;
                    result += this.keyedAlphabet[cIndex];
                    keyIndex++;
                }
            } else {
                result += ch;
            }
        }

        return result;
    };

    /**
     * Decode Quagmire III
     */
    decode = (message = this.message, indicatorKey = this.indicator) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(this.key, 'string');
        CipherValidator.validateKey(indicatorKey, 'string');

        const cleanMessage = message.toUpperCase();
        const cleanIndicator = indicatorKey.toUpperCase().replace(/[^A-Z]/g, '');

        if (!cleanIndicator.length) {
            throw new Error('Quagmire III cipher requires a non-empty indicator key');
        }

        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < cleanMessage.length; i++) {
            const ch = cleanMessage[i];

            if (/[A-Z]/.test(ch)) {
                const cIndex = this.indexInKeyed(ch);
                const kChar = cleanIndicator[keyIndex % cleanIndicator.length];
                const kIndex = this.indexInKeyed(kChar);

                if (cIndex === -1 || kIndex === -1) {
                    result += ch;
                } else {
                    const pIndex = (cIndex - kIndex + 26) % 26;
                    result += this.keyedAlphabet[pIndex];
                    keyIndex++;
                }
            } else {
                result += ch;
            }
        }

        return result;
    };
}