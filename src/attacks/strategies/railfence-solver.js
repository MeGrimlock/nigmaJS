import Columnar from '../../ciphers/columnar/columnar.js';
import { Scorers } from '../../language/scorers.js';
import { TextUtils } from '../../core/text-utils.js';
import { LanguageAnalysis } from '../../analysis/analysis-core.js';
import { AdaptiveFrequencyAnalysis } from '../../analysis/adaptive-frequency-analysis.js';

/**
 * Rail Fence Cipher Solver
 * 
 * Rail Fence is a transposition cipher that writes the message in a zigzag pattern.
 * Strategy: Try different numbers of rails (2-10) and validate with dictionary + n-grams.
 */
export class RailFenceSolver {
    constructor(language = 'english') {
        this.language = language;
        // Try common rail counts (2-10, with emphasis on 2-5 which are most common)
        this.railCounts = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    }

    /**
     * Solves Rail Fence cipher.
     * @param {string} ciphertext - The encrypted text
     * @returns {Promise<Object>} Result with plaintext, method, confidence, score, rails, etc.
     */
    async solve(ciphertext) {
        // Handle null/undefined input
        if (!ciphertext) {
            return {
                plaintext: ciphertext,
                method: 'railfence',
                confidence: 0,
                score: -Infinity,
                rails: null,
                isTranspositionCandidate: true
            };
        }

        const dict = LanguageAnalysis.getDictionary(this.language);
        
        let bestResult = {
            plaintext: ciphertext,
            method: 'railfence',
            confidence: 0,
            score: -Infinity,
            rails: null,
            isTranspositionCandidate: true  // Mark as transposition
        };
        
        for (const rails of this.railCounts) {
            try {
                const railFence = new Columnar.RailFence(ciphertext, rails, true); // encoded = true
                const plaintext = railFence.decode();
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
                
                // Adaptive Frequency Analysis validation (our latest tool)
                let adaptiveBonus = 0;
                try {
                    const adaptiveAnalysis = AdaptiveFrequencyAnalysis.analyze(cleanText, this.language);
                    // For Rail Fence (transposition), patterns can vary, but penalize clear monoalphabetic
                    if (adaptiveAnalysis.family === 'monoalphabetic-substitution') {
                        adaptiveBonus = -0.2; // Slight penalty for monoalphabetic (unexpected for transposition)
                    }
                    // Transposition ciphers can show various patterns, no strong bonus/penalty
                } catch (error) {
                    // Adaptive analysis failed, continue without bonus
                }

                // Combined score: n-gram (70%) + dictionary (30%) + adaptive bonus
                const combinedScore = (ngramScore * 0.7) + (wordCoverage * 0.3) + adaptiveBonus;
                
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
                        method: 'railfence',
                        confidence: confidence,
                        score: combinedScore,
                        ngramScore: ngramScore,  // Add ngramScore for ResultAggregator
                        rails: rails,
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
                // Continue trying other rail counts
                continue;
            }
        }
        
        return bestResult;
    }
}

