import { default as BasicCipher } from '../../basicCipher.js';
import { CipherValidator } from '../../utils/validation.js';

/**
 * Quagmire IV Cipher
 * 
 * The most complex Quagmire variant. Uses multiple keywords and indicators
 * to create a highly variable cipher alphabet that changes based on multiple factors.
 * Combines features from Quagmire I, II, and III.
 * 
 * Example:
 * Plaintext: HELLO
 * Keyword: KEY
 * Indicator: ABC
 * 
 * @param {String} message - Text to be encoded/decoded
 * @param {String} keyword - Keyword for encryption
 * @param {String} indicator - Indicator keyword for alphabet selection
 * @param {String} cipherAlphabet - Base cipher alphabet (optional)
 * @param {Boolean} encoded - Indicates if message is already encoded
 * @param {Boolean} debug - Enable debug messages
 */
export default class Quagmire4 extends BasicCipher {
    constructor(message, keyword = 'KEY', indicator = 'ABC', cipherAlphabet = '', encoded = false, debug = false) {
        super(message, encoded, 'quagmire4', keyword, '', debug);
        this.indicator = indicator || 'ABC';
        this.cipherAlphabet = cipherAlphabet || '';
        // Quagmire4: alfabeto keyed para plaintext (basado en keyword)
        this.keyedAlphabet = this.buildKeyedAlphabet(keyword);
        // Quagmire4: alfabeto keyed para ciphertext (puede ser custom o basado en keyword)
        this.cipherKeyedAlphabet = this.buildCipherKeyedAlphabet(keyword);
    }

    /**
     * Construye el alfabeto keyed para plaintext (K4: mismo que K3)
     * Ej: KEY -> KEYABCDFGHIJLMNOPQRSTUVWXZ
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

    /**
     * Construye el alfabeto keyed para ciphertext (K4: puede ser custom o basado en keyword)
     */
    buildCipherKeyedAlphabet(keyword) {
        // Si hay un cipherAlphabet personalizado, usarlo
        if (this.cipherAlphabet && this.cipherAlphabet.length === 26) {
            return this.cipherAlphabet.toUpperCase();
        }
        
        // Si no, usar el mismo que el keyedAlphabet (basado en keyword)
        return this.buildKeyedAlphabet(keyword);
    }

    /** índice de una letra dentro del alfabeto keyed (plaintext) */
    indexInKeyed(letter) {
        return this.keyedAlphabet.indexOf(letter.toUpperCase());
    }

    /** índice de una letra dentro del alfabeto keyed de ciphertext */
    indexInCipherKeyed(letter) {
        return this.cipherKeyedAlphabet.indexOf(letter.toUpperCase());
    }

    /**
     * Encode Quagmire IV (Keyed Vigenère con alfabetos diferentes para pt y ct)
     * keyword => define el alfabeto keyed para plaintext (this.keyedAlphabet)
     * indicator => key de tipo Vigenère
     * cipherAlphabet => define el alfabeto keyed para ciphertext (this.cipherKeyedAlphabet)
     */
    encode = (message = this.message, indicatorKey = this.indicator) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(this.key, 'string');
        CipherValidator.validateKey(indicatorKey, 'string');

        if (!this.key || this.key.length === 0) {
            throw new Error('Quagmire IV cipher requires a non-empty keyword');
        }

        const cleanMessage = message.toUpperCase();
        const cleanIndicator = indicatorKey.toUpperCase().replace(/[^A-Z]/g, '');

        if (!cleanIndicator.length) {
            throw new Error('Quagmire IV cipher requires a non-empty indicator key');
        }

        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < cleanMessage.length; i++) {
            const ch = cleanMessage[i];

            if (/[A-Z]/.test(ch)) {
                // Índice del carácter plaintext en el alfabeto keyed de plaintext
                const pIndex = this.indexInKeyed(ch);
                // Carácter del indicator key
                const kChar = cleanIndicator[keyIndex % cleanIndicator.length];
                // Índice del carácter del indicator en el alfabeto keyed de plaintext
                const kIndex = this.indexInKeyed(kChar);

                if (pIndex === -1 || kIndex === -1) {
                    result += ch;
                } else {
                    // Calcular índice en el alfabeto keyed de ciphertext
                    const cIndex = (pIndex + kIndex) % 26;
                    result += this.cipherKeyedAlphabet[cIndex];
                    keyIndex++;
                }
            } else {
                result += ch;
            }
        }

        return result;
    };

    /**
     * Decode Quagmire IV
     */
    decode = (message = this.message, indicatorKey = this.indicator) => {
        CipherValidator.validateMessage(message);
        CipherValidator.validateKey(this.key, 'string');
        CipherValidator.validateKey(indicatorKey, 'string');

        const cleanMessage = message.toUpperCase();
        const cleanIndicator = indicatorKey.toUpperCase().replace(/[^A-Z]/g, '');

        if (!cleanIndicator.length) {
            throw new Error('Quagmire IV cipher requires a non-empty indicator key');
        }

        let result = '';
        let keyIndex = 0;

        for (let i = 0; i < cleanMessage.length; i++) {
            const ch = cleanMessage[i];

            if (/[A-Z]/.test(ch)) {
                // Índice del carácter ciphertext en el alfabeto keyed de ciphertext
                const cIndex = this.indexInCipherKeyed(ch);
                // Carácter del indicator key
                const kChar = cleanIndicator[keyIndex % cleanIndicator.length];
                // Índice del carácter del indicator en el alfabeto keyed de plaintext
                const kIndex = this.indexInKeyed(kChar);

                if (cIndex === -1 || kIndex === -1) {
                    result += ch;
                } else {
                    // Calcular índice en el alfabeto keyed de plaintext
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

