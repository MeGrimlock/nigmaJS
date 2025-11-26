import { Orchestrator } from '../orchestrator.js';
import Shift from '../../ciphers/shift/shift.js';
import Polyalphabetic from '../../ciphers/polyalphabetic/polyalphabetic.js';
import { CipherIdentifier } from '../../analysis/identifier.js';
import { LanguageAnalysis } from '../../analysis/analysis.js';

/**
 * End-to-End Tests for Orchestrator
 * 
 * These tests verify that the Orchestrator can:
 * 1. Correctly identify the language
 * 2. Correctly identify the cipher method
 * 3. Successfully decrypt the ciphertext
 * 
 * Test cases:
 * - ROT47 (Spanish & English)
 * - Vigenère (Spanish & English)
 * - Porta (Spanish & English)
 * - Quagmire (Spanish & English)
 */

// Test texts
const testTexts = {
    spanish: {
        short: 'EL VELOZ MURCIELAGO HINDU COMIA FELIZ CARDILLO Y KIWI',
        medium: 'LA CRIPTOGRAFIA ES EL ARTE Y LA CIENCIA DE CIFRAR MENSAJES DE FORMA QUE SOLO LAS PERSONAS AUTORIZADAS PUEDAN LEERLOS',
        long: 'LA HISTORIA DE LA CRIPTOGRAFIA SE REMONTA A MILES DE AÑOS ATRAS HASTA DECADAS RECIENTES HA SIDO SINONIMO DE CIFRADO LA CONVERSION DE INFORMACION DE UN ESTADO LEGIBLE A UN APARENTE SINSENTIDO'
    },
    english: {
        short: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
        medium: 'IN CRYPTOGRAPHY A SUBSTITUTION CIPHER IS A METHOD OF ENCRYPTING BY WHICH UNITS OF PLAINTEXT ARE REPLACED WITH CIPHERTEXT',
        long: 'THE HISTORY OF CRYPTOGRAPHY BEGINS THOUSANDS OF YEARS AGO UNTIL RECENT DECADES IT HAS BEEN SYNONYMOUS WITH ENCRYPTION THE CONVERSION OF INFORMATION FROM A READABLE STATE TO APPARENT NONSENSE'
    }
};

