import { DictionaryValidator } from './dictionary-validator.js';
import { LanguageAnalysis } from '../analysis/analysis.js';
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

describe('DictionaryValidator', () => {
    describe('English Validation', () => {
        it('should validate correct English text with high confidence', async () => {
            const validator = new DictionaryValidator('english');
            const text = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            
            const result = await validator.validate(text);
            
            expect(result.valid).toBe(true);
            expect(result.confidence).toBeGreaterThan(0.7);
            expect(result.metrics.validWords).toBeGreaterThan(5);
            expect(parseFloat(result.metrics.wordCoverage)).toBeGreaterThan(70);
            expect(result.summary).toContain('confidence');
            
            console.log('English validation:', result);
        }, 30000);

        it('should reject gibberish with low confidence', async () => {
            const validator = new DictionaryValidator('english');
            const text = 'XYZ QWERTY ASDFGH ZXCVBN POIUYT';
            
            const result = await validator.validate(text);
            
            expect(result.valid).toBe(false);
            expect(result.confidence).toBeLessThan(0.5); // Relaxed threshold
            expect(result.metrics.validWords).toBeLessThan(3);
            
            console.log('Gibberish validation:', result);
        }, 30000);

        it('should handle mixed valid/invalid words', async () => {
            const validator = new DictionaryValidator('english');
            const text = 'THE QUICK XYZABC FOX JUMPS QWERTY LAZY DOG';
            
            const result = await validator.validate(text);
            
            expect(result.confidence).toBeGreaterThan(0.3);
            expect(result.confidence).toBeLessThan(0.9);
            expect(result.metrics.validWords).toBeGreaterThan(3);
            expect(result.metrics.validWords).toBeLessThan(8);
            
            console.log('Mixed validation:', result);
        }, 30000);
    });

    describe('Spanish Validation', () => {
        it('should validate correct Spanish text', async () => {
            const validator = new DictionaryValidator('spanish');
            const text = 'EL PERRO COME LA COMIDA EN LA CASA';
            
            const result = await validator.validate(text);
            
            expect(result.valid).toBe(true);
            expect(result.confidence).toBeGreaterThan(0.6);
            expect(result.metrics.validWords).toBeGreaterThan(4);
            
            console.log('Spanish validation:', result);
        }, 30000);
    });

    describe('Multiple Results Validation', () => {
        it('should rank multiple decryption results by dictionary confidence', async () => {
            const validator = new DictionaryValidator('english');
            
            const results = [
                { plaintext: 'XYZ QWERTY ASDFGH', confidence: 0.8, method: 'test1' },
                { plaintext: 'THE QUICK BROWN FOX', confidence: 0.5, method: 'test2' },
                { plaintext: 'HELLO WORLD TODAY', confidence: 0.6, method: 'test3' }
            ];
            
            const ranked = await validator.validateMultiple(results);
            
            // The one with actual English words should be ranked higher
            // Either "QUICK" or "HELLO" should be first (both are valid English)
            const topText = ranked[0].plaintext;
            expect(topText.includes('QUICK') || topText.includes('HELLO')).toBe(true);
            expect(ranked[0].confidence).toBeGreaterThan(0.6);
            
            console.log('Ranked results:', ranked.map(r => ({
                plaintext: r.plaintext,
                confidence: r.confidence.toFixed(2),
                validWords: r.validation.metrics.validWords
            })));
        }, 30000);
    });

    describe('Quick Validation', () => {
        it('should quickly check if text has valid words', async () => {
            const validator = new DictionaryValidator('english');
            
            const validText = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const invalidText = 'XYZ QWERTY ASDFGH ZXCVBN POIUYT';
            
            const hasValidWords1 = await validator.hasValidWords(validText, 3);
            const hasValidWords2 = await validator.hasValidWords(invalidText, 3);
            
            expect(hasValidWords1).toBe(true);
            expect(hasValidWords2).toBe(false);
        }, 30000);
    });

    describe('Edge Cases', () => {
        it('should handle empty text', async () => {
            const validator = new DictionaryValidator('english');
            const result = await validator.validate('');
            
            expect(result.valid).toBe(false);
            expect(result.confidence).toBe(0);
            expect(result.error).toBeDefined();
        }, 30000);

        it('should handle text with only short words', async () => {
            const validator = new DictionaryValidator('english');
            const text = 'A I AM TO BE OR IT IS';
            
            const result = await validator.validate(text);
            
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.metrics.validWords).toBeGreaterThan(0);
        }, 30000);

        it('should handle text with punctuation', async () => {
            const validator = new DictionaryValidator('english');
            const text = 'THE QUICK, BROWN FOX! JUMPS?';
            
            const result = await validator.validate(text);
            
            expect(result.valid).toBe(true);
            expect(result.metrics.validWords).toBeGreaterThan(3);
        }, 30000);
    });
});

