/**
 * Unit tests for CipherValidator utility
 * Tests all validation methods with valid and invalid inputs
 */

const { CipherValidator } = require('./validation.js');

describe('CipherValidator.validateMessage', () => {
    test('should accept valid string message', () => {
        expect(() => CipherValidator.validateMessage('hello')).not.toThrow();
        expect(CipherValidator.validateMessage('hello')).toBe(true);
    });

    test('should accept message with spaces', () => {
        expect(() => CipherValidator.validateMessage('hello world')).not.toThrow();
    });

    test('should accept message with special characters', () => {
        expect(() => CipherValidator.validateMessage('hello! @#$%')).not.toThrow();
    });

    test('should reject null message', () => {
        expect(() => CipherValidator.validateMessage(null))
            .toThrow('Message cannot be null or undefined');
    });

    test('should reject undefined message', () => {
        expect(() => CipherValidator.validateMessage(undefined))
            .toThrow('Message cannot be null or undefined');
    });

    test('should reject non-string message (number)', () => {
        expect(() => CipherValidator.validateMessage(123))
            .toThrow('Message must be a string, got number');
    });

    test('should reject non-string message (object)', () => {
        expect(() => CipherValidator.validateMessage({}))
            .toThrow('Message must be a string, got object');
    });

    test('should reject non-string message (array)', () => {
        expect(() => CipherValidator.validateMessage([]))
            .toThrow('Message must be a string, got object');
    });

    test('should reject empty string', () => {
        expect(() => CipherValidator.validateMessage(''))
            .toThrow('Message cannot be empty');
    });

    test('should reject whitespace-only string', () => {
        expect(() => CipherValidator.validateMessage('   '))
            .toThrow('Message cannot be empty');
    });
});

describe('CipherValidator.validateKey', () => {
    test('should accept number when type is number', () => {
        expect(() => CipherValidator.validateKey(13, 'number')).not.toThrow();
        expect(CipherValidator.validateKey(13, 'number')).toBe(true);
    });

    test('should accept negative number', () => {
        expect(() => CipherValidator.validateKey(-5, 'number')).not.toThrow();
    });

    test('should accept zero', () => {
        expect(() => CipherValidator.validateKey(0, 'number')).not.toThrow();
    });

    test('should accept string when type is string', () => {
        expect(() => CipherValidator.validateKey('abc', 'string')).not.toThrow();
        expect(CipherValidator.validateKey('abc', 'string')).toBe(true);
    });

    test('should accept any type when type is any', () => {
        expect(() => CipherValidator.validateKey('abc', 'any')).not.toThrow();
        expect(() => CipherValidator.validateKey(123, 'any')).not.toThrow();
        expect(() => CipherValidator.validateKey({}, 'any')).not.toThrow();
    });

    test('should reject null key', () => {
        expect(() => CipherValidator.validateKey(null))
            .toThrow('Key cannot be null or undefined');
    });

    test('should reject undefined key', () => {
        expect(() => CipherValidator.validateKey(undefined))
            .toThrow('Key cannot be null or undefined');
    });

    test('should reject string when type is number', () => {
        expect(() => CipherValidator.validateKey('abc', 'number'))
            .toThrow('Key must be a number, got string');
    });

    test('should reject number when type is string', () => {
        expect(() => CipherValidator.validateKey(123, 'string'))
            .toThrow('Key must be a string, got number');
    });

    test('should reject NaN', () => {
        expect(() => CipherValidator.validateKey(NaN, 'number'))
            .toThrow('Key must be a valid number, got NaN');
    });
});

describe('CipherValidator.validateAlphabet', () => {
    test('should accept valid alphabet object', () => {
        const alphabet = { a: 'z', b: 'y' };
        expect(() => CipherValidator.validateAlphabet(alphabet)).not.toThrow();
        expect(CipherValidator.validateAlphabet(alphabet)).toBe(true);
    });

    test('should accept empty object', () => {
        expect(() => CipherValidator.validateAlphabet({})).not.toThrow();
    });

    test('should reject null alphabet', () => {
        expect(() => CipherValidator.validateAlphabet(null))
            .toThrow('Alphabet cannot be null or undefined');
    });

    test('should reject undefined alphabet', () => {
        expect(() => CipherValidator.validateAlphabet(undefined))
            .toThrow('Alphabet cannot be null or undefined');
    });

    test('should reject non-object alphabet (string)', () => {
        expect(() => CipherValidator.validateAlphabet('abc'))
            .toThrow('Alphabet must be an object, got string');
    });

    test('should reject non-object alphabet (number)', () => {
        expect(() => CipherValidator.validateAlphabet(123))
            .toThrow('Alphabet must be an object, got number');
    });

    test('should reject array', () => {
        expect(() => CipherValidator.validateAlphabet([]))
            .toThrow('Alphabet must be an object, not an array');
    });
});

describe('CipherValidator.validateBoolean', () => {
    test('should accept true', () => {
        expect(() => CipherValidator.validateBoolean(true)).not.toThrow();
        expect(CipherValidator.validateBoolean(true)).toBe(true);
    });

    test('should accept false', () => {
        expect(() => CipherValidator.validateBoolean(false)).not.toThrow();
    });

    test('should reject non-boolean (number)', () => {
        expect(() => CipherValidator.validateBoolean(1))
            .toThrow('value must be a boolean, got number');
    });

    test('should reject non-boolean (string)', () => {
        expect(() => CipherValidator.validateBoolean('true'))
            .toThrow('value must be a boolean, got string');
    });

    test('should use custom parameter name in error', () => {
        expect(() => CipherValidator.validateBoolean(1, 'encoded'))
            .toThrow('encoded must be a boolean, got number');
    });
});
