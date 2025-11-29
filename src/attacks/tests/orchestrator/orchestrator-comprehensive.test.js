import { Orchestrator } from '../../orchestrator.js';
import Shift from '../../../ciphers/shift/shift.js';
import Polyalphabetic from '../../../ciphers/polyalphabetic/polyalphabetic.js';
import { Scorer } from '../../../search/scorer.js';
import { PolyalphabeticSolver } from '../../strategies/polyalphabetic-solver.js';
import {
    createCipherTestSuite,
    createLengthVariationTests,
    createEdgeCaseTests,
    createPerformanceTest,
    verifyOrchestratorResult,
    getTestTexts
} from './orchestrator-test-base.js';

/**
 * Comprehensive Orchestrator Tests
 * 
 * Tests the orchestrator against:
 * - Multiple cipher types (Caesar, ROT13, Vigenère, Substitution, Beaufort, Porta, Gronsfeld, Quagmire)
 * - Multiple languages (English, Spanish, French, German, Italian, Portuguese)
 * - Different text lengths (short, medium, long)
 * - Edge cases (numbers, punctuation, mixed case, very short texts)
 * - Performance benchmarks
 */

describe('Orchestrator - Comprehensive Tests', () => {
    const languages = ['english', 'spanish', 'french', 'german', 'italian', 'portuguese'];
    
    // Caesar Cipher across languages
    createCipherTestSuite(
        'Caesar',
        (plaintext, language) => {
            const caesar = new Shift.CaesarShift(plaintext, 7);
            return caesar.encode();
        },
        languages,
        { timeout: 60000 }
    );
    
    // ROT13 across languages
    createCipherTestSuite(
        'ROT13',
        (plaintext, language) => {
            const rot13 = new Shift.Rot13(plaintext, 13);
            return rot13.encode();
        },
        languages,
        { timeout: 60000 }
    );
    
    // Vigenère across languages
    createCipherTestSuite(
        'Vigenère',
        (plaintext, language) => {
            const vigenere = new Polyalphabetic.Vigenere('KEY');
            return vigenere.encode(plaintext);
        },
        languages,
        { timeout: 120000 }
    );
    
    // Beaufort across languages
    createCipherTestSuite(
        'Beaufort',
        (plaintext, language) => {
            const beaufort = new Polyalphabetic.Beaufort(plaintext, 'CRYPTO');
            return beaufort.encode();
        },
        languages,
        { timeout: 120000 }
    );
    
    // Porta across languages
    createCipherTestSuite(
        'Porta',
        (plaintext, language) => {
            const porta = new Polyalphabetic.Porta(plaintext, 'FORTIFICATION');
            return porta.encode();
        },
        languages,
        { timeout: 120000 }
    );
    
    // Gronsfeld across languages
    createCipherTestSuite(
        'Gronsfeld',
        (plaintext, language) => {
            const gronsfeld = new Polyalphabetic.Gronsfeld(plaintext, '31415');
            return gronsfeld.encode();
        },
        languages,
        { timeout: 120000 }
    );
    
    // Quagmire I - Individual test (more complex)
    describe('Quagmire I Cipher', () => {
        languages.forEach(language => {
            it(`should attempt to decrypt Quagmire I in ${language}`, async () => {
                const testTexts = getTestTexts();
                const plaintext = testTexts[language]?.medium || testTexts.english.medium;
                const key = 'SECRET';
                const cipherAlphabet = 'ZYXWVUTSRQPONMLKJIHGFEDCBA'; // Reversed
                
                const quagmire = new Polyalphabetic.Quagmire1(plaintext, key, cipherAlphabet);
                const ciphertext = quagmire.encode();
                
                const orchestrator = new Orchestrator(language);
                const result = await orchestrator.autoDecrypt(ciphertext, {
                    tryMultiple: true,
                    useDictionary: true,
                    maxTime: 60000
                });
                
                verifyOrchestratorResult(result, {
                    requireScore: true
                });
                
                console.log(`Quagmire I: Method=${result.method}, Score=${result.score?.toFixed(2) || 'N/A'}, Confidence=${result.confidence.toFixed(2)}`);
            }, 120000);
        });
    });
    
    // Substitution Cipher across languages
    describe('Substitution Cipher', () => {
        languages.forEach(language => {
            it(`should decrypt substitution cipher in ${language}`, async () => {
                const testTexts = getTestTexts();
                const plaintext = testTexts[language]?.medium || testTexts.english.medium;
                const key = Scorer.randomKey();
                const scorer = new Scorer(language);
                const ciphertext = scorer.applyKey(plaintext, key);
                
                const orchestrator = new Orchestrator(language);
                const result = await orchestrator.autoDecrypt(ciphertext, {
                    tryMultiple: true,
                    useDictionary: true,
                    maxTime: 60000
                });
                
                verifyOrchestratorResult(result, {
                    requireScore: true
                });
                
                // For substitution ciphers, be lenient with score
                if (result.cipherType === 'monoalphabetic-substitution' || 
                    result.method === 'hill-climbing' || 
                    result.method === 'simulated-annealing') {
                    expect(result.score).toBeGreaterThan(-10);
                }
            }, 120000);
        });
    });
    
    // Text length variations for Caesar
    createLengthVariationTests(
        'Caesar',
        (plaintext) => {
            const caesar = new Shift.CaesarShift(plaintext, 5);
            return caesar.encode();
        },
        'english',
        { timeout: 60000 }
    );
    
    // Edge cases for Caesar
    createEdgeCaseTests(
        'Caesar',
        (plaintext) => {
            const caesar = new Shift.CaesarShift(plaintext, 3);
            return caesar.encode();
        },
        { timeout: 30000 }
    );
    
    // Performance test
    describe('Performance Benchmarks', () => {
        const testTexts = getTestTexts();
        const longText = testTexts.english.long;
        
        createPerformanceTest(
            'Caesar',
            (plaintext) => {
                const caesar = new Shift.CaesarShift(plaintext, 7);
                return caesar.encode();
            },
            longText,
            5000, // 5 seconds max
            { timeout: 10000 }
        );
    });
});
