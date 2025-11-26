import { default as Dictionary } from '../../ciphers/dictionary/dictionary.js';
import { Scorer } from '../../search/scorer.js';
import { TextUtils } from '../../core/text-utils.js';
import { LanguageAnalysis } from '../../analysis/analysis.js';

/**
 * Baconian Cipher Solver
 * 
 * Baconian encodes letters as 5-bit patterns (A/B or 0/1).
 * Strategy: Try both A/B and 0/1 patterns, validate with dictionary + n-grams.
 */
export class BaconianSolver {
    constructor(language = 'english') {
        this.language = language;
    }

    /**
     * Solves Baconian cipher.
     * @param {string} ciphertext - The encrypted text
     * @returns {Promise<Object>} Result with plaintext, method, confidence, score, etc.
     */
    async solve(ciphertext) {
        const scorer = new Scorer(this.language, 4);
        const dict = LanguageAnalysis.getDictionary(this.language);
        
        let bestResult = {
            plaintext: ciphertext,
            method: 'baconian',
            confidence: 0,
            score: -Infinity,
            key: null
        };
        
        // Try A/B pattern first (most common)
        try {
            const baconian = new Dictionary.Baconian(ciphertext, true); // encoded = true
            const plaintext = baconian.decode();
            const cleanText = TextUtils.onlyLetters(plaintext);
            
            if (cleanText.length >= 10) {
                const score = scorer.score(cleanText);
                
                // Validate with dictionary
                let wordCoverage = 0;
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
                
                const combinedScore = score + (wordCoverage * 50);
                
                if (combinedScore > bestResult.score) {
                    let confidence = 0.5;
                    if (wordCoverage > 0.80) {
                        confidence = 0.98;
                    } else if (wordCoverage > 0.70) {
                        confidence = 0.95;
                    } else if (wordCoverage > 0.60) {
                        confidence = 0.90;
                    } else if (score > -3) {
                        confidence = 0.85;
                    }
                    
                    bestResult = {
                        plaintext: TextUtils.matchLayout(ciphertext, plaintext),
                        method: 'baconian',
                        confidence: confidence,
                        score: combinedScore,
                        key: null,
                        wordCoverage: wordCoverage
                    };
                }
            }
        } catch (error) {
            // Continue to try other patterns if A/B fails
        }
        
        return bestResult;
    }
}

