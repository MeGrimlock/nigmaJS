import { Scorer } from '../../search/scorer.js';
import { TextUtils } from '../../core/text-utils.js';
import { LanguageAnalysis } from '../../analysis/analysis-core.js';
import { AdaptiveFrequencyAnalysis } from '../../analysis/adaptive-frequency-analysis.js';
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
        // Handle null/undefined input
        if (!ciphertext) {
            return {
                plaintext: '',
                method: 'caesar-brute-force',
                confidence: 0,
                score: -Infinity,
                key: 0,
                wordCoverage: 0
            };
        }

        // Handle empty input
        if (ciphertext.length === 0) {
            return {
                plaintext: '',
                method: 'caesar-brute-force',
                confidence: 0,
                score: -Infinity,
                key: 0,
                wordCoverage: 0
            };
        }

        const cleaned = TextUtils.onlyLetters(ciphertext);

        // Check if original text has spaces (for word segmentation decision)
        const hasSpacesInOriginal = ciphertext.includes(' ');

        // Handle text with no letters
        if (cleaned.length === 0) {
            return {
                plaintext: ciphertext,
                method: 'caesar-brute-force',
                confidence: 0,
                score: -Infinity,
                key: 0,
                wordCoverage: 0
            };
        }

        let scorer;
        try {
            scorer = new Scorer(this.language, 4); // Use quadgrams
        } catch (error) {
            // Fallback to English if language not supported
            try {
                scorer = new Scorer('english', 4);
            } catch (fallbackError) {
                // If even English fails, return error result
                return {
                    plaintext: ciphertext,
                    method: 'caesar-brute-force',
                    confidence: 0,
                    score: -Infinity,
                    key: 0,
                    wordCoverage: 0,
                    error: 'Language model not available'
                };
            }
        }
        
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
            for (const char of ciphertext) {
                const charCode = char.charCodeAt(0);
                // Only shift letters, keep other characters as-is
                if (char >= 'A' && char <= 'Z') {
                    const shifted = ((charCode - 65 - shift + 26) % 26) + 65;
                    decrypted += String.fromCharCode(shifted);
                } else if (char >= 'a' && char <= 'z') {
                    const shifted = ((charCode - 97 - shift + 26) % 26) + 97;
                    decrypted += String.fromCharCode(shifted);
                } else {
                    decrypted += char; // Keep spaces, punctuation, numbers
                }
            }
            
            // Calculate N-gram score on letters only
            const decryptedLetters = TextUtils.onlyLetters(decrypted);
            const score = scorer.score(decryptedLetters);

            // Validate with dictionary if available
            let wordCoverage = 0;
            if (hasDictionary && dict) {
                try {
                    // Extract words from decrypted text
                    let words = decrypted.toUpperCase()
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
            
            // Adaptive Frequency Analysis validation (our latest tool)
            let adaptiveBonus = 0;
            try {
                const adaptiveAnalysis = AdaptiveFrequencyAnalysis.analyze(decryptedLetters, this.language);
                // For Caesar cipher, we expect monoalphabetic patterns
                if (adaptiveAnalysis.family === 'monoalphabetic-substitution') {
                    adaptiveBonus = 20; // 20 points bonus for confirmed monoalphabetic
                } else if (adaptiveAnalysis.isPolyalphabetic) {
                    adaptiveBonus = -30; // 30 points penalty for incorrectly detected polyalphabetic
                }
            } catch (error) {
                // Adaptive analysis failed, continue without bonus
            }

            // Combined score: N-gram score + dictionary bonus + adaptive bonus
            // If dictionary coverage is high, add significant bonus
            const dictBonus = wordCoverage * 50; // Up to 50 points bonus
            const combinedScore = score + dictBonus + adaptiveBonus;
            
            // Update best if this is better
            if (combinedScore > bestScore || (wordCoverage > bestWordCoverage && wordCoverage > 0.7)) {
                bestScore = combinedScore;
                bestShift = shift;
                bestPlaintext = decrypted;
                bestWordCoverage = wordCoverage;
                
                // Early termination: if we found a shift with >70% valid words, stop
                // This means we've likely found the correct shift
                if (wordCoverage > 0.70) {
                    // Early termination: found good match
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
            plaintext: bestPlaintext,
            method: 'caesar-brute-force',
            confidence: confidence,
            score: bestScore,
            key: bestShift,
            wordCoverage: bestWordCoverage // Include for debugging
        };
    }
}

