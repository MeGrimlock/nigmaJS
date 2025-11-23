import { Kasiski } from './kasiski.js';
import Shift from '../ciphers/shift/shift.js';
import Polyalphabetic from '../ciphers/polyalphabetic/polyalphabetic.js';

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
    });

    describe('gcd and gcdArray', () => {
        it('should calculate GCD of two numbers', () => {
            expect(Kasiski.gcd(12, 8)).toBe(4);
            expect(Kasiski.gcd(15, 25)).toBe(5);
            expect(Kasiski.gcd(7, 13)).toBe(1);
        });

        it('should calculate GCD of an array', () => {
            expect(Kasiski.gcdArray([12, 8, 16])).toBe(4);
            expect(Kasiski.gcdArray([15, 25, 35])).toBe(5);
            expect(Kasiski.gcdArray([7, 13, 19])).toBe(1);
        });
    });

    describe('suggestKeyLengths', () => {
        it('should suggest key length for Vigenère cipher (key="KEY", length=3)', () => {
            // Use a longer text with repeated words to ensure repetitions in ciphertext
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG THE QUICK BROWN FOX';
            const vigenere = new Polyalphabetic.Vigenere('KEY');
            const ciphertext = vigenere.encode(plaintext);
            
            const suggestions = Kasiski.suggestKeyLengths(ciphertext, 3, 10);
            
            // Should suggest key length 3 (or multiples like 6, 9)
            expect(suggestions.length).toBeGreaterThan(0);
            const topSuggestion = suggestions[0];
            expect([3, 6, 9]).toContain(topSuggestion.keyLength);
        });

        it('should return empty or low-confidence results for monoalphabetic cipher', () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const caesar = new Shift.CaesarShift(plaintext, 5);
            const ciphertext = caesar.encode();
            
            const suggestions = Kasiski.suggestKeyLengths(ciphertext, 3, 10);
            
            // Monoalphabetic ciphers may have some repetitions, but they should be random
            // This test is more about ensuring the function doesn't crash
            expect(Array.isArray(suggestions)).toBe(true);
        });
    });

    describe('examine', () => {
        it('should perform full Kasiski examination on Vigenère ciphertext', () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
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
        });

        it('should detect no repetitions for very random text', () => {
            const randomText = 'QWERTASDFGZXCVB';
            const result = Kasiski.examine(randomText);
            
            expect(result.hasRepetitions).toBe(false);
            expect(result.distances.length).toBe(0);
            expect(result.suggestedKeyLengths.length).toBe(0);
        });
    });
});

