import { default as Dictionary } from '../../ciphers/dictionary/dictionary.js';
import { Scorer } from '../../search/scorer.js';
import { TextUtils } from '../../core/text-utils.js';
import { LanguageAnalysis } from '../../analysis/analysis.js';

/**
 * Polybius Square Cipher Solver
 * 
 * Polybius encodes letters as pairs of numbers (11-55).
 * Strategy: Detect number pairs, decode with standard grid, validate with dictionary + n-grams.
 * If keyword is used, try common keywords.
 */
export class PolybiusSolver {
    constructor(language = 'english') {
        this.language = language;
        this.commonKeywords = ['', 'KEY', 'SECRET', 'CIPHER', 'CODE'];
    }

    /**
     * Solves Polybius Square cipher.
     * @param {string} ciphertext - The encrypted text
     * @returns {Promise<Object>} Result with plaintext, method, confidence, score, key, etc.
     */
    async solve(ciphertext) {
        // Check if text contains number pairs (11-55 pattern)
        const numberPairs = ciphertext.match(/\d{2}/g);
        if (!numberPairs || numberPairs.length < 5) {
            // Not likely to be Polybius
            return {
                plaintext: ciphertext,
                method: 'polybius',
                confidence: 0,
                score: -Infinity,
                key: null
            };
        }
        
        const scorer = new Scorer(this.language, 4);
        const dict = LanguageAnalysis.getDictionary(this.language);
        
        let bestResult = {
            plaintext: ciphertext,
            method: 'polybius',
            confidence: 0,
            score: -Infinity,
            key: null
        };
        
        for (const keyword of this.commonKeywords) {
            try {
                const polybius = new Dictionary.Polybius(ciphertext, keyword, true); // encoded = true
                const plaintext = polybius.decode();
                const cleanText = TextUtils.onlyLetters(plaintext);
                
                if (cleanText.length < 10) continue;
                
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
                        method: 'polybius',
                        confidence: confidence,
                        score: combinedScore,
                        key: keyword || null,
                        wordCoverage: wordCoverage
                    };
                    
                    // Early termination if we find a very good match
                    if (wordCoverage > 0.80 && score > -3) {
                        break;
                    }
                }
            } catch (error) {
                // Continue trying other keywords
                continue;
            }
        }
        
        return bestResult;
    }
}

