/**
 * Integration tests for cipher validation
 * Tests that ciphers properly validate inputs and throw appropriate errors
 */

const Nigma = require('../index.js');

describe('CaesarShift Input Validation', () => {
    test('should throw error for null message', () => {
        const caesar = new Nigma.Shift.CaesarShift('hello', 3);
        expect(() => caesar.encode(null))
            .toThrow('Message cannot be null or undefined');
    });

    test('should throw error for non-string message', () => {
        const caesar = new Nigma.Shift.CaesarShift('', 3);
        expect(() => caesar.encode(123))
            .toThrow('Message must be a string, got number');
    });

    test('should throw error for empty message', () => {
        const caesar = new Nigma.Shift.CaesarShift('', 3);
        expect(() => caesar.encode(''))
            .toThrow('Message cannot be empty');
    });

    test('should throw error for non-number key', () => {
        const caesar = new Nigma.Shift.CaesarShift('hello', 'abc');
        expect(() => caesar.encode())
            .toThrow('Key must be a number, got string');
    });

    test('should accept valid inputs', () => {
        const caesar = new Nigma.Shift.CaesarShift('hello', 3);
        expect(() => caesar.encode()).not.toThrow();
        expect(caesar.encode()).toBe('khoor');
    });
});

describe('Morse Input Validation', () => {
    test('should throw error for null message', () => {
        const morse = new Nigma.Dictionary.Morse('');
        expect(() => morse.encode(null))
            .toThrow('Message cannot be null or undefined');
    });

    test('should throw error for empty message', () => {
        const morse = new Nigma.Dictionary.Morse('');
        expect(() => morse.encode(''))
            .toThrow('Message cannot be empty');
    });

    test('should accept valid message', () => {
        const morse = new Nigma.Dictionary.Morse('hello');
        expect(() => morse.encode()).not.toThrow();
    });
});

describe('AMSCO Input Validation', () => {
    test('should throw error for empty message', () => {
        const amsco = new Nigma.Columnar.Amsco('', '1234');
        expect(() => amsco.encode())
            .toThrow('Message cannot be empty');
    });

    test('should throw error for invalid key format', () => {
        const amsco = new Nigma.Columnar.Amsco('hello world', '1245');
        expect(() => amsco.encode())
            .toThrow('Invalid key format for AMSCO cipher');
    });

    test('should accept valid inputs', () => {
        const amsco = new Nigma.Columnar.Amsco('hello world', '1234');
        expect(() => amsco.encode()).not.toThrow();
    });
});

describe('SimpleSubstitution Input Validation', () => {
    test('should throw error for null message', () => {
        const sub = new Nigma.Dictionary.SimpleSubstitution('', 'keyword');
        expect(() => sub.encode(null))
            .toThrow('Message cannot be null or undefined');
    });

    test('should accept valid message', () => {
        const sub = new Nigma.Dictionary.SimpleSubstitution('hello', 'keyword');
        expect(() => sub.encode()).not.toThrow();
    });
});

describe('Enigma Input Validation', () => {
    test('should throw error for empty message', () => {
        const enigma = new Nigma.Enigma('', '111', '111', '111', '');
        expect(() => enigma.encode())
            .toThrow('Message cannot be empty');
    });

    test('should accept valid message', () => {
        const enigma = new Nigma.Enigma('HELLO', '111', '111', '111', '');
        expect(() => enigma.encode()).not.toThrow();
    });
});

