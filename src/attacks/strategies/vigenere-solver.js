import { LanguageAnalysis } from '../../analysis/analysis.js';
import { DictionaryValidator } from '../../language/dictionary-validator.js';
import { TextUtils } from '../../core/text-utils.js';
import { Scorers } from '../../language/scorers.js';
import Shift from '../../ciphers/shift/shift.js';
import { segmentText } from '../../language/word-segmenter.js';

export class VigenereSolver {
    constructor(language = 'english') {
        this.language = language;
        // Standard IoC for languages (normalized to ~1.73 for English)
        this.targetIoC = language === 'english' ? 1.73 : 1.94; // approx for others
        this.dictionaryValidator = null; // Lazy initialization
    }

    /**
     * Solves a Vigenère cipher by finding key length and then key.
     * @param {string} ciphertext 
     * @returns {Promise<Object>} { plaintext, key, confidence }
     */
    async solve(ciphertext) {
        const cleanText = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
        
        // 1. Find most probable Key Length (Friedman Test)
        const keyLengthData = this.guessKeyLength(cleanText);
        
        if (!keyLengthData.length || keyLengthData.length === 0) {
            return { plaintext: ciphertext, key: "", confidence: 0 };
        }

        // 2. Try top candidate lengths (in case first one is wrong)
        const candidates = keyLengthData.candidates || [{ length: keyLengthData.length }];
        const dict = LanguageAnalysis.getDictionary(this.language);
        
        let bestResult = null;
        let bestScore = -Infinity;
        
        // Try top 3 candidate lengths
        for (let i = 0; i < Math.min(3, candidates.length); i++) {
            const candidateLen = candidates[i].length;
            
            console.log(`[VigenereSolver] Trying key length ${candidateLen}...`);
            
            // 3. Solve for the Key (now async due to dictionary validation)
            const key = await this.findKey(cleanText, candidateLen);
            
            console.log(`[VigenereSolver] Found key: ${key} for length ${candidateLen}`);
            
            // 4. Decrypt
            const plaintext = this.decryptVigenere(ciphertext, key);
            
            // 5. Score result using advanced n-gram scoring (primary) + dictionary validation (secondary)
            const cleanPlaintext = TextUtils.onlyLetters(plaintext);
            
            // N-gram score (normalized [0, 1], higher is better)
            const ngramScore = Scorers.scoreTextNormalized(cleanPlaintext, this.language, { useFallback: true });
            
            // Dictionary validation score (0-1)
            let validationScore = 0;
            let validWords = 0;
            let totalWords = 0;
            
            if (dict) {
                const words = plaintext.toUpperCase()
                    .split(/\s+/)
                    .map(w => TextUtils.onlyLetters(w))
                    .filter(w => w.length >= 3);
                
                totalWords = words.length;
                
                if (words.length > 0) {
                    for (const word of words) {
                        if (dict.has(word)) {
                            validWords++;
                        }
                    }
                    validationScore = validWords / words.length;
                }
            }
            
            console.log(`[VigenereSolver] Key ${key}: N-gram=${ngramScore.toFixed(3)}, ValidWords=${validWords}/${totalWords} (${(validationScore * 100).toFixed(0)}%)`);
            
            // Combined score: 70% n-gram (more reliable) + 30% dictionary + 10% IoC confidence
            // All components are [0, 1], so final score is also [0, 1]
            const combinedScore = (ngramScore * 0.7) + (validationScore * 0.3) + ((keyLengthData.confidence || 0.5) * 0.1);
            
            // CRITICAL: Mark if this is a polyalphabetic candidate (keyLength > 1)
            const isPolyalphabeticCandidate = candidateLen > 1;
            
            if (combinedScore > bestScore) {
                bestScore = combinedScore;
                bestResult = {
                    plaintext: plaintext,
                    key: key,
                    confidence: Math.min(1, combinedScore),
                    analysis: { ...keyLengthData, keyLength: candidateLen },
                    validationScore: validationScore,
                    ngramScore: ngramScore,  // Add n-gram score for ResultAggregator
                    isPolyalphabeticCandidate: isPolyalphabeticCandidate,  // CRITICAL: len > 1 = polyalphabetic
                    dictionaryCoverage: validationScore  // Alias for ResultAggregator
                };
                
                // Early termination: if we found a key with >70% valid words, use it
                if (validationScore > 0.70) {
                    console.log(`[VigenereSolver] Early termination: Key ${key} has ${(validationScore * 100).toFixed(0)}% valid words`);
                    break;
                }
            }
        }

        if (bestResult) {
            console.log(`[VigenereSolver] Best result: Key=${bestResult.key}, Confidence=${bestResult.confidence.toFixed(2)}, ValidWords=${(bestResult.validationScore * 100).toFixed(0)}%`);
        } else {
            console.warn(`[VigenereSolver] No valid result found`);
        }

        return bestResult || {
            plaintext: ciphertext,
            key: "",
            confidence: 0,
            analysis: keyLengthData
        };
    }

