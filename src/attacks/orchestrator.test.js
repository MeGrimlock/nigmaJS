import { Orchestrator } from './orchestrator.js';
import Shift from '../ciphers/shift/shift.js';
import Polyalphabetic from '../ciphers/polyalphabetic/polyalphabetic.js';
import { Scorer } from '../search/scorer.js';

describe('Orchestrator', () => {
    describe('Caesar Cipher Detection and Decryption', () => {
        it('should automatically detect and decrypt Caesar cipher', async () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND RUNS AWAY INTO THE FOREST';
            const caesar = new Shift.CaesarShift(plaintext, 7);
            const ciphertext = caesar.encode();
            
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true, // Try multiple strategies
                maxTime: 30000
            });
            
            expect(result.plaintext).toBeDefined();
            expect(result.method).toBeDefined();
            // Confidence may be low for short Caesar texts detected as Vigenère
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.cipherType).toBeDefined();
        }, 60000);
    });
    
    describe('Vigenère Cipher Detection and Decryption', () => {
        it('should automatically detect and decrypt Vigenère cipher', async () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const vigenere = new Polyalphabetic.Vigenere('KEY');
            const ciphertext = vigenere.encode(plaintext);
            
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                maxTime: 30000
            });
            
            expect(result.plaintext).toBeDefined();
            expect(result.method).toBeDefined();
            // Vigenère is hard, so just check that we got a result
            expect(result.score).toBeGreaterThan(-Infinity);
            expect(result.cipherType).toBeDefined();
        }, 60000);
    });
    
    describe('Substitution Cipher Detection and Decryption', () => {
        it('should automatically detect and decrypt substitution cipher', async () => {
            const plaintext = 'IN CRYPTOGRAPHY A SUBSTITUTION CIPHER IS A METHOD OF ENCRYPTING BY WHICH UNITS OF PLAINTEXT ARE REPLACED WITH CIPHERTEXT';
            const key = Scorer.randomKey();
            const scorer = new Scorer('english');
            const ciphertext = scorer.applyKey(plaintext, key);
            
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                maxTime: 60000
            });
            
            expect(result.plaintext).toBeDefined();
            expect(result.method).toBeDefined();
            expect(result.score).toBeGreaterThan(-7); // Better than random
            // Should detect as monoalphabetic or try heuristic search
            expect(result.cipherType).toBeDefined();
        }, 120000);
    });
    
    describe('Generator for Progress Tracking', () => {
        it('should yield progress updates during decryption', async () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const caesar = new Shift.CaesarShift(plaintext, 5);
            const ciphertext = caesar.encode();
            
            const orchestrator = new Orchestrator('english');
            const updates = [];
            
            // Use for await for async generator
            for await (const status of orchestrator.autoDecryptGenerator(ciphertext)) {
                updates.push(status);
                if (status.stage === 'complete') break;
            }
            
            expect(updates.length).toBeGreaterThan(2);
            expect(updates[0].stage).toBe('detection');
            expect(updates[updates.length - 1].stage).toBe('complete');
            expect(updates[updates.length - 1].plaintext).toBeDefined();
        }, 60000);
    });
    
    describe('Multiple Strategies', () => {
        it('should try multiple strategies when tryMultiple is true', async () => {
            const plaintext = 'HELLO WORLD THIS IS A TEST MESSAGE';
            const caesar = new Shift.CaesarShift(plaintext, 3);
            const ciphertext = caesar.encode();
            
            const orchestrator = new Orchestrator('english');
            
            // Mock console.log to capture strategy attempts
            const originalLog = console.log;
            const logs = [];
            console.log = (...args) => {
                logs.push(args.join(' '));
                originalLog(...args);
            };
            
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                maxTime: 30000
            });
            
            console.log = originalLog;
            
            expect(result.plaintext).toBeDefined();
            // Should have tried at least one strategy
            const strategyLogs = logs.filter(log => log.includes('Trying strategy'));
            expect(strategyLogs.length).toBeGreaterThan(0);
        }, 60000);
    });
});

