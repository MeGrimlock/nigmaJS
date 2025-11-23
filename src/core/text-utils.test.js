import { TextUtils } from '../core/text-utils.js';

describe('TextUtils', () => {
    test('should normalize text correctly', () => {
        const input = "Él caminó por la calle 123";
        
        // Default: strip spaces, remove accents, uppercase, remove digits
        expect(TextUtils.normalize(input)).toBe("ELCAMINOPORLACALLE"); 

        // Keep digits
        expect(TextUtils.normalize(input, { keepDigits: true })).toBe("ELCAMINOPORLACALLE123");

        // Keep spaces (trailing space remains because 123 was removed but the space before it wasn't)
        expect(TextUtils.normalize(input, { stripSpaces: false })).toBe("EL CAMINO POR LA CALLE ");

        // Keep digits false (default is false, wait.. my implementation default was false for keepDigits?)
        // Let's check implementation. Default keepDigits=false.
        const inputWithDigits = "ABC 123";
        expect(TextUtils.normalize(inputWithDigits, { stripSpaces: true, keepDigits: false })).toBe("ABC");
        expect(TextUtils.normalize(inputWithDigits, { stripSpaces: true, keepDigits: true })).toBe("ABC123");
    });

    test('should handle onlyLetters', () => {
        const input = "¡Hola Mundo! 123";
        expect(TextUtils.onlyLetters(input)).toBe("HOLAMUNDO");
    });
});

