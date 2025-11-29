import { Orchestrator } from '../../orchestrator.js';
import Shift from '../../../ciphers/shift/shift.js';
import Polyalphabetic from '../../../ciphers/polyalphabetic/polyalphabetic.js';
import { CipherIdentifier } from '../../../analysis/identifier.js';
import { LanguageAnalysis } from '../../../analysis/analysis.js';
import { verifyE2EResult } from './orchestrator-test-base.js';

/**
 * End-to-End Tests for Orchestrator
 * 
 * These tests verify that the Orchestrator can:
 * 1. Correctly identify the language
 * 2. Correctly identify the cipher method
 * 3. Successfully decrypt the ciphertext
 * 
 * Test cases:
 * - Spanish Caesar cipher with auto language detection
 * - English Vigenère with auto language detection
 * - Multiple languages and cipher types
 */

describe('Orchestrator - End-to-End Tests', () => {
    describe('Spanish Caesar Cipher with Auto Language Detection', () => {
        it('should detect Spanish and decrypt Caesar cipher', async () => {
            const plaintext = 'EL VELOZ MURCIELAGO HINDU COMIA FELIZ CARDILLO Y KIWI';
            const caesar = new Shift.CaesarShift(plaintext, 3);
            const ciphertext = caesar.encode();
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                maxTime: 30000
            });
            
            await verifyE2EResult(
                orchestrator,
                'spanish',
                ciphertext,
                result,
                plaintext,
                {
                    expectedMethod: /caesar|brute.*force/i,
                    minConfidence: 0.5
                }
            );
        }, 60000);
    });
    
    describe('English Vigenère with Auto Language Detection', () => {
        it('should detect English and decrypt Vigenère cipher', async () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const vigenere = new Polyalphabetic.Vigenere('KEY');
            const ciphertext = vigenere.encode(plaintext);
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                maxTime: 60000
            });
            
            await verifyE2EResult(
                orchestrator,
                'english',
                ciphertext,
                result,
                plaintext,
                {
                    expectedMethod: /vigenere/i,
                    minConfidence: 0.5
                }
            );
        }, 120000);
    });
    
    describe('Cipher Type Detection Accuracy', () => {
        it('should correctly identify Caesar cipher type', async () => {
            const plaintext = 'HELLO WORLD THIS IS A TEST MESSAGE';
            const caesar = new Shift.CaesarShift(plaintext, 5);
            const ciphertext = caesar.encode();
            
            const detection = await CipherIdentifier.identify(ciphertext, 'english');
            const detectedType = detection.families[0].type;
            
            expect(detectedType).toMatch(/caesar|monoalphabetic/i);
        }, 30000);
        
        it('should correctly identify Vigenère cipher type', async () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const vigenere = new Polyalphabetic.Vigenere('SECRET');
            const ciphertext = vigenere.encode(plaintext);
            
            const detection = await CipherIdentifier.identify(ciphertext, 'english');
            const detectedType = detection.families[0].type;
            
            expect(detectedType).toMatch(/vigenere/i);
        }, 30000);
    });
});

