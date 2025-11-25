import { CipherIdentifier } from './identifier.js';
import Shift from '../ciphers/shift/shift.js';
import Polyalphabetic from '../ciphers/polyalphabetic/polyalphabetic.js';
import Columnar from '../ciphers/columnar/columnar.js';

describe('Cipher Identifier', () => {
    describe('Caesar Shift Detection', () => {
        it('should detect Caesar shift cipher', async () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND RUNS AWAY INTO THE FOREST WHERE THE ANIMALS LIVE IN PEACE AND HARMONY WITH NATURE AND ALL THE CREATURES OF THE WILD';
            const caesar = new Shift.CaesarShift(plaintext, 7);
            const ciphertext = caesar.encode();

            const result = await CipherIdentifier.identify(ciphertext);

            expect(result.families).toBeDefined();
            expect(result.families.length).toBeGreaterThan(0);

            // Should detect 'caesar-shift' or 'monoalphabetic-substitution' among top candidates
            const topTypes = result.families.map(f => f.type);
            const hasMonoOrCaesar = topTypes.includes('caesar-shift') || topTypes.includes('monoalphabetic-substitution');
            expect(hasMonoOrCaesar).toBe(true);
            
            // At least one candidate should have reasonable confidence
            expect(result.families[0].confidence).toBeGreaterThan(0.3);

            // IC should be reasonably high (> 1.3 for longer texts)
            expect(result.stats.ic).toBeGreaterThan(1.3);
        });

        it('should detect monoalphabetic substitution (using Caesar as proxy)', async () => {
            // Since MonoalphabeticSubstitution doesn't exist as a separate class,
            // we'll use Caesar shift as a proxy for monoalphabetic substitution
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND RUNS AWAY INTO THE FOREST WHERE THE ANIMALS LIVE IN PEACE AND HARMONY WITH NATURE AND ALL THE CREATURES OF THE WILD';
            const caesar = new Shift.CaesarShift(plaintext, 13);
            const ciphertext = caesar.encode();

            const result = await CipherIdentifier.identify(ciphertext);

            const topTypes = result.families.map(f => f.type);
            const hasMonoOrCaesar = topTypes.includes('caesar-shift') || topTypes.includes('monoalphabetic-substitution');
            expect(hasMonoOrCaesar).toBe(true);
            expect(result.families[0].confidence).toBeGreaterThan(0.3);
        });
    });

    describe('Vigenère Detection', () => {
        it('should detect Vigenère cipher with short key', async () => {
            // Use repeated plaintext to ensure Kasiski can find repetitions
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG THE QUICK BROWN FOX';
            const vigenere = new Polyalphabetic.Vigenere('KEY');
            const ciphertext = vigenere.encode(plaintext);

            const result = await CipherIdentifier.identify(ciphertext);

            // Should detect 'vigenere-like' as a top candidate
            const vigenereFamily = result.families.find(f => f.type === 'vigenere-like');
            expect(vigenereFamily).toBeDefined();
            expect(vigenereFamily.confidence).toBeGreaterThan(0.4);

            // Should suggest key length around 3 (or multiples like 6, 9)
            // Note: Kasiski may suggest multiples of the actual key length
            if (vigenereFamily.suggestedKeyLength) {
                expect(vigenereFamily.suggestedKeyLength % 3).toBe(0); // Should be divisible by 3
            }

            // IC should be lower than monoalphabetic (< 1.6)
            expect(result.stats.ic).toBeLessThan(1.6);
        });

        it('should detect Vigenère cipher with longer key', async () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND RUNS AWAY INTO THE FOREST AND THEN COMES BACK TO THE VILLAGE WHERE EVERYONE IS WAITING';
            const vigenere = new Polyalphabetic.Vigenere('CRYPTO');
            const ciphertext = vigenere.encode(plaintext);

            const result = await CipherIdentifier.identify(ciphertext);

            const vigenereFamily = result.families.find(f => f.type === 'vigenere-like');
            expect(vigenereFamily).toBeDefined();
            expect(vigenereFamily.confidence).toBeGreaterThan(0.3);
        });
    });

    describe('Transposition Detection', () => {
        it('should detect transposition cipher (using Route as example)', async () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND RUNS AWAY INTO THE FOREST';
            const route = new Columnar.Route(plaintext, 5, 15, 'spiral');
            const ciphertext = route.encode();

            const result = await CipherIdentifier.identify(ciphertext);

            // Transposition preserves letter frequency, so IC should be high
            expect(result.stats.ic).toBeGreaterThan(1.4);

            // Should detect 'transposition' or 'monoalphabetic-substitution' (they have similar IC)
            const topTypes = result.families.map(f => f.type);
            const hasTranspositionOrMono = topTypes.includes('transposition') || topTypes.includes('monoalphabetic-substitution');
            expect(hasTranspositionOrMono).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle very short texts', async () => {
            const shortText = 'HELLO';
            const result = await CipherIdentifier.identify(shortText);

            expect(result.families[0].type).toBe('unknown');
            expect(result.families[0].reason).toContain('too short');
        });

        it('should handle random text', async () => {
            const randomText = 'QXZWPLKMJNHBGVFCDRTSEAYUIO';
            const result = await CipherIdentifier.identify(randomText);

            // Random text should have low IC and be classified as 'random-unknown' or similar
            expect(result.stats.ic).toBeLessThan(1.5);
            
            // Should include 'random-unknown' or 'vigenere-like' as possibilities
            const types = result.families.map(f => f.type);
            const hasRandomOrVigenere = types.includes('random-unknown') || types.includes('vigenere-like');
            expect(hasRandomOrVigenere).toBe(true);
        });
    });

    describe('getDescription', () => {
        it('should return descriptions for all cipher types', () => {
            const types = [
                'monoalphabetic-substitution',
                'caesar-shift',
                'vigenere-like',
                'transposition',
                'random-unknown',
                'unknown'
            ];

            types.forEach(type => {
                const description = CipherIdentifier.getDescription(type);
                expect(description).toBeDefined();
                expect(typeof description).toBe('string');
                expect(description.length).toBeGreaterThan(10);
            });
        });
    });
});

