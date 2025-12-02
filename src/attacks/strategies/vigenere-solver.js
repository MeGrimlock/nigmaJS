import { LanguageAnalysis } from '../../analysis/analysis-core.js';
import { DictionaryValidator } from '../../language/dictionary-validator.js';
import { TextUtils } from '../../core/text-utils.js';
import { Scorers } from '../../language/scorers.js';
import { AdvancedPeriodicAnalysis } from '../../analysis/advanced-periodic-analysis.js';
import { AdaptiveFrequencyAnalysis } from '../../analysis/adaptive-frequency-analysis.js';
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

        // 1. Advanced Key Length Detection using multiple methods
        let keyLengthData = null;

        // First try Advanced Periodic Analysis (our latest tool)
        try {
            const periodicAnalysis = AdvancedPeriodicAnalysis.analyze(cleanText, {
                maxPeriod: Math.min(25, Math.floor(cleanText.length / 3)),
                maxShift: Math.min(25, cleanText.length - 5)
            });

            if (periodicAnalysis.recommendation === 'likely_polyalphabetic' && periodicAnalysis.periodCandidates.length > 0) {
                // Use advanced analysis results
                const topCandidate = periodicAnalysis.periodCandidates[0];
                keyLengthData = {
                    length: topCandidate.period,
                    confidence: periodicAnalysis.confidence,
                    candidates: periodicAnalysis.periodCandidates.map(c => ({ length: c.period, score: c.score })),
                    method: 'advanced_periodic'
                };
            }
        } catch (error) {
            console.warn('[VigenereSolver] Advanced periodic analysis failed:', error.message);
        }

        // Fallback to traditional Friedman test if advanced analysis failed
        if (!keyLengthData) {
            keyLengthData = this.guessKeyLength(cleanText);
            keyLengthData.method = 'friedman_fallback';
        }

        if (!keyLengthData.length || keyLengthData.length === 0) {
            return { plaintext: ciphertext, key: "", confidence: 0, method: 'vigenere' };
        }

        // 2. Try top candidate lengths (in case first one is wrong)
        const candidates = keyLengthData.candidates || [{ length: keyLengthData.length }];
        const dict = LanguageAnalysis.getDictionary(this.language);
        
        let bestResult = null;
        let bestScore = -Infinity;
        
        // Try top 3 candidate lengths
        let candidatesResults = [];
        for (let i = 0; i < Math.min(3, candidates.length); i++) {
            const candidateLen = candidates[i].length;

            // Trying key length

            // 3. Solve for the Key (now async due to dictionary validation)
            const key = await this.findKey(cleanText, candidateLen);

            // Found candidate key

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

            // Evaluating key

            // Load scoring weights from config
            const config = this.config || { vigenere_solver: { scoring: {
                ngram_weight: 0.6,
                dictionary_weight: 0.3,
                adaptive_weight: 0.1
            }}};

            const scoringConfig = config.vigenere_solver?.scoring || {};
            const ngramWeight = scoringConfig.ngram_weight || 0.6;
            const dictWeight = scoringConfig.dictionary_weight || 0.3;
            const adaptiveWeight = scoringConfig.adaptive_weight || 0.1;
            const iocWeight = (keyLengthData.confidence || 0.5) * 0.1;

            // Adaptive Frequency Analysis validation (our latest tool)
            let adaptiveScore = 0;
            try {
                const adaptiveAnalysis = AdaptiveFrequencyAnalysis.analyze(cleanPlaintext, this.language);
                adaptiveScore = adaptiveAnalysis.score || 0;

                // Boost if analysis confirms this is a polyalphabetic cipher
                if (adaptiveAnalysis.isPolyalphabetic) {
                    adaptiveScore *= 1.2; // 20% boost for confirmed polyalphabetic
                }
            } catch (error) {
                console.warn('[VigenereSolver] Adaptive frequency analysis failed:', error.message);
            }

            // Calculate combined score using configured weights
            let combinedScore = (ngramScore * ngramWeight) +
                               (validationScore * dictWeight) +
                               (adaptiveScore * adaptiveWeight) +
                               iocWeight;

            // Store result for cross-validation
            candidatesResults.push({
                keyLength: candidateLen,
                key: key,
                plaintext: plaintext,
                cleanPlaintext: cleanPlaintext,
                ngramScore: ngramScore,
                validationScore: validationScore,
                adaptiveScore: adaptiveScore,
                combinedScore: combinedScore
            });
        }

        // Cross-validation: prefer results that are consistent across key lengths
        // For polyalphabetic ciphers, longer keys should generally score better
        let bestCrossValidatedResult = null;
        let bestCrossValidatedScore = -Infinity;

        for (const result of candidatesResults) {
            let crossValidatedScore = result.combinedScore;

            // Boost polyalphabetic results (keyLength > 1)
            if (result.keyLength > 1) {
                crossValidatedScore *= 1.1;
            }

            // Additional boost for results with good dictionary validation
            if (result.validationScore > 0.3) {
                crossValidatedScore *= 1.05;
            }

            if (crossValidatedScore > bestCrossValidatedScore) {
                bestCrossValidatedScore = crossValidatedScore;
                bestCrossValidatedResult = result;
            }
        }

        // Use the best cross-validated result
        const result = bestCrossValidatedResult;

        // Early termination check: if we have a very good result, use it
        if (bestCrossValidatedResult && bestCrossValidatedResult.validationScore > 0.70) {
            // Excellent result found, return immediately
        }

        if (bestCrossValidatedResult) {
            // Apply final confidence adjustments
            let finalConfidence = Math.min(1, bestCrossValidatedResult.combinedScore);

            // Boost confidence for excellent results
            if (bestCrossValidatedResult.ngramScore > 0.75 && bestCrossValidatedResult.validationScore > 0.3) {
                finalConfidence = Math.min(1, finalConfidence * 1.3);
            }

            // Mark as polyalphabetic candidate
            const isPolyalphabeticCandidate = bestCrossValidatedResult.keyLength > 1;

            return {
                plaintext: bestCrossValidatedResult.plaintext,
                key: bestCrossValidatedResult.key,
                confidence: finalConfidence,
                score: bestCrossValidatedResult.combinedScore,
                method: 'vigenere',
                analysis: { ...keyLengthData, keyLength: bestCrossValidatedResult.keyLength },
                validationScore: bestCrossValidatedResult.validationScore,
                ngramScore: bestCrossValidatedResult.ngramScore,
                isPolyalphabeticCandidate: isPolyalphabeticCandidate,
                dictionaryCoverage: bestCrossValidatedResult.validationScore
            };
        } else {
            console.warn(`[VigenereSolver] No valid result found`);
            // For empty or invalid inputs, return exactly 0 confidence
            return {
                plaintext: ciphertext,
                key: "",
                confidence: 0,
                score: -Infinity,
                method: 'vigenere',
                analysis: keyLengthData
            };
        }
    }

    /**
     * Uses Friedman test (Index of Coincidence per column) to find key length.
     */
    guessKeyLength(text) {
        // For very short texts, return empty result
        if (text.length < 10) {
            return { length: 0, confidence: 0, candidates: [] };
        }

        // Limit key length for short texts to ensure at least 4 chars per column
        const maxLen = Math.min(20, Math.max(2, Math.floor(text.length / 4))); // Changed min to 2
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
                // Special handling for common key lengths (2, 3, 4, 5)
                const commonLengths = [3, 2, 4, 5, 6]; // Prefer 3, then 2, etc.
                for (const preferredLen of commonLengths) {
                    const preferredCandidate = nonTrivial.find(c => c.length === preferredLen);
                    if (preferredCandidate) {
                        // Check if this preferred length is reasonably good (not much worse than best)
                        const bestScore = nonTrivial[0].score;
                        if (preferredCandidate.score <= bestScore * 1.2) { // Within 20% of best
                            return preferredCandidate;
                        }
                    }
                }

                // Fall back to original logic
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
        
        // Key length analysis completed

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
        // Handle empty or very short text
        if (!text || text.length < keyLen) {
            return "";
        }

        // Clean text to only letters, uppercase
        const cleanText = TextUtils.onlyLetters(text).toUpperCase();

        // If cleaning removed too much, return empty
        if (cleanText.length < keyLen) {
            return "";
        }

        let key = "";
        const langData = LanguageAnalysis.languages[this.language].monograms;

        for (let col = 0; col < keyLen; col++) {
            const columnText = this.getColumn(cleanText, keyLen, col);

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

            // Use a more intelligent search: try shifts in order of likelihood
            // Based on English letter frequencies, some shifts are more likely than others
            const shiftOrder = [4, 14, 7, 17, 0, 10, 18, 11, 12, 3, 19, 8, 15, 13, 5, 16, 6, 9, 1, 2, 20, 21, 22, 23, 24, 25];

            for (const shift of shiftOrder) {
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

                // Adaptive Frequency Analysis validation (our latest tool)
                let adaptiveMultiplier = 1.0; // Neutral multiplier
                try {
                    const adaptiveAnalysis = AdaptiveFrequencyAnalysis.analyze(shiftedText, this.language);
                    // For Vigenere columns, we expect monoalphabetic patterns (Caesar cipher)
                    // Boost monoalphabetic results (correct decryption)
                    if (adaptiveAnalysis.family === 'monoalphabetic-substitution') {
                        adaptiveMultiplier = 0.9; // 10% improvement (lower score = better)
                    }
                    // Penalize polyalphabetic results (likely wrong decryption for single column)
                    else if (adaptiveAnalysis.isPolyalphabetic) {
                        adaptiveMultiplier = 1.2; // 20% penalty (higher score = worse)
                    }
                } catch (error) {
                    // Adaptive analysis failed, use neutral multiplier
                }

                // Improved combined score formula:
                // Base: chi-squared (lower = better)
                // Bonus: bigram score reduces chi-squared
                // Multiplier: adaptive analysis adjusts final score
                const baseScore = chiSquared * (1 - normalizedBigramScore * 0.4);
                const adjustedScore = baseScore * adaptiveMultiplier;

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

