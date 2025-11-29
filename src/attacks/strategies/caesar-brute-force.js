import { Scorer } from '../../search/scorer.js';
import { TextUtils } from '../../core/text-utils.js';
import { LanguageAnalysis } from '../../analysis/analysis.js';
import { segmentText } from '../../language/word-segmenter.js';

/**
 * Caesar Cipher Brute Force Solver
 * 
 * Tries all 26 shifts and validates with dictionary for early termination.
 */
export class CaesarBruteForce {
    constructor(language = 'english') {
        this.language = language;
    }

    /**
     * Brute force attack for Caesar shift (including ROT13).
     * @param {string} ciphertext - The encrypted text
     * @returns {Promise<Object>} Result with plaintext, method, confidence, score, key, etc.
     */
    async solve(ciphertext) {
        const cleaned = TextUtils.onlyLetters(ciphertext);
        const scorer = new Scorer(this.language, 4); // Use quadgrams
        
        let bestShift = 0;
        let bestScore = -Infinity;
        let bestPlaintext = '';
        let bestWordCoverage = 0;
        
        // Get dictionary for validation
        const dict = LanguageAnalysis.getDictionary(this.language);
        const hasDictionary = dict !== null;
        
        // Try all 26 shifts (1-26, where shift 0 = no shift)
        for (let shift = 1; shift <= 26; shift++) {
            let decrypted = '';
            for (const char of cleaned) {
                const charCode = char.charCodeAt(0);
                const shifted = ((charCode - 65 - shift + 26) % 26) + 65;
                decrypted += String.fromCharCode(shifted);
            }
            
            // Calculate N-gram score
            const score = scorer.score(decrypted);
            
            // Validate with dictionary if available
            let wordCoverage = 0;
            if (hasDictionary && dict) {
                try {
                    // Extract words from decrypted text
                    const fullDecrypted = TextUtils.matchLayout(ciphertext, decrypted);
                    const hasSpacesInOriginal = /\s/.test(fullDecrypted);
                    let words = fullDecrypted.toUpperCase()
                        .split(/\s+/)
                        .map(w => TextUtils.onlyLetters(w))
                        .filter(w => w.length >= 3); // Only consider words >= 3 chars
                    
                    // Only use word segmentation if original text has NO spaces
                    if (!hasSpacesInOriginal && words.length > 0 && words[0].length > 10) {
                        try {
                            const segmented = segmentText(decrypted, dict, { maxWordLength: 20, minWordLength: 2 });
                            if (segmented && segmented !== decrypted) {
                                words = segmented.toUpperCase()
                                    .split(/\s+/)
                                    .map(w => TextUtils.onlyLetters(w))
                                    .filter(w => w.length >= 3);
                            }
                        } catch (segError) {
                            // Segmentation failed, continue with original words
                        }
                    }
                    
                    if (words.length > 0) {
                        let validWords = 0;
                        for (const word of words) {
                            if (dict.has && dict.has(word)) {
                                validWords++;
                            }
                        }
                        wordCoverage = validWords / words.length; // 0-1, percentage of valid words
                    }
                } catch (error) {
                    // Dictionary access failed, continue without dictionary validation
                    console.warn('[CaesarBruteForce] Dictionary validation error:', error);
                }
            }
            
            // Combined score: N-gram score + dictionary bonus
            // If dictionary coverage is high, add significant bonus
            const dictBonus = wordCoverage * 50; // Up to 50 points bonus
            const combinedScore = score + dictBonus;
            
            // Update best if this is better
            if (combinedScore > bestScore || (wordCoverage > bestWordCoverage && wordCoverage > 0.7)) {
                bestScore = combinedScore;
                bestShift = shift;
                bestPlaintext = decrypted;
                bestWordCoverage = wordCoverage;
                
                // Early termination: if we found a shift with >70% valid words, stop
                // This means we've likely found the correct shift
                if (wordCoverage > 0.70) {
                    console.log(`[CaesarBruteForce] Early termination: Shift ${shift} has ${(wordCoverage * 100).toFixed(0)}% valid words`);
                    break;
                }
            }
        }
        
        // Calculate confidence based on score and dictionary validation
        let confidence = 0.5;
        
        // High dictionary coverage = high confidence
        if (bestWordCoverage > 0.80) {
            confidence = 0.98;
        } else if (bestWordCoverage > 0.70) {
            confidence = 0.95;
        } else if (bestWordCoverage > 0.60) {
            confidence = 0.90;
        } else if (bestWordCoverage > 0.50) {
            confidence = 0.85;
        } else {
            // Fall back to N-gram score if dictionary validation is low
            // Good quadgram scores are typically > -3 for English
            if (bestScore > -3) {
                confidence = 0.95;
            } else if (bestScore > -4) {
                confidence = 0.8;
            } else if (bestScore > -5) {
                confidence = 0.6;
            }
        }
        
        return {
            plaintext: TextUtils.matchLayout(ciphertext, bestPlaintext),
            method: bestShift === 13 ? 'rot13' : 'caesar-shift',
            confidence: confidence,
            score: bestScore,
            key: bestShift,
            wordCoverage: bestWordCoverage // Include for debugging
        };
    }
}

