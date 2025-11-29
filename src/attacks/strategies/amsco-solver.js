import Columnar from '../../ciphers/columnar/columnar.js';
import { Scorers } from '../../language/scorers.js';
import { TextUtils } from '../../core/text-utils.js';
import { LanguageAnalysis } from '../../analysis/analysis.js';

/**
 * Amsco Cipher Solver
 * 
 * Amsco is a columnar transposition cipher with incomplete columns.
 * Strategy: Try common key patterns (sequential numbers 1-n) and validate with dictionary + n-grams.
 */
export class AmscoSolver {
    constructor(language = 'english') {
        this.language = language;
        // Generate common Amsco keys (sequential numbers 1-n, permuted)
        // Keys must contain sequential numbers 1-n, so '123', '132', '213', '231', '312', '321' are valid for length 3
        this.commonKeys = this._generateCommonKeys();
    }

    /**
     * Generates common Amsco keys.
     * Amsco keys must contain sequential numbers 1-n (e.g., '123', '132', '213', etc.)
     * @private
     * @returns {Array<string>} Array of valid Amsco keys
     */
    _generateCommonKeys() {
        const keys = [];
        
        // Generate keys for lengths 2-5 (most common)
        for (let len = 2; len <= 5; len++) {
            // Generate base sequence (1, 2, 3, ..., len)
            const base = Array.from({ length: len }, (_, i) => i + 1);
            
            // Generate permutations (but limit to most common ones to avoid too many combinations)
            // For length 2: '12', '21'
            // For length 3: '123', '132', '213', '231', '312', '321'
            // For length 4: Common permutations only
            // For length 5: Common permutations only
            
            if (len === 2) {
                keys.push('12', '21');
            } else if (len === 3) {
                keys.push('123', '132', '213', '231', '312', '321');
            } else if (len === 4) {
                // Most common 4-length keys
                keys.push('1234', '1243', '1324', '1342', '1423', '1432',
                          '2134', '2143', '2314', '2341', '2413', '2431',
                          '3124', '3142', '3214', '3241', '3412', '3421',
                          '4123', '4132', '4213', '4231', '4312', '4321');
            } else if (len === 5) {
                // Most common 5-length keys (limit to first 20 permutations)
                const perms = this._permute(base);
                keys.push(...perms.slice(0, 20));
            }
        }
        
        return keys;
    }

    /**
     * Generates all permutations of an array (for generating Amsco keys).
     * @private
     * @param {Array<number>} arr - Array to permute
     * @returns {Array<string>} Array of permuted strings
     */
    _permute(arr) {
        if (arr.length <= 1) return [arr.join('')];
        
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const perms = this._permute(rest);
            for (const perm of perms) {
                result.push(arr[i] + perm);
            }
        }
        return result;
    }

    /**
     * Solves Amsco cipher.
     * @param {string} ciphertext - The encrypted text
     * @returns {Promise<Object>} Result with plaintext, method, confidence, score, key, etc.
     */
    async solve(ciphertext) {
        const dict = LanguageAnalysis.getDictionary(this.language);
        
        let bestResult = {
            plaintext: ciphertext,
            method: 'amsco',
            confidence: 0,
            score: -Infinity,
            key: null,
            isTranspositionCandidate: true  // Mark as transposition
        };
        
        for (const key of this.commonKeys) {
            try {
                const amsco = new Columnar.Amsco(ciphertext, key, true); // encoded = true
                const plaintext = amsco.decode();
                const cleanText = TextUtils.onlyLetters(plaintext);
                
                if (cleanText.length < 10) continue;
                
                // Use normalized n-gram score (consistent with other solvers)
                const ngramScore = Scorers.scoreTextNormalized(cleanText, this.language, { useFallback: true });
                
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
                
                // Combined score: n-gram (70%) + dictionary (30%)
                const combinedScore = (ngramScore * 0.7) + (wordCoverage * 0.3);
                
                if (combinedScore > bestResult.score) {
                    let confidence = 0.5;
                    if (wordCoverage > 0.80) {
                        confidence = 0.98;
                    } else if (wordCoverage > 0.70) {
                        confidence = 0.95;
                    } else if (wordCoverage > 0.60) {
                        confidence = 0.90;
                    } else if (ngramScore > 0.70) {
                        confidence = 0.85;
                    } else if (ngramScore > 0.60) {
                        confidence = 0.75;
                    } else if (ngramScore > 0.50) {
                        confidence = 0.65;
                    }
                    
                    bestResult = {
                        plaintext: TextUtils.matchLayout(ciphertext, plaintext),
                        method: 'amsco',
                        confidence: confidence,
                        score: combinedScore,
                        ngramScore: ngramScore,  // Add ngramScore for ResultAggregator
                        key: key,
                        wordCoverage: wordCoverage,
                        dictionaryCoverage: wordCoverage,  // Alias for ResultAggregator
                        isTranspositionCandidate: true
                    };
                    
                    // Early termination if we find a very good match
                    if (wordCoverage > 0.80 && ngramScore > 0.70) {
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

