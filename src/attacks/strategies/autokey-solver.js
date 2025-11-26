import { default as Dictionary } from '../../ciphers/dictionary/dictionary.js';
import { Scorer } from '../../search/scorer.js';
import { TextUtils } from '../../core/text-utils.js';
import { LanguageAnalysis } from '../../analysis/analysis.js';

/**
 * Autokey Cipher Solver
 * 
 * Autokey is a polyalphabetic cipher where the key is generated from the plaintext itself.
 * Strategy: Try common short keys and validate with dictionary + n-grams.
 */
export class AutokeySolver {
    constructor(language = 'english') {
        this.language = language;
        this.commonKeys = ['THE', 'AND', 'KEY', 'SECRET', 'MESSAGE', 'A', 'I'];
    }

    /**
     * Solves Autokey cipher.
     * @param {string} ciphertext - The encrypted text
     * @returns {Promise<Object>} Result with plaintext, method, confidence, score, key, etc.
     */
    async solve(ciphertext) {
        const scorer = new Scorer(this.language, 4);
        const dict = LanguageAnalysis.getDictionary(this.language);
        
        let bestResult = {
            plaintext: ciphertext,
            method: 'autokey',
            confidence: 0,
            score: -Infinity,
            key: null
        };
        
        for (const key of this.commonKeys) {
            try {
                const autokey = new Dictionary.Autokey(ciphertext, key, true); // encoded = true
                const plaintext = autokey.decode();
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
                
                // Combined score: n-gram + dictionary bonus
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
                        method: 'autokey',
                        confidence: confidence,
                        score: combinedScore,
                        key: key,
                        wordCoverage: wordCoverage
                    };
                    
                    // Early termination if we find a very good match
                    if (wordCoverage > 0.80 && score > -3) {
                        break;
                    }
                }
            } catch (error) {
                // Continue trying other keys
                continue;
            }
        }
        
        return bestResult;
    }
}

