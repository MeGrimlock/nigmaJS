/**
 * CipherValidator
 * Centralized validation utility for NigmaJS cipher operations.
 * Provides static methods to validate inputs and prevent runtime errors.
 * 
 * @since 2.3.0
 */

export class CipherValidator {
    /**
     * Validates message input for cipher operations
     * 
     * @method validateMessage
     * @param {String} message - The message to validate
     * @throws {TypeError} If message is null, undefined, or not a string
     * @throws {Error} If message is empty or whitespace only
     * @returns {Boolean} Returns true if validation passes
     * 
     * @example
     * CipherValidator.validateMessage('Hello World'); // true
     * CipherValidator.validateMessage(null); // throws TypeError
     * CipherValidator.validateMessage(''); // throws Error
     */
    static validateMessage(message) {
        if (message == null) {
            throw new TypeError('Message cannot be null or undefined');
        }

        if (typeof message !== 'string') {
            throw new TypeError(`Message must be a string, got ${typeof message}`);
        }

        if (message.trim() === '') {
            throw new Error('Message cannot be empty');
        }

        return true;
    }

    /**
     * Validates key input based on expected type
     * 
     * @method validateKey
     * @param {*} key - The key to validate
     * @param {String} expectedType - Expected type: 'number', 'string', or 'any'
     * @throws {TypeError} If key is null, undefined, or wrong type
     * @returns {Boolean} Returns true if validation passes
     * 
     * @example
     * CipherValidator.validateKey(13, 'number'); // true
     * CipherValidator.validateKey('abc', 'string'); // true
     * CipherValidator.validateKey('abc', 'number'); // throws TypeError
     */
    static validateKey(key, expectedType = 'any') {
        if (key == null) {
            throw new TypeError('Key cannot be null or undefined');
        }

        if (expectedType === 'number' && typeof key !== 'number') {
            throw new TypeError(`Key must be a number, got ${typeof key}`);
        }

        if (expectedType === 'string' && typeof key !== 'string') {
            throw new TypeError(`Key must be a string, got ${typeof key}`);
        }

        if (expectedType === 'number' && isNaN(key)) {
            throw new TypeError('Key must be a valid number, got NaN');
        }

        return true;
    }

    /**
     * Validates alphabet object for substitution ciphers
     * 
     * @method validateAlphabet
     * @param {Object} alphabet - The alphabet object to validate
     * @throws {TypeError} If alphabet is null, undefined, or not an object
     * @returns {Boolean} Returns true if validation passes
     * 
     * @example
     * CipherValidator.validateAlphabet({a: 'z', b: 'y'}); // true
     * CipherValidator.validateAlphabet(null); // throws TypeError
     */
    static validateAlphabet(alphabet) {
        if (alphabet == null) {
            throw new TypeError('Alphabet cannot be null or undefined');
        }

        if (typeof alphabet !== 'object') {
            throw new TypeError(`Alphabet must be an object, got ${typeof alphabet}`);
        }

        if (Array.isArray(alphabet)) {
            throw new TypeError('Alphabet must be an object, not an array');
        }

        return true;
    }

    /**
     * Validates boolean input
     * 
     * @method validateBoolean
     * @param {Boolean} value - The boolean value to validate
     * @param {String} paramName - Name of the parameter for error messages
     * @throws {TypeError} If value is not a boolean
     * @returns {Boolean} Returns true if validation passes
     */
    static validateBoolean(value, paramName = 'value') {
        if (typeof value !== 'boolean') {
            throw new TypeError(`${paramName} must be a boolean, got ${typeof value}`);
        }

        return true;
    }
}

export default CipherValidator;
