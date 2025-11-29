import { Kasiski } from '../kasiski.js';
import Shift from '../../ciphers/shift/shift.js';
import Polyalphabetic from '../../ciphers/polyalphabetic/polyalphabetic.js';

describe('Kasiski Examination', () => {
    describe('findRepeatedNGrams', () => {
        it('should find repeated trigrams in a simple text', () => {
            const text = 'ABCABCABC';
            const repeated = Kasiski.findRepeatedNGrams(text, 3);
            
            expect(repeated['ABC']).toBeDefined();
            expect(repeated['ABC'].length).toBe(3); // ABC appears at positions 0, 3, 6
            expect(repeated['ABC']).toEqual([0, 3, 6]);
        });

        it('should return empty object if no repetitions', () => {
            const text = 'ABCDEFGHIJK';
            const repeated = Kasiski.findRepeatedNGrams(text, 3);
            
            expect(Object.keys(repeated).length).toBe(0);
        });

        it('should handle very short texts', () => {
            const text = 'AB';
            const repeated = Kasiski.findRepeatedNGrams(text, 3);
            
            expect(Object.keys(repeated).length).toBe(0);
        });

        it('should ignore spaces, punctuation and case when finding repeated n-grams', () => {
            const text = 'abC abC!!abC'; // limpiado → ABCABCABC
            const repeated = Kasiski.findRepeatedNGrams(text, 3);

            expect(repeated['ABC']).toBeDefined();
            expect(repeated['ABC']).toEqual([0, 3, 6]);
        });

        it('should respect custom ngramLength (bigrams)', () => {
            const text = 'ABABAB';
            const repeated = Kasiski.findRepeatedNGrams(text, 2);

            // Limpio: ABABAB → bigramas: AB, BA, AB, BA, AB
            expect(repeated['AB']).toBeDefined();
            expect(repeated['AB']).toEqual([0, 2, 4]);
            expect(repeated['BA']).toBeDefined();
            expect(repeated['BA']).toEqual([1, 3]);
        });

        it('should return empty object when text is undefined or empty', () => {
            expect(Kasiski.findRepeatedNGrams(undefined, 3)).toEqual({});
            expect(Kasiski.findRepeatedNGrams('', 3)).toEqual({});
        });
    });

    describe('calculateDistances', () => {
        it('should calculate distances between repeated n-grams', () => {
            const repeated = {
                'ABC': [0, 3, 6],
                'XYZ': [10, 15]
            };
            const distances = Kasiski.calculateDistances(repeated);
            
            // ABC: 3-0=3, 6-0=6, 6-3=3
            // XYZ: 15-10=5
            expect(distances).toContain(3);
            expect(distances).toContain(6);
            expect(distances).toContain(5);
            expect(distances.length).toBe(4); // 3 from ABC, 1 from XYZ
        });

        it('should return empty array for null/undefined input', () => {
            expect(Kasiski.calculateDistances(null)).toEqual([]);
            expect(Kasiski.calculateDistances(undefined)).toEqual([]);
        });

        it('should ignore n-grams that only occur once', () => {
            const repeated = {
                'ABC': [0, 4],
                'DEF': [10],    // no debería generar distancias
                'GHI': [20, 30]
            };
            const distances = Kasiski.calculateDistances(repeated);

            // ABC: 4-0=4
            // GHI: 30-20=10
            expect(distances).toContain(4);
            expect(distances).toContain(10);
            expect(distances.length).toBe(2);
        });

        it('should only include strictly positive distances', () => {
            const repeated = {
                'AAA': [5, 5, 7] // valor duplicado intencionalmente
            };
            const distances = Kasiski.calculateDistances(repeated);

            // posiciones: 5, 5, 7
            // distancias válidas deberían ser solo 2 (7-5), 2 (7-5)
            expect(distances.every(d => d > 0)).toBe(true);
        });
    });

    describe('gcd and gcdArray', () => {
        it('should calculate GCD of two positive numbers', () => {
            expect(Kasiski.gcd(12, 8)).toBe(4);
            expect(Kasiski.gcd(15, 25)).toBe(5);
            expect(Kasiski.gcd(7, 13)).toBe(1);
        });

        it('should calculate GCD with zeros and negatives', () => {
            expect(Kasiski.gcd(0, 0)).toBe(0);
            expect(Kasiski.gcd(0, 10)).toBe(10);
            expect(Kasiski.gcd(10, 0)).toBe(10);
            expect(Kasiski.gcd(-12, 8)).toBe(4);
            expect(Kasiski.gcd(-12, -8)).toBe(4);
        });

        it('should calculate GCD of an array', () => {
            expect(Kasiski.gcdArray([12, 8, 16])).toBe(4);
            expect(Kasiski.gcdArray([15, 25, 35])).toBe(5);
            expect(Kasiski.gcdArray([7, 13, 19])).toBe(1);
        });

        it('should handle GCD array edge cases (empty, zeros, negatives, single element)', () => {
            expect(Kasiski.gcdArray([])).toBe(0);
            expect(Kasiski.gcdArray([0, 0])).toBe(0);
            expect(Kasiski.gcdArray([0, 18, 24])).toBe(6);
            expect(Kasiski.gcdArray([-12, -8])).toBe(4);
            expect(Kasiski.gcdArray([5])).toBe(5);
        });
    });

    describe('suggestKeyLengths', () => {
        it('should suggest key length for Vigenère cipher (key="KEY", length=3)', () => {
            // Use a longer text with repeated words to ensure repetitions in ciphertext
            const plaintext =
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG ' +
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG ' +
                'THE QUICK BROWN FOX';
            const vigenere = new Polyalphabetic.Vigenere('KEY');
            const ciphertext = vigenere.encode(plaintext);
            
            const suggestions = Kasiski.suggestKeyLengths(ciphertext, 3, 10);
            
            // Should suggest key length 3 (or multiples like 6, 9)
            expect(suggestions.length).toBeGreaterThan(0);
            const topSuggestion = suggestions[0];
            expect([3, 6, 9]).toContain(topSuggestion.keyLength);
            // Compatibilidad: alias .length debe coincidir con .keyLength
            expect(topSuggestion.length).toBe(topSuggestion.keyLength);
        });

        it('should not suggest any key length for text too short for repetitions', () => {
            const text = 'ABCDEF'; // < 2 * ngramLength
            const suggestions = Kasiski.suggestKeyLengths(text, 3, 10);

            expect(Array.isArray(suggestions)).toBe(true);
            expect(suggestions.length).toBe(0);
        });

        it('should respect maxKeyLength and never return keyLength < 2', () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG ' +
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const vigenere = new Polyalphabetic.Vigenere('SECRET');
            const ciphertext = vigenere.encode(plaintext);

            const maxKeyLength = 5;
            const suggestions = Kasiski.suggestKeyLengths(ciphertext, 3, maxKeyLength);

            for (const s of suggestions) {
                expect(s.keyLength).toBeGreaterThanOrEqual(2);
                expect(s.keyLength).toBeLessThanOrEqual(maxKeyLength);
                expect(s.length).toBe(s.keyLength);
            }
        });

        it('should bias towards smaller true key length for synthetic periodic ciphertext', () => {
            // Construimos un texto con periodo 3 claro: ABC repetido
            const text = 'ABCABCABCABC'; // distancias siempre múltiplos de 3
            const suggestions = Kasiski.suggestKeyLengths(text, 3, 10);

            expect(suggestions.length).toBeGreaterThan(0);
            const top = suggestions[0];
            // Para este patrón, keyLength=3 debería ser el mejor (6 también divide algunas distancias,
            // pero con menos conteos).
            expect(top.keyLength).toBe(3);
        });

        it('should return empty or low-confidence results for monoalphabetic cipher', () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const caesar = new Shift.CaesarShift(plaintext, 5);
            const ciphertext = caesar.encode();
            
            const suggestions = Kasiski.suggestKeyLengths(ciphertext, 3, 10);
            
            // Monoalphabetic ciphers may have some repetitions, but they should be random.
            // Este test es más para asegurar que la función no revienta y devuelve un array válido.
            expect(Array.isArray(suggestions)).toBe(true);
        });
    });

    describe('examine', () => {
        it('should perform full Kasiski examination on Vigenère ciphertext', () => {
            const plaintext =
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG ' +
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const vigenere = new Polyalphabetic.Vigenere('KEY');
            const ciphertext = vigenere.encode(plaintext);
            
            const result = Kasiski.examine(ciphertext);
            
            expect(result.repeatedNGrams).toBeDefined();
            expect(result.distances).toBeDefined();
            expect(result.suggestedKeyLengths).toBeDefined();
            expect(result.hasRepetitions).toBeDefined();
            
            // For a Vigenère cipher with repeated plaintext, we expect repetitions
            expect(Array.isArray(result.distances)).toBe(true);
            expect(Array.isArray(result.suggestedKeyLengths)).toBe(true);
            expect(result.distances.length).toBeGreaterThan(0);
        });

        it('should ignore spaces and punctuation when examining ciphertext', () => {
            const plaintext =
                'ATTACK AT DAWN! ATTACK AT DAWN! ATTACK AT DAWN!';
            const vigenere = new Polyalphabetic.Vigenere('DOG');
            const ciphertext = vigenere.encode(plaintext);

            const noisyCiphertext = `  ${ciphertext}  !!!  `; // ruido extra

            const result = Kasiski.examine(noisyCiphertext);

            expect(result.hasRepetitions).toBe(true);
            expect(result.distances.length).toBeGreaterThan(0);
            expect(result.suggestedKeyLengths.length).toBeGreaterThan(0);
        });

        it('should detect no repetitions for very random text', () => {
            const randomText = 'QWERTASDFGZXCVB';
            const result = Kasiski.examine(randomText);
            
            expect(result.hasRepetitions).toBe(false);
            expect(result.distances.length).toBe(0);
            expect(result.suggestedKeyLengths.length).toBe(0);
        });

        it('should handle empty and undefined input without crashing', () => {
            const resultEmpty = Kasiski.examine('');
            const resultUndefined = Kasiski.examine(undefined);

            for (const result of [resultEmpty, resultUndefined]) {
                expect(result.hasRepetitions).toBe(false);
                expect(Array.isArray(result.distances)).toBe(true);
                expect(Array.isArray(result.suggestedKeyLengths)).toBe(true);
                expect(result.distances.length).toBe(0);
                expect(result.suggestedKeyLengths.length).toBe(0);
            }
        });
    });
});
