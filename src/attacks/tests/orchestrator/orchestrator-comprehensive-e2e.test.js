import { Orchestrator } from '../../orchestrator.js';
import Shift from '../../../ciphers/shift/shift.js';
import Polyalphabetic from '../../../ciphers/polyalphabetic/polyalphabetic.js';
import Dictionary from '../../../ciphers/dictionary/dictionary.js';
import { CipherIdentifier } from '../../../analysis/identifier.js';
import { LanguageAnalysis } from '../../../analysis/analysis.js';
import { verifyE2EResult } from './orchestrator-test-base.js';

/**
 * Comprehensive End-to-End Tests with Strict Validation
 * 
 * These tests verify the complete workflow with stricter requirements:
 * - Minimum confidence thresholds (0.7+)
 * - Exact plaintext matching
 * - Multiple cipher types
 * - Both Spanish and English
 */

describe('Orchestrator - Comprehensive E2E Tests (Strict)', () => {
    describe('ROT47 Cipher (English)', () => {
        it('should decrypt ROT47 with high confidence', async () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const rot47 = new Shift.Rot47(plaintext);
            const ciphertext = rot47.encode();
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 30000
            });
            
            await verifyE2EResult(
                orchestrator,
                'english',
                ciphertext,
                result,
                plaintext,
                {
                    expectedMethod: /rot47/i,
                    minConfidence: 0.7,
                    verifyPlaintext: true
                }
            );
        }, 60000);
    });
    
    describe('Vigenère Cipher (English)', () => {
        it('should decrypt Vigenère with high confidence', async () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const vigenere = new Polyalphabetic.Vigenere('SECRET');
            const ciphertext = vigenere.encode(plaintext);
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
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
                    minConfidence: 0.7,
                    verifyPlaintext: true
                }
            );
        }, 120000);
    });
    
    describe('Porta Cipher (Spanish)', () => {
        it('should decrypt Porta cipher in Spanish with high confidence', async () => {
            const plaintext = 'LA CRIPTOGRAFIA ES LA DISCIPLINA QUE SE ENCARGA DE ESTUDIAR Y DESARROLLAR TECNICAS DE COMUNICACION SEGURA';
            const porta = new Polyalphabetic.Porta(plaintext, 'CLAVE');
            const ciphertext = porta.encode();
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 60000
            });
            
            await verifyE2EResult(
                orchestrator,
                'spanish',
                ciphertext,
                result,
                plaintext,
                {
                    expectedMethod: /porta|polyalphabetic/i,
                    minConfidence: 0.7,
                    verifyPlaintext: true
                }
            );
        }, 120000);
    });
    
    describe('Atbash Cipher (English)', () => {
        it('should decrypt Atbash with high confidence', async () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const atbash = new Dictionary.Atbash(plaintext);
            const ciphertext = atbash.encode();
            
            const orchestrator = new Orchestrator('auto');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 30000
            });
            
            await verifyE2EResult(
                orchestrator,
                'english',
                ciphertext,
                result,
                plaintext,
                {
                    expectedMethod: /atbash/i,
                    minConfidence: 0.7,
                    verifyPlaintext: true
                }
            );
        }, 60000);
    });
});

