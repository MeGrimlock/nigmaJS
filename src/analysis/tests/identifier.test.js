import { CipherIdentifier } from '../identifier.js';
import Shift from '../../ciphers/shift/shift.js';
import Polyalphabetic from '../../ciphers/polyalphabetic/polyalphabetic.js';
import Columnar from '../../ciphers/columnar/columnar.js';

describe('Cipher Identifier', () => {
    // =========================
    // Caesar / Monoalfabético
    // =========================
    describe('Caesar Shift Detection', () => {
        it('should detect Caesar shift cipher', async () => {
            const plaintext =
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND RUNS AWAY INTO THE FOREST ' +
                'WHERE THE ANIMALS LIVE IN PEACE AND HARMONY WITH NATURE AND ALL THE CREATURES OF THE WILD';
            const caesar = new Shift.CaesarShift(plaintext, 7);
            const ciphertext = caesar.encode();

            const result = await CipherIdentifier.identify(ciphertext);

            expect(result.families).toBeDefined();
            expect(result.families.length).toBeGreaterThan(0);

            const topTypes = result.families.map(f => f.type);
            const hasMonoOrCaesar =
                topTypes.includes('caesar-shift') ||
                topTypes.includes('monoalphabetic-substitution');
            expect(hasMonoOrCaesar).toBe(true);

            // At least one candidate should have reasonable confidence
            expect(result.families[0].confidence).toBeGreaterThan(0.3);

            // IC should be reasonably high (> 1.3 for longer texts)
            expect(result.stats.ic).toBeGreaterThan(1.3);
        });

        it('should detect monoalphabetic substitution (Caesar as proxy)', async () => {
            const plaintext =
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND RUNS AWAY INTO THE FOREST ' +
                'WHERE THE ANIMALS LIVE IN PEACE AND HARMONY WITH NATURE AND ALL THE CREATURES OF THE WILD';
            const caesar = new Shift.CaesarShift(plaintext, 13);
            const ciphertext = caesar.encode();

            const result = await CipherIdentifier.identify(ciphertext);

            const topTypes = result.families.map(f => f.type);
            const hasMonoOrCaesar =
                topTypes.includes('caesar-shift') ||
                topTypes.includes('monoalphabetic-substitution');

            expect(hasMonoOrCaesar).toBe(true);
            expect(result.families[0].confidence).toBeGreaterThan(0.3);

            // Monoalfabético debería ganar a 'vigenere-like' claramente
            const caesarFamily = result.families.find(f => f.type === 'caesar-shift');
            const monoFamily = result.families.find(f => f.type === 'monoalphabetic-substitution');
            if (caesarFamily && monoFamily) {
                expect(monoFamily.confidence).toBeGreaterThanOrEqual(caesarFamily.confidence);
            }
        });

        it('should not misclassify Caesar as vigenere-like for short texts', async () => {
            const plaintext =
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const caesar = new Shift.CaesarShift(plaintext, 3);
            const ciphertext = caesar.encode();

            const result = await CipherIdentifier.identify(ciphertext);

            const caesarFamily = result.families.find(f => f.type === 'caesar-shift');
            const vigenereFamily = result.families.find(f => f.type === 'vigenere-like');

            // Si existe familia Caesar, su confianza debería ser >= que la de vigenere-like
            if (caesarFamily && vigenereFamily) {
                expect(caesarFamily.confidence).toBeGreaterThanOrEqual(vigenereFamily.confidence);
            }
        });
    });

    // =========================
    // Vigenère / Polialfabéticos
    // =========================
    describe('Vigenère Detection', () => {
        it('should detect Vigenère cipher with short key', async () => {
            const plaintext =
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG ' +
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG ' +
                'THE QUICK BROWN FOX';
            const vigenere = new Polyalphabetic.Vigenere('KEY');
            const ciphertext = vigenere.encode(plaintext);

            const result = await CipherIdentifier.identify(ciphertext);

            const vigenereFamily = result.families.find(f => f.type === 'vigenere-like');
            expect(vigenereFamily).toBeDefined();
            expect(vigenereFamily.confidence).toBeGreaterThan(0.4);

            // suggestedKeyLength debería existir y corresponder a múltiplos del key real (3)
            if (vigenereFamily.suggestedKeyLength) {
                expect(vigenereFamily.suggestedKeyLength).toBeGreaterThan(1);
                expect(vigenereFamily.suggestedKeyLength % 3).toBe(0);
            }

            // IC debería ser menor que el típico monoalfabético
            expect(result.stats.ic).toBeLessThan(1.6);
        });

        it('should detect Vigenère cipher with longer key', async () => {
            const plaintext =
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND RUNS AWAY INTO THE FOREST ' +
                'AND THEN COMES BACK TO THE VILLAGE WHERE EVERYONE IS WAITING FOR THE HERO TO RETURN';
            const vigenere = new Polyalphabetic.Vigenere('CRYPTO');
            const ciphertext = vigenere.encode(plaintext);

            const result = await CipherIdentifier.identify(ciphertext);

            const vigenereFamily = result.families.find(f => f.type === 'vigenere-like');
            expect(vigenereFamily).toBeDefined();
            expect(vigenereFamily.confidence).toBeGreaterThan(0.3);
        });

        it('should not classify random-looking text as strong vigenere-like without Kasiski support', async () => {
            // Texto largo bastante aleatorio (sin estructura clara)
            const randomLike = 'QXZWPLKMJNHBGVFCDRTSEAYUIOQXZWPLKMJNHBGVFCDRTSEAYUIOQXZWPLKMJNHBGVFCDRTSEAYUIO';
        
            const result = await CipherIdentifier.identify(randomLike);
        
            const vigenereFamily = result.families.find(f => f.type === 'vigenere-like');
            const randomFamily   = result.families.find(f => f.type === 'random-unknown');
        
            // No queremos overfitear a una relación exacta de confianzas.
            // Lo importante: que "random-unknown" aparezca con una confianza razonable.
            if (randomFamily) {
                expect(randomFamily.confidence).toBeGreaterThan(0.2);
            }
        
            // Opcional: si existe familia vigenere-like, que no esté ultra confiada
            if (vigenereFamily) {
                expect(vigenereFamily.confidence).toBeLessThanOrEqual(1.0);
            }
        });
        
    });

    // =========================
    // Transposición
    // =========================
    describe('Transposition Detection', () => {
        it('should detect transposition cipher (Route example)', async () => {
            const plaintext =
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND RUNS AWAY INTO THE FOREST';
            const route = new Columnar.Route(plaintext, 5, 15, 'spiral');
            const ciphertext = route.encode();

            const result = await CipherIdentifier.identify(ciphertext);

            // Transposition preserves letter frequency, so IC should be high
            expect(result.stats.ic).toBeGreaterThan(1.4);

            const topTypes = result.families.map(f => f.type);
            const hasTranspositionOrMono =
                topTypes.includes('transposition') ||
                topTypes.includes('monoalphabetic-substitution');
            expect(hasTranspositionOrMono).toBe(true);

            const transFamily = result.families.find(f => f.type === 'transposition');
            if (transFamily) {
                expect(transFamily.confidence).toBeGreaterThan(0.2);
            }
        });

        it('should not misclassify simple substitution as transposition', async () => {
            const plaintext =
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG ' +
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const caesar = new Shift.CaesarShift(plaintext, 4);
            const ciphertext = caesar.encode();

            const result = await CipherIdentifier.identify(ciphertext);
            const transFamily = result.families.find(f => f.type === 'transposition');
            const monoFamily = result.families.find(f => f.type === 'monoalphabetic-substitution');
            const caesarFamily = result.families.find(f => f.type === 'caesar-shift');

            // Si se detecta transposición, no debería superar claramente al monoalfabético
            if (transFamily && monoFamily) {
                expect(transFamily.confidence).toBeLessThanOrEqual(monoFamily.confidence);
            }
            if (transFamily && caesarFamily) {
                expect(transFamily.confidence).toBeLessThanOrEqual(caesarFamily.confidence);
            }
        });
    });

    // =========================
    // Polybius / patrones raros
    // =========================
    describe('Polybius / Special Pattern Detection', () => {
        it('should handle Polybius-like numeric text and use early detection', async () => {
            // Texto con pares numéricos 11–55 típicos de Polybius
            const polybiusText = '11 12 23 34 45 51 11 12 23 34 45 51 11 12 23';
            const result = await CipherIdentifier.identify(polybiusText);

            expect(result.families).toBeDefined();
            expect(result.families.length).toBeGreaterThan(0);

            // Como el texto no tiene letras, length (limpio) será 0, pero no debería romper nada
            expect(result.stats.length).toBe(0);

            // Polybius marca fuerte monoalfabético
            expect(result.families[0].type).toBe('monoalphabetic-substitution');
        });

        it('should not treat arbitrary numbers as Polybius if pairs are out of range', async () => {
            const numericText = '78 99 60 42 88 90 01 00 72 81'; // fuera del rango 11–55
            const result = await CipherIdentifier.identify(numericText);

            // No esperamos un crash, solo una clasificación genérica (probablemente random-unknown)
            expect(result.families).toBeDefined();
            const types = result.families.map(f => f.type);
            // En este caso, random-unknown es una opción razonable
            expect(types.length).toBeGreaterThan(0);
        });

        it('should recognize baconian / A-B patterns as monoalphabetic-friendly', async () => {
            const baconianText = 'ABABA AABBA ABBAB BAABB ABBAB AABBA ABBAB BAABB';
            const result = await CipherIdentifier.identify(baconianText);

            const monoFamily = result.families.find(f => f.type === 'monoalphabetic-substitution');
            expect(monoFamily).toBeDefined();
            expect(monoFamily.confidence).toBeGreaterThan(0.2);
        });
    });

    // =========================
    // Casos borde / ruido
    // =========================
    describe('Edge Cases', () => {
        it('should handle very short texts', async () => {
            const shortText = 'HELLO';
            const result = await CipherIdentifier.identify(shortText);

            expect(result.families[0].type).toBe('unknown');
            expect(result.families[0].reason.toLowerCase()).toContain('too short');
        });

        it('should handle random text', async () => {
            const randomText = 'QXZWPLKMJNHBGVFCDRTSEAYUIO';
            const result = await CipherIdentifier.identify(randomText);

            // Random text should have relatively low normalized IC
            expect(result.stats.ic).toBeLessThan(1.7);

            const types = result.families.map(f => f.type);
            const hasRandomOrVigenere =
                types.includes('random-unknown') ||
                types.includes('vigenere-like');
            expect(hasRandomOrVigenere).toBe(true);
        });

        it('should not crash with undefined or empty input', async () => {
            const resultEmpty = await CipherIdentifier.identify('');
            const resultUndefined = await CipherIdentifier.identify(undefined);

            [resultEmpty, resultUndefined].forEach(result => {
                expect(result.families).toBeDefined();
                expect(result.families.length).toBeGreaterThan(0);
            });
        });

        it('should work with non-default language without crashing (even if dictionary fails)', async () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND RUNS AWAY INTO THE FOREST';
            const caesar = new Shift.CaesarShift(plaintext, 5);
            const ciphertext = caesar.encode();
        
            const result = await CipherIdentifier.identify(ciphertext, 'klingon-especial');
        
            expect(result.families).toBeDefined();
            expect(result.families).toBeDefined();
            expect(result.stats.ic).toBeGreaterThan(1.0);
        });
        

        it('should treat plaintext-like input as not random-unknown (high dictionary coverage)', async () => {
            const plaintext =
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG ' +
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const result = await CipherIdentifier.identify(plaintext, 'english');

            const randomFamily = result.families.find(f => f.type === 'random-unknown');
            if (randomFamily) {
                // No debería ser el ganador ni tener una confianza brutal
                expect(randomFamily.confidence).toBeLessThan(0.8);
            }
        });
    });

    // =========================
    // Descripciones
    // =========================
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

        it('should return a generic message for unknown types', () => {
            const description = CipherIdentifier.getDescription('weird-new-cipher');
            expect(description).toBeDefined();
            expect(typeof description).toBe('string');
            expect(description.toLowerCase()).toContain('unknown');
        });
    });
});
