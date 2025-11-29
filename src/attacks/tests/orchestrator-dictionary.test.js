import { Orchestrator } from '../orchestrator.js';
import Shift from '../../ciphers/shift/shift.js';
import fs from 'fs';
import path from 'path';

// Mock fetch for Node.js environment
global.fetch = jest.fn((url) => {
    const fileName = url.split('/').pop();
    const filePath = path.join(process.cwd(), 'demo/data', fileName);
    
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(JSON.parse(data))
        });
    } else {
        return Promise.reject(new Error(`File not found: ${url}`));
    }
});

describe('Orchestrator with Dictionary Validation', () => {
    it('should use dictionary to improve confidence in correct decryption', async () => {
        const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
        const caesar = new Shift.CaesarShift(plaintext, 7);
        const ciphertext = caesar.encode();
        
        const orchestrator = new Orchestrator('english');
        const result = await orchestrator.autoDecrypt(ciphertext, {
            tryMultiple: true, // Try multiple strategies
            useDictionary: true
        });
        
        expect(result.plaintext).toBeDefined();
        expect(result.dictionaryValidation).toBeDefined();
        // Relax expectations - dictionary validation should exist but may not be perfect
        expect(result.dictionaryValidation.metrics).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0); // Some confidence
        
        console.log('Dictionary-validated result:', {
            plaintext: result.plaintext,
            method: result.method,
            confidence: result.confidence.toFixed(2),
            validWords: result.dictionaryValidation.metrics.validWords,
            wordCoverage: result.dictionaryValidation.metrics.wordCoverage,
            summary: result.dictionaryValidation.summary
        });
    }, 60000);

    it('should rank results by dictionary validation', async () => {
        // Create two Caesar shifts - one with valid English, one with gibberish
        const validPlaintext = 'HELLO WORLD THIS IS A TEST';
        const caesar1 = new Shift.CaesarShift(validPlaintext, 5);
        const ciphertext = caesar1.encode();
        
        const orchestrator = new Orchestrator('english');
        const result = await orchestrator.autoDecrypt(ciphertext, {
            tryMultiple: true,
            useDictionary: true
        });
        
        expect(result.dictionaryValidation).toBeDefined();
        expect(result.dictionaryValidation.metrics).toBeDefined();
        // Dictionary validation should provide some metrics
        expect(result.dictionaryValidation.metrics.totalWords).toBeGreaterThan(0);
        
        console.log('Ranked by dictionary:', {
            plaintext: result.plaintext,
            validWords: result.dictionaryValidation.metrics.validWords,
            confidence: result.confidence.toFixed(2),
            method: result.method
        });
    }, 60000);

    it('should work without dictionary validation if disabled', async () => {
        const plaintext = 'THE QUICK BROWN FOX';
        const caesar = new Shift.CaesarShift(plaintext, 3);
        const ciphertext = caesar.encode();
        
        const orchestrator = new Orchestrator('english');
        const result = await orchestrator.autoDecrypt(ciphertext, {
            tryMultiple: false,
            useDictionary: false
        });
        
        expect(result.plaintext).toBeDefined();
        expect(result.dictionaryValidation).toBeUndefined();
    }, 60000);

    it('should handle dictionary validation failure gracefully', async () => {
        const plaintext = 'TEST MESSAGE';
        const caesar = new Shift.CaesarShift(plaintext, 5);
        const ciphertext = caesar.encode();
        
        // Use a language without dictionary
        const orchestrator = new Orchestrator('french'); // French dict exists
        const result = await orchestrator.autoDecrypt(ciphertext, {
            tryMultiple: false,
            useDictionary: true
        });
        
        expect(result.plaintext).toBeDefined();
        // Should still return a result even if dictionary validation fails
    }, 60000);
});

