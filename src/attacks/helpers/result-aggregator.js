import { Scorers } from '../../language/scorers.js';
import { ShortTextPatterns } from '../../analysis/short-text-patterns.js';
import { TextUtils } from '../../core/text-utils.js';

/**
 * Result Aggregator for cryptographic analysis.
 * 
 * This module aggregates results from multiple decryption strategies and determines
 * the final cipher type based on the best performing solver.
 * 
 * Key features:
 * - Uses n-gram scoring as primary metric (more reliable than word coverage)
 * - Determines final cipher type from winning strategy
 * - Overrides initial cipher type detection if solver score is very high
 * - Provides normalized scores for comparability
 * 
 * This addresses the issue where initial cipher type detection might be wrong,
 * but a specific solver (e.g., RailFenceSolver) produces excellent results,
 * indicating the actual cipher type.
 */
export class ResultAggregator {
    /**
     * Aggregates multiple strategy results and determines the best one.
     * 
     * @param {Array<Object>} results - Array of strategy results
     * @param {string} language - Target language
     * @param {Object} options - Options
     * @param {number} options.minNgramScore - Minimum n-gram score to override cipher type (default: 0.6)
     * @param {number} options.ngramWeight - Weight for n-gram score in combined score (default: 0.7)
     * @param {number} options.dictWeight - Weight for dictionary score in combined score (default: 0.3)
     * @returns {Object} Best result with updated cipher type if applicable
     */
    static aggregate(results, language, options = {}) {
        const {
            minNgramScore = 0.6,
            ngramWeight = 0.7,
            dictWeight = 0.3
        } = options;
        
        if (!results || results.length === 0) {
            return null;
        }
        
        // Score each result
        const scoredResults = results.map(result => {
            const cleanPlaintext = TextUtils.onlyLetters(result.plaintext || '');
            
            // Get n-gram score (normalized [0, 1])
            // CRITICAL: If result already has ngramScore (from previous aggregation), use it
            // Otherwise, calculate it fresh
            let ngramScore = result.ngramScore;
            if (ngramScore === undefined || ngramScore === null) {
                if (cleanPlaintext.length > 0) {
                    try {
                        ngramScore = Scorers.scoreTextNormalized(cleanPlaintext, language, { useFallback: true });
                    } catch (err) {
                        console.warn(`[ResultAggregator] Error scoring text:`, err);
                        ngramScore = 0;
                    }
                } else {
                    ngramScore = 0;
                }
            }
            
            // Get dictionary score (0-1)
            let dictScore = result.dictScore || result.dictionaryCoverage || result.wordCoverage || result.validationScore || 0;
            
            // For short texts, supplement dictionary score with pattern matching
            if (cleanPlaintext.length < 50 && dictScore < 0.3) {
                // Use short text patterns as fallback when dictionary validation is weak
                const patternScore = ShortTextPatterns.score(result.plaintext, language);
                // Boost dictScore with pattern score if it's higher
                dictScore = Math.max(dictScore, patternScore.combinedScore * 0.7);
            }
            
            // Combined score: weighted average
            // If result already has combinedScore, use it if it's better than our calculation
            const calculatedCombinedScore = (ngramScore * ngramWeight) + (dictScore * dictWeight);
            const combinedScore = result.combinedScore !== undefined && result.combinedScore > calculatedCombinedScore 
                ? result.combinedScore 
                : calculatedCombinedScore;
            
            return {
                ...result,
                ngramScore: ngramScore,  // Always ensure ngramScore is set
                dictScore: dictScore,    // Always ensure dictScore is set
                dictionaryCoverage: dictScore,  // Alias for compatibility
                combinedScore: combinedScore
            };
        });
        
        // Sort by combined score (descending)
        scoredResults.sort((a, b) => b.combinedScore - a.combinedScore);
        
        const bestResult = scoredResults[0];
        
        // Determine final cipher type
        // If n-gram score is very high, trust the solver's implied cipher type
        const finalCipherType = this._determineFinalCipherType(
            bestResult,
            scoredResults,
            minNgramScore
        );
        
        return {
            ...bestResult,
            cipherType: finalCipherType,
            allResults: scoredResults  // Include all scored results for debugging
        };
    }
    