    /**
     * Uses Friedman test (Index of Coincidence per column) to find key length.
     */
    guessKeyLength(text) {
        // Limit key length for short texts to ensure at least 4 chars per column
        const maxLen = Math.min(20, Math.max(1, Math.floor(text.length / 4)));
        const candidates = [];

        // Random text IoC is approx 1.0 (normalized). Target is ~1.73.
        // We look for the length that produces columns closest to Target.

        for (let len = 1; len <= maxLen; len++) {
            let totalIoC = 0;
            let minColumnIoC = Infinity;
            let maxColumnIoC = -Infinity;
            
            // Analyze columns
            for (let col = 0; col < len; col++) {
                const columnText = this.getColumn(text, len, col);
                if (columnText.length < 3) continue; // Skip if column too short
                const colIoC = LanguageAnalysis.calculateIoC(columnText);
                totalIoC += colIoC;
                minColumnIoC = Math.min(minColumnIoC, colIoC);
                maxColumnIoC = Math.max(maxColumnIoC, colIoC);
            }
            
            const avgIoC = totalIoC / len;
            
            // Calculate distance to target (e.g. English 1.73)
            const diff = Math.abs(avgIoC - this.targetIoC);
            
            // Also consider consistency: columns should have similar IoC (low variance)
            const variance = maxColumnIoC - minColumnIoC;
            
            candidates.push({
                length: len,
                avgIoC: avgIoC,
                diff: diff,
                variance: variance,
                score: diff + (variance * 0.5) // Lower is better
            });
        }

        // Sort by score (lower is better)
        candidates.sort((a, b) => a.score - b.score);
        
        // CRITICAL: Prefer candidates with len > 1 (polyalphabetic) over len=1 (monoalphabetic)
        // This ensures keyLength=1 is never selected as evidence for polyalphabetic ciphers
        function selectBestKeyLength(candidates) {
            // 1. First, try to find the best candidate with len > 1
            const nonTrivial = candidates.filter(c => c.length > 1);
            if (nonTrivial.length > 0) {
                // Find best among non-trivial (len > 1)
                let best = nonTrivial[0];
                for (let i = 1; i < nonTrivial.length && i < 5; i++) {
                    const candidate = nonTrivial[i];
                    // Prefer shorter key if scores are very similar (within 5%)
                    const scoreVerySimilar = candidate.score <= best.score * 1.05;
                    const isMultiple = best.length > candidate.length && 
                                      (best.length % candidate.length === 0);
                    const scoreSimilarForMultiple = isMultiple && candidate.score <= best.score * 1.10;
                    
                    if (candidate.length < best.length && (scoreVerySimilar || scoreSimilarForMultiple)) {
                        best = candidate;
                    } else if (candidate.score < best.score) {
                        // If score is significantly better, prefer it even if longer
                        best = candidate;
                    }
                }
                return best;
            }
            
            // 2. Only if NO candidate with len > 1 exists, return the best overall (may be len=1)
            // This will be marked as non-polyalphabetic later
            return candidates[0];
        }
        
        const bestCandidate = selectBestKeyLength(candidates);
        
        console.log(`[VigenereSolver] Key length candidates:`, candidates.slice(0, 3).map(c => 
            `len=${c.length}, score=${c.score.toFixed(3)}, IoC=${c.avgIoC.toFixed(2)}, variance=${c.variance.toFixed(2)}`
        ));
        console.log(`[VigenereSolver] Selected key length: ${bestCandidate.length} (best score: ${bestCandidate.score.toFixed(3)})`);

        // Confidence: How close is the IoC to English?
        // 1.0 = Random, 1.73 = English. Map this range to 0-1.
        let confidence = (bestCandidate.avgIoC - 1.0) / (this.targetIoC - 1.0);
        confidence = Math.min(Math.max(confidence, 0), 1);

        return { 
            length: bestCandidate.length, 
            avgIoC: bestCandidate.avgIoC, 
            confidence: confidence,
            candidates: candidates.slice(0, 3) // Return top 3 for debugging
        };
    }

