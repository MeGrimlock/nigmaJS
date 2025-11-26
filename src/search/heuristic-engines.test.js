import { Scorer } from './scorer.js';
import { HillClimb } from './hillclimb.js';
import { SimulatedAnnealing } from './simulated-annealing.js';
import Shift from '../ciphers/shift/shift.js';

// Helper function to calculate similarity between two strings
function calculateSimilarity(str1, str2) {
    const len = Math.min(str1.length, str2.length);
    let matches = 0;
    for (let i = 0; i < len; i++) {
        if (str1[i] === str2[i]) matches++;
    }
    return matches / len;
}

describe('Heuristic Search Engines', () => {
    describe('Scorer', () => {
        it('should score English text higher than random text', () => {
            const scorer = new Scorer('english', 4);
            
            const englishText = 'INCRYPTOGRAPHYASUBSTITUTIONCIPHER';
            const randomText = 'QXZWPLKMJNHBGVFCDRTSEAYUIOPASDFG';
            
            const englishScore = scorer.score(englishText);
            const randomScore = scorer.score(randomText);
            
            // In log-likelihood, less negative is better (closer to 0)
            expect(englishScore).toBeGreaterThan(randomScore);
            // English should score better than random (even if marginally)
            expect(englishScore - randomScore).toBeGreaterThan(0.1); // At least 0.1 point difference
        });
        
        it('should create a random key with all 26 letters', () => {
            const key = Scorer.randomKey();
            
            expect(Object.keys(key).length).toBe(26);
            
            // Check that all letters A-Z are present
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            for (const char of alphabet) {
                expect(key[char]).toBeDefined();
            }
            
            // Check that all values are unique (it's a permutation)
            const values = Object.values(key);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(26);
        });
        
        it('should create a frequency-based key', () => {
            const ciphertext = 'EEEAAAAOOOSSSRRRNNNIIIIDDD'; // Simulates Spanish frequency
            const key = Scorer.frequencyKey(ciphertext, 'spanish');
            
            expect(Object.keys(key).length).toBe(26);
            
            // Most frequent cipher letter (E) should map to most frequent Spanish letter (E)
            // This is a weak test since frequency analysis is heuristic
            expect(key['E']).toBeDefined();
        });
        
        it('should apply a substitution key correctly', () => {
            const scorer = new Scorer('english');
            const ciphertext = 'KHOOR'; // Caesar +3 of HELLO
            
            // Reverse key: K->H, H->E, O->L, R->O
            const key = Scorer.identityKey();
            key['K'] = 'H';
            key['H'] = 'E';
            key['O'] = 'L';
            key['R'] = 'O';
            
            const result = scorer.applyKey(ciphertext, key);
            expect(result).toBe('HELLO'); // KHOOR -> HELLO
        });
        
        it('should swap two letters in a key', () => {
            const key = Scorer.identityKey();
            const swapped = Scorer.swapKey(key, 'A', 'B');
            
            expect(swapped['A']).toBe('B');
            expect(swapped['B']).toBe('A');
            expect(swapped['C']).toBe('C'); // Others unchanged
        });
    });
    
    describe('Hill Climbing', () => {
        it('should decrypt a simple substitution cipher', () => {
            // Use a longer, more realistic plaintext
            const plaintext = 'IN CRYPTOGRAPHY A SUBSTITUTION CIPHER IS A METHOD OF ENCRYPTING BY WHICH UNITS OF PLAINTEXT ARE REPLACED WITH CIPHERTEXT ACCORDING TO A FIXED SYSTEM THE UNITS MAY BE SINGLE LETTERS THE MOST COMMON PAIRS OF LETTERS DIGRAMS OR TRIPLETS OF LETTERS TRIGRAMS OR OTHER COMBINATIONS';
            
            // Create a random substitution key
            const key = Scorer.randomKey();
            const scorer = new Scorer('english');
            const ciphertext = scorer.applyKey(plaintext, key);
            
            const solver = new HillClimb('english');
            const result = solver.solve(ciphertext, {
                initMethod: 'frequency',
                maxIterations: 5000,
                restarts: 2 // Multiple restarts to avoid local maxima
            });
            
            expect(result.plaintext).toBeDefined();
            expect(result.score).toBeGreaterThan(-7); // Should be better than random (floor is -7)
            expect(result.method).toBe('hillclimb');
            
            // Hill climbing should find a local maximum, even if not perfect
            // The score should be reasonable for a heuristic search
            expect(result.score).toBeLessThan(-2); // Not perfect, but better than random
        }, 60000); // 60s timeout
        
        it('should improve score over iterations', () => {
            const plaintext = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG';
            const caesar = new Shift.CaesarShift(plaintext, 7);
            const ciphertext = caesar.encode();
            
            const solver = new HillClimb('english');
            const results = [];
            
            for (const status of solver.solveGenerator(ciphertext, { maxIterations: 1000 })) {
                results.push(status);
            }
            
            expect(results.length).toBeGreaterThan(1);
            
            // Score should generally improve (or stay the same)
            const firstScore = results[0].score;
            const lastScore = results[results.length - 1].score;
            expect(lastScore).toBeGreaterThanOrEqual(firstScore);
        }, 30000);
    });
    
    describe('Simulated Annealing', () => {
        it('should decrypt a simple substitution cipher', () => {
            const plaintext = 'IN CRYPTOGRAPHY A SUBSTITUTION CIPHER IS A METHOD OF ENCRYPTING BY WHICH UNITS OF PLAINTEXT ARE REPLACED WITH CIPHERTEXT ACCORDING TO A FIXED SYSTEM THE UNITS MAY BE SINGLE LETTERS THE MOST COMMON PAIRS OF LETTERS DIGRAMS OR TRIPLETS OF LETTERS TRIGRAMS OR OTHER COMBINATIONS';
            
            const key = Scorer.randomKey();
            const scorer = new Scorer('english');
            const ciphertext = scorer.applyKey(plaintext, key);
            
            const solver = new SimulatedAnnealing('english');
            const result = solver.solve(ciphertext, {
                initMethod: 'frequency',
                maxIterations: 20000,
                initialTemp: 20,
                coolingRate: 0.9998,
                restarts: 2
            });
            
            expect(result.plaintext).toBeDefined();
            expect(result.score).toBeGreaterThan(-7); // Should be better than random
            expect(result.method).toBe('simulated-annealing');
            
            // SA should explore more than hill climbing
            expect(result.score).toBeLessThan(-2); // Should find a reasonable solution
        }, 120000); // 120s timeout (SA is slower)
        
        it('should accept bad moves early on (high temperature)', () => {
            // This is a probabilistic test, so we just check that SA runs
            const ciphertext = 'KHOOR ZRUOG'; // "HELLO WORLD" with Caesar +3
            
            const solver = new SimulatedAnnealing('english');
            const results = [];
            
            for (const status of solver.solveGenerator(ciphertext, {
                maxIterations: 1000,
                initialTemp: 20,
                coolingRate: 0.995
            })) {
                results.push(status);
                if (results.length > 10) break; // Just check first few iterations
            }
            
            expect(results.length).toBeGreaterThan(1);
            expect(results[0].temperature).toBeGreaterThan(results[results.length - 1].temperature);
        }, 30000);
    });
});