    /**
     * Checks if a result provides strong evidence for polyalphabetic cipher.
     * Uses adjusted thresholds based on text length.
     * 
     * @private
     */
    static _isStrongPolyalphabeticEvidence(result, textLength) {
        if (!result || !result.isPolyalphabeticCandidate) {
            return false;
        }
        
        // Extract key length
        let keyLength = 1;
        if (result.analysis && result.analysis.keyLength) {
            keyLength = result.analysis.keyLength;
        } else if (result.key && typeof result.key === 'string') {
            keyLength = result.key.length;
        } else if (result.key && typeof result.key === 'number') {
            keyLength = result.key;
        }
        
        if (keyLength < 2) {
            return false; // Never accept keyLength=1 as polyalphabetic
        }
        
        const confidence = result.confidence || 0;
        
        // CRITICAL FIX: Use ngramScore if available, otherwise use score as fallback
        // PolyalphabeticSolver returns 'score' (combined), not 'ngramScore' separately
        // ResultAggregator.aggregate() adds ngramScore, but if result comes directly from solver, use score
        let ngramScore = result.ngramScore;
        if (ngramScore === undefined || ngramScore === null) {
            // Use score as proxy (score is typically 0-1 for combined n-gram + dict)
            // If score is very high (>0.7), it's likely good n-gram score
            // If score is moderate (0.4-0.7), estimate n-gram as 70% of score (since score = 0.7*ngram + 0.3*dict)
            if (result.score !== undefined && result.score !== null && result.score > -Infinity) {
                // If score is normalized [0,1], use it directly as ngramScore estimate
                // Otherwise, if it's a raw score, we can't estimate reliably
                if (result.score >= 0 && result.score <= 1) {
                    ngramScore = result.score; // Assume score is already normalized
                } else {
                    // Raw score, can't estimate - be conservative
                    ngramScore = 0.4; // Conservative estimate
                }
            } else {
                ngramScore = 0; // No score available
            }
        }
        
        const dictCoverage = result.dictScore || result.dictionaryCoverage || result.wordCoverage || result.validationScore || 0;
        
        // RELAXED thresholds based on text length
        if (textLength >= 100) {
            // Long texts: relaxed thresholds
            return (
                confidence >= 0.50 &&      // Reduced from 0.55
                ngramScore >= 0.50 &&      // Reduced from 0.60 (much more permissive)
                dictCoverage >= 0.10       // Reduced from 0.15
            );
        } else {
            // Short/medium texts: very permissive thresholds
            return (
                confidence >= 0.45 &&      // Reduced from 0.50
                ngramScore >= 0.45 &&       // Reduced from 0.55 (much more permissive)
                dictCoverage >= 0.05        // Reduced from 0.10 (very permissive)
            );
        }
    }
    