    /**
     * Scores text using chi-squared AND dictionary validation (hybrid scoring).
     * @private
     * @param {string} text - Text to score
     * @param {Object} langData - Language frequency data
     * @returns {Promise<number>} Combined score (lower is better for chi-squared, higher is better for dict)
     */
    async _scoreWithDictionary(text, langData) {
        // Calculate chi-squared (lower is better)
        const freqs = LanguageAnalysis.getLetterFrequencies(text);
        const chiSquared = LanguageAnalysis.calculateChiSquared(freqs, langData);
        
        // Try to get dictionary score (if available)
        let dictScore = 0;
        try {
            if (!this.dictionaryValidator) {
                this.dictionaryValidator = new DictionaryValidator(this.language);
            }
            
            // Check if dictionary is loaded (non-blocking)
            const dict = LanguageAnalysis.getDictionary(this.language);
            if (dict) {
                // Check if original text has spaces
                const hasSpacesInOriginal = /\s/.test(text);
                
                // Extract words from text and check against dictionary
                let words = text.split(/\s+/)
                    .map(w => TextUtils.onlyLetters(w))
                    .filter(w => w.length >= 3);
                
                // Only use word segmentation if original text has NO spaces
                if (!hasSpacesInOriginal && words.length > 0 && words[0].length > 10) {
                    try {
                        const cleanText = TextUtils.onlyLetters(text);
                        const segmented = segmentText(cleanText, dict, { maxWordLength: 20, minWordLength: 2 });
                        if (segmented && segmented !== cleanText) {
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
                        if (dict.has(word.toUpperCase())) {
                            validWords++;
                        }
                    }
                    // Dictionary score: percentage of valid words (0-1, higher is better)
                    // Convert to penalty reduction: if 80% valid, reduce chi-squared by 80% of max
                    const wordCoverage = validWords / words.length;
                    // Apply bonus: reduce chi-squared by up to 30% if words are valid
                    dictScore = wordCoverage * 0.3;
                }
            }
        } catch (error) {
            // Dictionary not available, continue with chi-squared only
            // console.debug('[VigenereSolver] Dictionary validation skipped:', error.message);
        }
        
        // Combined score: chi-squared minus dictionary bonus
        // Lower is better, so we subtract the dictionary bonus
        return chiSquared - (chiSquared * dictScore);
    }

    /**
     * Recovers the key for a given length using Frequency Analysis per column.
     * Now with optional dictionary validation for better accuracy.
     */
    async findKey(text, keyLen) {
        let key = "";
        const langData = LanguageAnalysis.languages[this.language].monograms;

        for (let col = 0; col < keyLen; col++) {
            const columnText = this.getColumn(text, keyLen, col);
            
            if (columnText.length < 3) {
                // Column too short, use A as default
                key += 'A';
                continue;
            }
            
            // This column is essentially a Caesar shift. Find the best shift.
            let bestShift = 0;
            let minScore = Infinity;
            let bestBigramScore = -Infinity;

            // Common English bigrams for validation (ordered by frequency)
            const commonBigrams = ['TH', 'HE', 'IN', 'ER', 'AN', 'RE', 'ED', 'ND', 'ON', 'EN', 'AT', 'OU', 'IT', 'IS', 'OR', 'TI', 'AS', 'TO', 'OF', 'TE', 'ET', 'NG', 'AL', 'ST', 'LE', 'AR', 'SE', 'NE', 'VE', 'RA'];
            
            for (let shift = 0; shift < 26; shift++) {
                // Shift the column (decrypt attempt)
                // Note: shift is the key letter value (0=A, 1=B, ..., 25=Z)
                // To decrypt, we shift backwards by the key value
                const shiftedText = this.shiftText(columnText, -shift);
                
                // Calculate chi-squared for this column
                const freqs = LanguageAnalysis.getLetterFrequencies(shiftedText);
                const chiSquared = LanguageAnalysis.calculateChiSquared(freqs, langData);
                
                // Check for common bigrams (helps validate column decryption)
                let bigramScore = 0;
                let totalBigrams = 0;
                for (let i = 0; i < shiftedText.length - 1; i++) {
                    const bigram = shiftedText.substring(i, i + 2);
                    totalBigrams++;
                    // Weight by position in common list (earlier = more common)
                    const bigramIndex = commonBigrams.indexOf(bigram);
                    if (bigramIndex !== -1) {
                        // More common bigrams get higher score
                        bigramScore += (commonBigrams.length - bigramIndex) / commonBigrams.length;
                    }
                }
                // Normalize bigram score (0-1)
                const normalizedBigramScore = totalBigrams > 0 ? bigramScore / totalBigrams : 0;
                
                // Combined score: lower chi-squared is better, higher bigram score is better
                // Bigram score can reduce chi-squared by up to 40%
                const adjustedScore = chiSquared * (1 - normalizedBigramScore * 0.4);

                // Prefer shifts with high bigram scores or low chi-squared
                if (adjustedScore < minScore || (normalizedBigramScore > bestBigramScore + 0.05 && normalizedBigramScore > 0.15)) {
                    minScore = adjustedScore;
                    bestShift = shift;
                    bestBigramScore = normalizedBigramScore;
                }
            }

            // Convert shift to char (0 = A, 1 = B...)
            // The shift that decrypts correctly IS the key letter
            key += String.fromCharCode(65 + bestShift);
        }

        return key;
    }

    /**
     * Extracts every Nth character starting at offset.
     */
    getColumn(text, period, offset) {
        let result = "";
        for (let i = offset; i < text.length; i += period) {
            result += text[i];
        }
        return result;
    }

    shiftText(text, shift) {
        let result = "";
        for (let i = 0; i < text.length; i++) {
            let code = text.charCodeAt(i) - 65;
            let newCode = (code + shift) % 26;
            if (newCode < 0) newCode += 26;
            result += String.fromCharCode(newCode + 65);
        }
        return result;
    }

    decryptVigenere(originalText, keyword) {
        let result = "";
        let keyIndex = 0;
        const cleanKey = keyword.toUpperCase().replace(/[^A-Z]/g, '');
        
        if (cleanKey.length === 0) return originalText;

        for (let i = 0; i < originalText.length; i++) {
            const char = originalText[i];
            
            if (char.match(/[a-zA-Z]/)) {
                const isUpper = char === char.toUpperCase();
                const base = isUpper ? 65 : 97;
                const charCode = char.toUpperCase().charCodeAt(0) - 65;
                
                const keyChar = cleanKey[keyIndex % cleanKey.length];
                const keyCode = keyChar.charCodeAt(0) - 65;
                
                // Decrypt: (Cipher - Key) mod 26
                let decoded = (charCode - keyCode) % 26;
                if (decoded < 0) decoded += 26;
                
                result += String.fromCharCode(decoded + base);
                keyIndex++;
            } else {
                result += char;
            }
        }
        return result;
    }
}

