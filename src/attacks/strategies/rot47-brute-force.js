import { Scorer } from '../../search/scorer.js';
import { TextUtils } from '../../core/text-utils.js';
import { LanguageAnalysis } from '../../analysis/analysis.js';

/**
 * ROT47 Brute Force Solver
 * 
 * ROT shifts all printable ASCII characters (33-126), not just letters.
 * Tries all possible shifts (1-94) and stops early if high word coverage is found.
 * If no result found with primary language, tries other languages in order of probability.
 */
export class ROT47BruteForce {
    constructor(language = 'english') {
        this.language = language;
    }

    /**
     * Brute force ROT (ASCII printable characters 33-126).
     * @param {string} ciphertext - The encrypted text
     * @param {Array<string>} languageCandidates - Optional array of languages to try
     * @returns {Promise<Object>} Result with plaintext, method, confidence, score, key, etc.
     */
    async solve(ciphertext, languageCandidates = null) {
        // If language candidates provided, try each language until we find a good result
        const languagesToTry = languageCandidates || [this.language];
        
        let bestOverallResult = null;
        let bestOverallScore = -Infinity;
        
        for (const tryLanguage of languagesToTry) {
            const scorer = new Scorer(tryLanguage, 4); // Use quadgrams
            const dict = LanguageAnalysis.getDictionary(tryLanguage);
            
            let bestShift = 0;
            let bestScore = -Infinity;
            let bestPlaintext = ciphertext;
            let bestWordCoverage = 0;
            
            // ROT uses ASCII printable range (33-126), so we need to try shifts 1-94
            // Try all shifts sequentially, stopping early if we find high word coverage
            const maxShift = 94; // ASCII printable range is 94 characters (33-126)
            
            console.log(`[ROT47BruteForce] Trying ROT brute force with language: ${tryLanguage}`);
            
            for (let shift = 1; shift <= maxShift; shift++) {
                // Decrypt using ROT logic (ASCII 33-126)
                let decrypted = '';
                for (let i = 0; i < ciphertext.length; i++) {
                    const char = ciphertext[i];
                    const code = char.charCodeAt(0);
                    
                    // Only shift printable ASCII (33-126)
                    if (code >= 33 && code <= 126) {
                        // ROT: shift backwards by shift amount, wrapping at 94 characters
                        let newCode = code - shift;
                        while (newCode < 33) newCode += 94;
                        while (newCode > 126) newCode -= 94;
                        decrypted += String.fromCharCode(newCode);
                    } else {
                        decrypted += char; // Keep non-printable as-is
                    }
                }
                
                // Score the decrypted text
                const cleanText = TextUtils.onlyLetters(decrypted);
                if (cleanText.length < 10) continue; // Skip if too short
                
                const score = scorer.score(cleanText);
                
                // Dictionary validation - this is the key for early termination
                let wordCoverage = 0;
                if (dict) {
                    try {
                        const words = decrypted.toUpperCase()
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
                    } catch (error) {
                        // Dictionary access failed, continue without dictionary validation
                    }
                }
                
                // Combined score: N-gram + dictionary bonus
                const dictBonus = wordCoverage * 50;
                const combinedScore = score + dictBonus;
                
                // Update best if this is better
                if (combinedScore > bestScore || (wordCoverage > bestWordCoverage && wordCoverage > 0.7)) {
                    bestScore = combinedScore;
                    bestShift = shift;
                    bestPlaintext = decrypted;
                    bestWordCoverage = wordCoverage;
                    
                    // Early termination: if we found >70% valid words, we're done!
                    // This assumes we detected the language correctly
                    if (wordCoverage > 0.70) {
                        console.log(`[ROT47BruteForce] Early termination: ROT shift ${shift} with language ${tryLanguage} has ${(wordCoverage * 100).toFixed(0)}% valid words`);
                        break; // Stop trying other shifts for this language
                    }
                }
            }
            
            // Calculate confidence
            let confidence = 0.5;
            if (bestWordCoverage > 0.80) {
                confidence = 0.98;
            } else if (bestWordCoverage > 0.70) {
                confidence = 0.95;
            } else if (bestWordCoverage > 0.60) {
                confidence = 0.90;
            } else if (bestWordCoverage > 0.50) {
                confidence = 0.85;
            } else if (bestScore > -3) {
                confidence = 0.95;
            } else if (bestScore > -4) {
                confidence = 0.8;
            } else if (bestScore > -5) {
                confidence = 0.6;
            }
            
            // Determine method name based on shift
            let method = 'rot47';
            if (bestShift === 13) {
                method = 'rot13';
            } else if (bestShift >= 1 && bestShift <= 25) {
                method = `rot${bestShift}`;
            } else if (bestShift === 47) {
                method = 'rot47';
            } else {
                method = 'rot47'; // Generic ROT for other shifts
            }
            
            const result = {
                plaintext: bestPlaintext,
                method: method,
                confidence: confidence,
                score: bestScore,
                key: bestShift,
                wordCoverage: bestWordCoverage,
                language: tryLanguage
            };
            
            // If we found a good result (>50% word coverage), use it and stop trying other languages
            if (bestWordCoverage > 0.50 || confidence > 0.8) {
                console.log(`[ROT47BruteForce] Found good ROT result with language ${tryLanguage}: shift=${bestShift}, wordCoverage=${(bestWordCoverage * 100).toFixed(0)}%, confidence=${(confidence * 100).toFixed(0)}%`);
                return result;
            }
            
            // Keep track of best result across all languages
            if (bestScore > bestOverallScore || (bestWordCoverage > 0 && bestWordCoverage > (bestOverallResult?.wordCoverage || 0))) {
                bestOverallScore = bestScore;
                bestOverallResult = result;
            }
        }
        
        // Return best result found (even if not perfect)
        if (bestOverallResult && bestOverallResult.plaintext && bestOverallResult.plaintext !== ciphertext) {
            console.log(`[ROT47BruteForce] Returning best ROT result across languages: shift=${bestOverallResult.key}, language=${bestOverallResult.language}, wordCoverage=${(bestOverallResult.wordCoverage * 100).toFixed(0)}%`);
            return bestOverallResult;
        }
        
        // Fallback: return result even if not great
        return bestOverallResult || {
            plaintext: ciphertext,
            method: 'rot47',
            confidence: 0,
            score: -Infinity,
            key: 0,
            wordCoverage: 0
        };
    }
}

