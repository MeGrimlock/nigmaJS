import { LanguageAnalysis } from '../analysis/analysis.js';
import { DictionaryValidator } from '../language/dictionary-validator.js';
import { TextUtils } from '../core/text-utils.js';
import Shift from '../ciphers/shift/shift.js';

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
        const keyLen = keyLengthData.length;

        if (keyLen === 0) return { plaintext: ciphertext, key: "", confidence: 0 };

        // 2. Solve for the Key (now async due to dictionary validation)
        const key = await this.findKey(cleanText, keyLen);

        // 3. Decrypt
        // We use the Vigenere implementation from our library logic manually to avoid circular deps
        // or just implement the simple shift logic here for speed.
        const plaintext = this.decryptVigenere(ciphertext, key);

        return {
            plaintext: plaintext,
            key: key,
            confidence: keyLengthData.confidence, // Using IoC proximity as confidence
            analysis: keyLengthData
        };
    }

    /**
     * Uses Friedman test (Index of Coincidence per column) to find key length.
     */
    guessKeyLength(text) {
        // Limit key length for short texts to ensure at least 4 chars per column
        const maxLen = Math.min(20, Math.max(1, Math.floor(text.length / 4)));
        let bestLen = 1;
        let bestAvgIoC = 0;
        let bestDiff = Infinity;

        // Random text IoC is approx 1.0 (normalized). Target is ~1.73.
        // We look for the length that produces columns closest to Target.

        for (let len = 1; len <= maxLen; len++) {
            let totalIoC = 0;
            
            // Analyze columns
            for (let col = 0; col < len; col++) {
                const columnText = this.getColumn(text, len, col);
                totalIoC += LanguageAnalysis.calculateIoC(columnText);
            }
            
            const avgIoC = totalIoC / len;
            
            // Calculate distance to target (e.g. English 1.73)
            const diff = Math.abs(avgIoC - this.targetIoC);

            // We prefer the smallest key length that gets close to the target
            // to avoid multiples (e.g., if key is 2, 4 will also look good).
            // So we only switch if the improvement is significant.
            if (diff < bestDiff * 0.85) { // 15% improvement threshold
                bestDiff = diff;
                bestLen = len;
                bestAvgIoC = avgIoC;
            }
        }

        // Confidence: How close is the IoC to English?
        // 1.0 = Random, 1.73 = English. Map this range to 0-1.
        let confidence = (bestAvgIoC - 1.0) / (this.targetIoC - 1.0);
        confidence = Math.min(Math.max(confidence, 0), 1);

        return { length: bestLen, avgIoC: bestAvgIoC, confidence };
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
                // Extract words from text and check against dictionary
                const words = text.split(/\s+/)
                    .map(w => TextUtils.onlyLetters(w))
                    .filter(w => w.length >= 3);
                
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
            
            // This column is essentially a Caesar shift. Find the best shift.
            let bestShift = 0;
            let minScore = Infinity;

            for (let shift = 0; shift < 26; shift++) {
                // Shift the column
                const shiftedText = this.shiftText(columnText, -shift); // Decrypt attempt
                
                // Use hybrid scoring (chi-squared + dictionary if available)
                const score = await this._scoreWithDictionary(shiftedText, langData);

                if (score < minScore) {
                    minScore = score;
                    bestShift = shift;
                }
            }

            // Convert shift to char (0 = A, 1 = B...)
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

