import { default as Dictionary } from '../../ciphers/dictionary/dictionary.js';
import { Scorer } from '../../search/scorer.js';
import { TextUtils } from '../../core/text-utils.js';
import { LanguageAnalysis } from '../../analysis/analysis-core.js';

/**
 * Atbash Cipher Solver
 * 
 * Atbash is a monoalphabetic substitution cipher that is self-reciprocal.
 * Strategy: Simply apply Atbash transformation and validate with dictionary + n-grams.
 */
export class AtbashSolver {
    constructor(language = 'english') {
        this.language = language;
    }

    /**
     * Solves Atbash cipher.
     * @param {string} ciphertext - The encrypted text
     * @returns {Promise<Object>} Result with plaintext, method, confidence, score, etc.
     */
    async solve(ciphertext) {
        try {
            // Handle null/undefined input
            if (!ciphertext) {
                return {
                    plaintext: '',
                    method: 'atbash',
                    key: null,
                    confidence: 0,
                    score: -Infinity,
                    wordCoverage: 0
                };
            }

            // Handle edge cases
            const cleanInput = TextUtils.onlyLetters(ciphertext);
            if (!cleanInput || cleanInput.length === 0) {
                return {
                    plaintext: ciphertext,
                    method: 'atbash',
                    key: null,
                    confidence: 0,
                    score: -Infinity,
                    wordCoverage: 0
                };
            }

            // Atbash is self-reciprocal, so we can just decode it
            // Implement Atbash decoding directly to maintain original layout
            let plaintext = '';
            for (const char of ciphertext) {
                const upperChar = char.toUpperCase();
                if (upperChar >= 'A' && upperChar <= 'Z') {
                    // A->Z, B->Y, C->X, ..., Z->A
                    const code = upperChar.charCodeAt(0);
                    const atbashCode = 'Z'.charCodeAt(0) - (code - 'A'.charCodeAt(0));
                    const atbashChar = String.fromCharCode(atbashCode);
                    // Preserve original case
                    plaintext += char === upperChar ? atbashChar : atbashChar.toLowerCase();
                } else {
                    // Keep non-letters as-is
                    plaintext += char;
                }
            }
            
            // Score with n-grams
            const scorer = new Scorer(this.language, 4); // Use quadgrams
            const cleanText = TextUtils.onlyLetters(plaintext);
            const score = scorer.score(cleanText);
            
            // Validate with dictionary
            const dict = LanguageAnalysis.getDictionary(this.language);
            let wordCoverage = 0;
            let confidence = 0.5;
            
            if (dict) {
                const words = plaintext.toUpperCase()
                    .split(/\s+/)
                    .map(w => TextUtils.onlyLetters(w))
                    .filter(w => w.length >= 3);
                
                if (words.length > 0) {
                    let validWords = 0;
                    for (const word of words) {
                        if (dict.has(word)) {
                            validWords++;
                        }
                    }
                    wordCoverage = validWords / words.length;
                }
            }
            
            // Calculate confidence based on dictionary validation and n-gram score
            if (wordCoverage > 0.80) {
                confidence = 0.98;
            } else if (wordCoverage > 0.70) {
                confidence = 0.95;
            } else if (wordCoverage > 0.60) {
                confidence = 0.90;
            } else if (wordCoverage > 0.50) {
                confidence = 0.85;
            } else if (score > -7) {
                // Good quadgram score even without dictionary
                confidence = 0.90;
            } else if (score > -4) {
                confidence = 0.75;
            } else if (score > -5) {
                confidence = 0.60;
            }
            
            return {
                plaintext: TextUtils.matchLayout(ciphertext, plaintext),
                method: 'atbash',
                confidence: confidence,
                score: score,
                key: null, // Atbash has no key
                wordCoverage: wordCoverage
            };
        } catch (error) {
            console.warn('[AtbashSolver] Error:', error);
            return {
                plaintext: ciphertext,
                method: 'atbash',
                confidence: 0,
                score: -Infinity,
                key: null
            };
        }
    }
}