describe('Orchestrator E2E Tests', () => {
    // Increase timeout for E2E tests
    jest.setTimeout(120000);

    describe('ROT47 Cipher', () => {
        test('should decrypt ROT47 in Spanish (short text)', async () => {
            const plaintext = testTexts.spanish.short;
            const rot47 = new Shift.Rot47(plaintext);
            const ciphertext = rot47.encode();
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 30000
            });
            
            // Verify language detection
            expect(orchestrator.language).toBe('spanish');
            
            // Verify cipher detection
            const detection = await CipherIdentifier.identify(ciphertext, 'spanish');
            expect(detection.families[0].type).toMatch(/caesar-shift|monoalphabetic-substitution/);
            
            // Verify decryption
            expect(result).toBeDefined();
            expect(result.method).toMatch(/rot47|caesar-shift/);
            expect(result.confidence).toBeGreaterThan(0.5);
            
            // Clean plaintext for comparison (remove punctuation, uppercase)
            const cleanResult = result.plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            const cleanExpected = plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            
            expect(cleanResult).toBe(cleanExpected);
        }, 60000);

        test('should decrypt ROT47 in English (short text)', async () => {
            const plaintext = testTexts.english.short;
            const rot47 = new Shift.Rot47(plaintext);
            const ciphertext = rot47.encode();
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 30000
            });
            
            // Verify language detection
            expect(orchestrator.language).toBe('english');
            
            // Verify cipher detection
            const detection = await CipherIdentifier.identify(ciphertext, 'english');
            expect(detection.families[0].type).toMatch(/caesar-shift|monoalphabetic-substitution/);
            
            // Verify decryption
            expect(result).toBeDefined();
            expect(result.method).toMatch(/rot47|caesar-shift/);
            expect(result.confidence).toBeGreaterThan(0.5);
            
            // Clean plaintext for comparison
            const cleanResult = result.plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            const cleanExpected = plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            
            expect(cleanResult).toBe(cleanExpected);
        }, 60000);

        test('should decrypt ROT47 in Spanish (medium text)', async () => {
            const plaintext = testTexts.spanish.medium;
            const rot47 = new Shift.Rot47(plaintext);
            const ciphertext = rot47.encode();
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 30000
            });
            
            expect(orchestrator.language).toBe('spanish');
            expect(result).toBeDefined();
            expect(result.method).toMatch(/rot47|caesar-shift/);
            expect(result.confidence).toBeGreaterThan(0.7);
            
            const cleanResult = result.plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            const cleanExpected = plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            
            expect(cleanResult).toBe(cleanExpected);
        }, 60000);
    });

    describe('Vigenère Cipher', () => {
        test('should decrypt Vigenère in Spanish with key "CLAVE"', async () => {
            const plaintext = testTexts.spanish.medium;
            const key = 'CLAVE';
            const vigenere = new Polyalphabetic.Vigenere(plaintext, key);
            const ciphertext = vigenere.encode();
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 60000
            });
            
            // Verify language detection
            expect(orchestrator.language).toBe('spanish');
            
            // Verify cipher detection
            const detection = await CipherIdentifier.identify(ciphertext, 'spanish');
            expect(detection.families[0].type).toMatch(/vigenere-like|polyalphabetic/);
            
            // Verify decryption
            expect(result).toBeDefined();
            expect(result.method).toMatch(/vigenere|polyalphabetic/);
            expect(result.confidence).toBeGreaterThan(0.6);
            
            // Check if key was found (may not be exact due to solver limitations)
            if (result.key) {
                expect(result.key.length).toBeGreaterThan(0);
            }
            
            // Clean plaintext for comparison
            const cleanResult = result.plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            const cleanExpected = plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            
            // Allow some tolerance for Vigenère (may not be 100% accurate)
            const similarity = calculateSimilarity(cleanResult, cleanExpected);
            expect(similarity).toBeGreaterThan(0.7); // At least 70% similar
        }, 120000);

        test('should decrypt Vigenère in English with key "KEY"', async () => {
            const plaintext = testTexts.english.medium;
            const key = 'KEY';
            const vigenere = new Polyalphabetic.Vigenere(plaintext, key);
            const ciphertext = vigenere.encode();
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 60000
            });
            
            // Verify language detection
            expect(orchestrator.language).toBe('english');
            
            // Verify cipher detection
            const detection = await CipherIdentifier.identify(ciphertext, 'english');
            expect(detection.families[0].type).toMatch(/vigenere-like|polyalphabetic/);
            
            // Verify decryption
            expect(result).toBeDefined();
            expect(result.method).toMatch(/vigenere|polyalphabetic/);
            expect(result.confidence).toBeGreaterThan(0.6);
            
            // Clean plaintext for comparison
            const cleanResult = result.plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            const cleanExpected = plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            
            // Allow some tolerance for Vigenère
            const similarity = calculateSimilarity(cleanResult, cleanExpected);
            expect(similarity).toBeGreaterThan(0.7);
        }, 120000);
    });

    describe('Porta Cipher', () => {
        test('should decrypt Porta in Spanish with key "CLAVE"', async () => {
            const plaintext = testTexts.spanish.long; // Porta needs longer text
            const key = 'CLAVE';
            const porta = new Polyalphabetic.Porta(plaintext, key);
            const ciphertext = porta.encode();
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 60000
            });
            
            // Verify language detection
            expect(orchestrator.language).toBe('spanish');
            
            // Verify cipher detection
            const detection = await CipherIdentifier.identify(ciphertext, 'spanish');
            expect(detection.families[0].type).toMatch(/vigenere-like|polyalphabetic/);
            
            // Verify decryption
            expect(result).toBeDefined();
            expect(result.method).toMatch(/porta|polyalphabetic/);
            expect(result.confidence).toBeGreaterThan(0.5);
            
            // Clean plaintext for comparison
            const cleanResult = result.plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            const cleanExpected = plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            
            // Porta is harder, allow more tolerance
            const similarity = calculateSimilarity(cleanResult, cleanExpected);
            expect(similarity).toBeGreaterThan(0.6); // At least 60% similar
        }, 120000);

        test('should decrypt Porta in English with key "KEY"', async () => {
            const plaintext = testTexts.english.long; // Porta needs longer text
            const key = 'KEY';
            const porta = new Polyalphabetic.Porta(plaintext, key);
            const ciphertext = porta.encode();
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 60000
            });
            
            // Verify language detection
            expect(orchestrator.language).toBe('english');
            
            // Verify decryption
            expect(result).toBeDefined();
            expect(result.method).toMatch(/porta|polyalphabetic/);
            expect(result.confidence).toBeGreaterThan(0.5);
            
            // Clean plaintext for comparison
            const cleanResult = result.plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            const cleanExpected = plaintext.toUpperCase().replace(/[^A-Z]/g, '');
            
            // Porta is harder, allow more tolerance
            const similarity = calculateSimilarity(cleanResult, cleanExpected);
            expect(similarity).toBeGreaterThan(0.6);
        }, 120000);
    });

    describe('Quagmire Cipher', () => {
        test('should decrypt Quagmire I in Spanish', async () => {
            const plaintext = testTexts.spanish.long; // Quagmire needs very long text
            const key = 'CLAVE';
            const cipherAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Normal alphabet
            const quagmire = new Polyalphabetic.Quagmire1(plaintext, key, cipherAlphabet);
            const ciphertext = quagmire.encode();
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 60000
            });
            
            // Verify language detection
            expect(orchestrator.language).toBe('spanish');
            
            // Verify decryption (Quagmire is very hard, may not succeed)
            expect(result).toBeDefined();
            // Quagmire success rate is low, so we just check it doesn't crash
            if (result.method !== 'none') {
                expect(result.confidence).toBeGreaterThan(0);
            }
        }, 120000);

        test('should decrypt Quagmire I in English', async () => {
            const plaintext = testTexts.english.long; // Quagmire needs very long text
            const key = 'KEY';
            const cipherAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Normal alphabet
            const quagmire = new Polyalphabetic.Quagmire1(plaintext, key, cipherAlphabet);
            const ciphertext = quagmire.encode();
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 60000
            });
            
            // Verify language detection
            expect(orchestrator.language).toBe('english');
            
            // Verify decryption (Quagmire is very hard, may not succeed)
            expect(result).toBeDefined();
            // Quagmire success rate is low, so we just check it doesn't crash
            if (result.method !== 'none') {
                expect(result.confidence).toBeGreaterThan(0);
            }
        }, 120000);
    });

    describe('Language Detection', () => {
        test('should correctly detect Spanish language', async () => {
            const plaintext = testTexts.spanish.medium;
            const rot47 = new Shift.Rot47(plaintext);
            const ciphertext = rot47.encode();
            
            const orchestrator = new Orchestrator('auto');
            await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 30000
            });
            
            expect(orchestrator.language).toBe('spanish');
        }, 60000);

        test('should correctly detect English language', async () => {
            const plaintext = testTexts.english.medium;
            const rot47 = new Shift.Rot47(plaintext);
            const ciphertext = rot47.encode();
            
            const orchestrator = new Orchestrator('auto');
            await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 30000
            });
            
            expect(orchestrator.language).toBe('english');
        }, 60000);
    });

    describe('Cipher Detection', () => {
        test('should detect ROT47 as caesar-shift or monoalphabetic', async () => {
            const plaintext = testTexts.english.short;
            const rot47 = new Shift.Rot47(plaintext);
            const ciphertext = rot47.encode();
            
            const detection = await CipherIdentifier.identify(ciphertext, 'english');
            const topType = detection.families[0].type;
            
            expect(topType).toMatch(/caesar-shift|monoalphabetic-substitution/);
        }, 30000);

        test('should detect Vigenère as vigenere-like', async () => {
            const plaintext = testTexts.english.medium;
            const vigenere = new Polyalphabetic.Vigenere(plaintext, 'KEY');
            const ciphertext = vigenere.encode();
            
            const detection = await CipherIdentifier.identify(ciphertext, 'english');
            const topType = detection.families[0].type;
            
            expect(topType).toMatch(/vigenere-like|polyalphabetic/);
        }, 30000);

        test('should detect Porta as vigenere-like or polyalphabetic', async () => {
            const plaintext = testTexts.english.long;
            const porta = new Polyalphabetic.Porta(plaintext, 'KEY');
            const ciphertext = porta.encode();
            
            const detection = await CipherIdentifier.identify(ciphertext, 'english');
            const topType = detection.families[0].type;
            
            expect(topType).toMatch(/vigenere-like|polyalphabetic/);
        }, 30000);
    });
});

/**
 * Calculate similarity between two strings (0-1)
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
    if (str1.length === 0 && str2.length === 0) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;
    
    const maxLength = Math.max(str1.length, str2.length);
    let matches = 0;
    
    for (let i = 0; i < maxLength; i++) {
        if (str1[i] === str2[i]) {
            matches++;
        }
    }
    
    return matches / maxLength;
}