    /**
     * Determines the final cipher type based on results using hierarchical decision logic.
     * 
     * Strategy (hierarchical):
     * 1. Check for strong polyalphabetic evidence (with adjusted thresholds)
     * 2. If not polyalphabetic, decide between monoalphabetic and transposition
     * 3. Use clear tie-breaking rules
     * 
     * @private
     */
    static _determineFinalCipherType(bestResult, allResults, minNgramScore) {
        // Get text length for threshold adjustment
        const textLength = bestResult.plaintext ? bestResult.plaintext.length : 0;
        
        // Find best results by category
        const polyResult = allResults.find(r => 
            r.method && (
                r.method.includes('vigenere') ||
                r.method.includes('polyalphabetic') ||
                r.method.includes('beaufort') ||
                r.method.includes('porta') ||
                r.method.includes('gronsfeld') ||
                r.method.includes('autokey') ||
                r.method.includes('quagmire')
            )
        );
        
        const monoResult = allResults.find(r =>
            r.method && (
                r.method.includes('hill-climbing') ||
                r.method.includes('simulated-annealing') ||
                r.method.includes('caesar') ||
                r.method.includes('atbash')
            )
        );
        
        const transResult = allResults.find(r =>
            r.isTranspositionCandidate || (r.method && (
                r.method.includes('railfence') ||
                r.method.includes('amsco') ||
                r.method.includes('columnar')
            ))
        );
        
        // 1. First, check for strong polyalphabetic evidence
        if (polyResult) {
            const isStrong = this._isStrongPolyalphabeticEvidence(polyResult, textLength);
            if (isStrong) {
                const DEBUG = process.env.NIGMAJS_DEBUG === 'true';
                if (DEBUG) {
                    console.log(`[ResultAggregator] Strong polyalphabetic evidence: method=${polyResult.method}, confidence=${polyResult.confidence}, ngramScore=${polyResult.ngramScore || polyResult.score}, dictCoverage=${polyResult.dictScore || polyResult.dictionaryCoverage || 0}`);
                }
                return 'vigenere-like';
            } else {
                const DEBUG = process.env.NIGMAJS_DEBUG === 'true';
                if (DEBUG) {
                    console.log(`[ResultAggregator] Weak polyalphabetic evidence: method=${polyResult.method}, confidence=${polyResult.confidence}, ngramScore=${polyResult.ngramScore || polyResult.score}, dictCoverage=${polyResult.dictScore || polyResult.dictionaryCoverage || 0}, isPolyCandidate=${polyResult.isPolyalphabeticCandidate}`);
                }
            }
        }
        
        // 2. Mono vs Transposition decision
        // RELAXED: Lower confidence threshold to catch more cases
        const hasGoodMono = monoResult && (monoResult.confidence || 0) >= 0.45;
        const hasGoodTrans = transResult && (transResult.confidence || 0) >= 0.45;
        
        if (hasGoodMono && hasGoodTrans) {
            // Tie-breaking: prefer transposition only if clearly better
            const monoScore = monoResult.ngramScore || monoResult.combinedScore || 0;
            const transScore = transResult.ngramScore || transResult.combinedScore || 0;
            const monoDict = monoResult.dictScore || monoResult.dictionaryCoverage || monoResult.wordCoverage || 0;
            const transDict = transResult.dictScore || transResult.dictionaryCoverage || transResult.wordCoverage || 0;
            
            const transAdvantage = (transScore - monoScore) >= 0.10; // At least 0.10 better
            const transWordsBetter = transDict >= (monoDict + 0.05); // At least 5% better dictionary coverage
            
            if (transAdvantage && transWordsBetter) {
                return 'transposition';
            }
            
            // In case of tie or small difference, prefer monoalphabetic
            return 'monoalphabetic-substitution';
        }
        
        if (hasGoodMono) {
            return 'monoalphabetic-substitution';
        }
        
        if (hasGoodTrans) {
            return 'transposition';
        }
        
        // 3. Fallback: use method-based inference if n-gram score is high OR if isTranspositionCandidate is set
        // Prioritize transposition if explicitly marked
        if (bestResult.isTranspositionCandidate) {
            return 'transposition';
        }
        
        if (bestResult.ngramScore >= minNgramScore) {
            const method = (bestResult.method || '').toLowerCase();
            
            const methodToCipherType = {
                'hill-climbing': 'monoalphabetic-substitution',
                'simulated-annealing': 'monoalphabetic-substitution',
                'caesar': 'caesar-shift',
                'atbash': 'monoalphabetic-substitution',
                'railfence': 'transposition',
                'amsco': 'transposition',
                'columnar': 'transposition',
                'polybius': 'dictionary-substitution'
            };
            
            for (const [key, type] of Object.entries(methodToCipherType)) {
                if (method.includes(key)) {
                    return type;
                }
            }
        }
        
        // 4. Final fallback: use detected type, but reject invalid vigenere-like
        const detectedType = bestResult.cipherType || bestResult.detectedType || 'unknown';
        if (detectedType === 'vigenere-like' && polyResult && !this._isStrongPolyalphabeticEvidence(polyResult, textLength)) {
            // Reject weak vigenere-like evidence
            return 'monoalphabetic-substitution';
        }
        
        return detectedType;
    }
    
    /**
     * Compares two results and returns the better one.
     * 
     * @param {Object} result1 - First result
     * @param {Object} result2 - Second result
     * @param {string} language - Target language
     * @returns {Object} Better result
     */
    static compare(result1, result2, language) {
        const clean1 = TextUtils.onlyLetters(result1.plaintext || '');
        const clean2 = TextUtils.onlyLetters(result2.plaintext || '');
        
        let score1 = 0;
        let score2 = 0;
        
        if (clean1.length > 0) {
            try {
                score1 = Scorers.scoreTextNormalized(clean1, language, { useFallback: true });
            } catch (err) {
                score1 = 0;
            }
        }
        
        if (clean2.length > 0) {
            try {
                score2 = Scorers.scoreTextNormalized(clean2, language, { useFallback: true });
            } catch (err) {
                score2 = 0;
            }
        }
        
        // Combine with dictionary scores
        const dict1 = result1.wordCoverage || result1.validationScore || 0;
        const dict2 = result2.wordCoverage || result2.validationScore || 0;
        
        const combined1 = (score1 * 0.7) + (dict1 * 0.3);
        const combined2 = (score2 * 0.7) + (dict2 * 0.3);
        
        return combined1 >= combined2 ? result1 : result2;
    }
}

