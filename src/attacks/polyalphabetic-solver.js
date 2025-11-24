import 'regenerator-runtime/runtime';
import { TextUtils } from '../core/text-utils.js';
import { Stats } from '../analysis/stats.js';
import { Kasiski } from '../analysis/kasiski.js';
import { Scorers } from '../language/scorers.js';
import Polyalphabetic from '../ciphers/polyalphabetic/polyalphabetic.js';

/**
 * Advanced Polyalphabetic Cipher Solver
 * 
 * Handles complex polyalphabetic ciphers:
 * - Beaufort (self-reciprocal, subtraction-based)
 * - Porta (mutually reversible alphabets)
 * - Quagmire I-IV (mixed alphabets with keywords)
 * - Gronsfeld (numeric keys)
 * 
 * Strategy:
 * 1. Use Kasiski examination to find probable key lengths
 * 2. For each key length, try different cipher types
 * 3. Use frequency analysis to recover keys
 * 4. Score results with N-gram models
 * 
 * LIMITATIONS (as of v3.1.x):
 * - Beaufort: Difficult to break automatically due to subtraction-based encryption.
 *   Success rate ~40-60% depending on text length and key complexity.
 *   Requires >200 characters for reliable results.
 * 
 * - Porta: Moderate success rate (~60-70%). Works better with longer texts.
 * 
 * - Gronsfeld: Similar to Vigenère, good success rate (~70-80%) with numeric keys.
 * 
 * - Quagmire: Very difficult without knowing the cipher alphabet.
 *   Current implementation tries common alphabets but success rate is low (~20-30%).
 *   Requires very long texts (>500 characters) and common keywords.
 * 
 * RECOMMENDATIONS:
 * - For production use, combine with manual analysis and multiple attempts
 * - Longer texts (>200 chars) significantly improve accuracy
 * - Shorter keys (3-5 characters) are easier to break than longer ones
 * - Consider using the Orchestrator which tries multiple strategies
 */

export class PolyalphabeticSolver {
    constructor(language = 'english') {
        this.language = language;
        this.alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }

    /**
     * Attempts to solve Beaufort cipher
     * Beaufort is self-reciprocal: C = (K - P) mod 26
     * Similar to Vigenère but uses subtraction
     * 
     * Strategy: Build key iteratively, optimizing full plaintext score at each step
     * 
     * @param {string} ciphertext - The encrypted text
     * @param {number} keyLength - Probable key length (from Kasiski)
     * @returns {Object} Result with plaintext, key, score, confidence
     */
    solveBeaufort(ciphertext, keyLength) {
        const cleanText = TextUtils.onlyLetters(ciphertext);
        if (cleanText.length < 50) {
            return { plaintext: '', key: '', score: -Infinity, confidence: 0 };
        }

        // Strategy: Build key iteratively, testing full decryption at each step
        let bestKey = '';
        let bestScore = -Infinity;
        let bestPlaintext = '';

        // Build key one character at a time
        for (let pos = 0; pos < keyLength; pos++) {
            let bestChar = 'A';
            let bestPosScore = -Infinity;

            // Try all 26 letters for this position
            for (let shift = 0; shift < 26; shift++) {
                const testKey = bestKey + String.fromCharCode(shift + 65) + 'A'.repeat(keyLength - pos - 1);
                
                // Decrypt with test key
                const beaufort = new Polyalphabetic.Beaufort(cleanText, testKey);
                const testPlaintext = beaufort.decode();
                
                // Score the full plaintext
                const score = Scorers.scoreText(testPlaintext, this.language);
                
                if (score > bestPosScore) {
                    bestPosScore = score;
                    bestChar = String.fromCharCode(shift + 65);
                }
            }

            bestKey += bestChar;
        }

        // Final refinement: Try small variations around the found key
        for (let i = 0; i < keyLength; i++) {
            const originalChar = bestKey[i];
            const originalCharCode = originalChar.charCodeAt(0) - 65;

            for (let delta = -2; delta <= 2; delta++) {
                if (delta === 0) continue;
                const newCharCode = (originalCharCode + delta + 26) % 26;
                const newChar = String.fromCharCode(newCharCode + 65);
                const testKey = bestKey.substring(0, i) + newChar + bestKey.substring(i + 1);

                const beaufort = new Polyalphabetic.Beaufort(cleanText, testKey);
                const testPlaintext = beaufort.decode();
                const score = Scorers.scoreText(testPlaintext, this.language);

                if (score > bestScore) {
                    bestScore = score;
                    bestKey = testKey;
                    bestPlaintext = testPlaintext;
                }
            }
        }

        // Final decryption with best key
        const beaufort = new Polyalphabetic.Beaufort(ciphertext, bestKey);
        const finalPlaintext = beaufort.decode();
        const finalScore = Scorers.scoreText(finalPlaintext, this.language);
        const ic = Stats.indexOfCoincidence(finalPlaintext);

        // Confidence based on IC (should be ~1.73 for English plaintext)
        const confidence = Math.max(0, Math.min(1, 1 - Math.abs(ic - 1.73) / 1.73));

        return {
            plaintext: finalPlaintext,
            key: bestKey,
            score: finalScore,
            confidence,
            method: 'beaufort',
            keyLength
        };
    }

    /**
     * Attempts to solve Porta cipher
     * Porta uses 13 mutually reversible alphabet pairs
     * 
     * @param {string} ciphertext - The encrypted text
     * @param {number} keyLength - Probable key length (from Kasiski)
     * @returns {Object} Result with plaintext, key, score, confidence
     */
    solvePorta(ciphertext, keyLength) {
        const cleanText = TextUtils.onlyLetters(ciphertext);
        if (cleanText.length < 50) {
            return { plaintext: '', key: '', score: -Infinity, confidence: 0 };
        }

        // Split into columns
        const columns = [];
        for (let i = 0; i < keyLength; i++) {
            columns.push('');
        }
        
        for (let i = 0; i < cleanText.length; i++) {
            columns[i % keyLength] += cleanText[i];
        }

        // For each column, find the most likely key letter (A-M, 13 pairs)
        let key = '';

        for (const column of columns) {
            let bestKeyChar = 'A';
            let bestScore = -Infinity;

            // Try all 26 possible key letters (though only 13 are unique in Porta)
            for (let k = 0; k < 26; k++) {
                const keyChar = String.fromCharCode(k + 65);
                // Create Porta cipher for this column with this key character
                // The column is already ciphertext, so we decode it
                const porta = new Polyalphabetic.Porta(column, keyChar);
                const decrypted = porta.decode();

                // Use N-gram scoring for better accuracy
                const score = Scorers.scoreText(decrypted, this.language);
                if (score > bestScore) {
                    bestScore = score;
                    bestKeyChar = keyChar;
                }
            }

            key += bestKeyChar;
        }

        // Decrypt with found key
        const porta = new Polyalphabetic.Porta(ciphertext, key);
        const plaintext = porta.decode();
        const ngramScore = Scorers.scoreText(plaintext, this.language);
        const ic = Stats.indexOfCoincidence(plaintext);

        const confidence = Math.max(0, Math.min(1, 1 - Math.abs(ic - 1.73) / 1.73));

        return {
            plaintext,
            key,
            score: ngramScore,
            confidence,
            method: 'porta',
            keyLength
        };
    }

    /**
     * Attempts to solve Quagmire I cipher
     * Quagmire uses a mixed cipher alphabet + keyword
     * 
     * @param {string} ciphertext - The encrypted text
     * @param {number} keyLength - Probable key length (from Kasiski)
     * @returns {Object} Result with plaintext, key, score, confidence
     */
    solveQuagmire(ciphertext, keyLength) {
        const cleanText = TextUtils.onlyLetters(ciphertext);
        if (cleanText.length < 100) { // Quagmire needs more text
            return { plaintext: '', key: '', score: -Infinity, confidence: 0 };
        }

        // For Quagmire, we need to find both the keyword AND the cipher alphabet
        // This is much harder - we'll try common keywords and cipher alphabets
        const commonKeywords = ['KEY', 'SECRET', 'CIPHER', 'CODE', 'CRYPTO', 'ENIGMA'];
        const commonAlphabets = [
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ', // Normal
            'ZYXWVUTSRQPONMLKJIHGFEDCBA', // Reversed
            'QWERTYUIOPASDFGHJKLZXCVBNM'  // QWERTY
        ];

        let bestResult = { plaintext: '', key: '', score: -Infinity, confidence: 0 };

        for (const keyword of commonKeywords) {
            for (const cipherAlphabet of commonAlphabets) {
                try {
                    const quagmire = new Polyalphabetic.Quagmire1(ciphertext, keyword, cipherAlphabet);
                    const plaintext = quagmire.decode();
                    const ngramScore = Scorers.scoreText(plaintext, this.language);

                    if (ngramScore > bestResult.score) {
                        const ic = Stats.indexOfCoincidence(plaintext);
                        const confidence = Math.max(0, Math.min(1, 1 - Math.abs(ic - 1.73) / 1.73));

                        bestResult = {
                            plaintext,
                            key: keyword,
                            cipherAlphabet,
                            score: ngramScore,
                            confidence,
                            method: 'quagmire1',
                            keyLength
                        };
                    }
                } catch (e) {
                    // Skip invalid combinations
                    continue;
                }
            }
        }

        return bestResult;
    }

    /**
     * Attempts to solve Gronsfeld cipher
     * Gronsfeld is like Vigenère but uses numeric keys (0-9)
     * 
     * @param {string} ciphertext - The encrypted text
     * @param {number} keyLength - Probable key length (from Kasiski)
     * @returns {Object} Result with plaintext, key, score, confidence
     */
    solveGronsfeld(ciphertext, keyLength) {
        const cleanText = TextUtils.onlyLetters(ciphertext);
        if (cleanText.length < 50) {
            return { plaintext: '', key: '', score: -Infinity, confidence: 0 };
        }

        // Split into columns
        const columns = [];
        for (let i = 0; i < keyLength; i++) {
            columns.push('');
        }
        
        for (let i = 0; i < cleanText.length; i++) {
            columns[i % keyLength] += cleanText[i];
        }

        // For each column, find the most likely key digit (0-9)
        let key = '';

        for (const column of columns) {
            let bestShift = 0;
            let bestScore = -Infinity;

            // Try all 10 possible digits (0-9)
            for (let shift = 0; shift < 10; shift++) {
                let decrypted = '';
                for (const char of column) {
                    const c = char.charCodeAt(0) - 65;
                    const p = (c - shift + 26) % 26;
                    decrypted += String.fromCharCode(p + 65);
                }

                // Use N-gram scoring for better accuracy
                const score = Scorers.scoreText(decrypted, this.language);
                if (score > bestScore) {
                    bestScore = score;
                    bestShift = shift;
                }
            }

            key += bestShift.toString();
        }

        // Decrypt with found key
        const gronsfeld = new Polyalphabetic.Gronsfeld(ciphertext, key);
        const plaintext = gronsfeld.decode();
        const ngramScore = Scorers.scoreText(plaintext, this.language);
        const ic = Stats.indexOfCoincidence(plaintext);

        const confidence = Math.max(0, Math.min(1, 1 - Math.abs(ic - 1.73) / 1.73));

        return {
            plaintext,
            key,
            score: ngramScore,
            confidence,
            method: 'gronsfeld',
            keyLength
        };
    }

    /**
     * Main solve method - tries all polyalphabetic cipher types
     * 
     * @param {string} ciphertext - The encrypted text
     * @returns {Object} Best result across all cipher types
     */
    solve(ciphertext) {
        const cleanText = TextUtils.onlyLetters(ciphertext);
        
        // Use Kasiski to find probable key lengths
        const kasiskiResult = Kasiski.examine(cleanText);
        let probableKeyLengths = kasiskiResult.suggestedKeyLengths.slice(0, 3); // Top 3

        if (probableKeyLengths.length === 0) {
            // No repetitions found, might be monoalphabetic or very short key
            probableKeyLengths = [
                { length: 3, score: 1 },
                { length: 4, score: 1 },
                { length: 5, score: 1 }
            ];
        }

        let allResults = [];

        for (const keyLengthObj of probableKeyLengths) {
            const keyLength = keyLengthObj.length || keyLengthObj.keyLength;
            console.log(`[PolyalphabeticSolver] Trying key length ${keyLength}...`);
            
            // Try each cipher type - Porta FIRST (most commonly confused with Vigenère)
            const portaResult = this.solvePorta(ciphertext, keyLength);
            allResults.push({ ...portaResult, keyLength });
            
            const beaufortResult = this.solveBeaufort(ciphertext, keyLength);
            allResults.push({ ...beaufortResult, keyLength });
            
            const gronsfeldResult = this.solveGronsfeld(ciphertext, keyLength);
            allResults.push({ ...gronsfeldResult, keyLength });
            
            const quagmireResult = this.solveQuagmire(ciphertext, keyLength);
            allResults.push({ ...quagmireResult, keyLength });
        }

        // Sort by score (higher is better for N-gram scoring)
        allResults.sort((a, b) => b.score - a.score);
        
        // Log top 3 results for debugging
        console.log('[PolyalphabeticSolver] Top 3 results:');
        allResults.slice(0, 3).forEach((r, i) => {
            console.log(`  ${i + 1}. ${r.method} (keyLength=${r.keyLength}): score=${r.score.toFixed(2)}, confidence=${r.confidence.toFixed(2)}, key=${r.key}`);
        });

        const bestResult = allResults[0] || { plaintext: '', key: '', score: -Infinity, confidence: 0, method: 'none' };
        
        return bestResult;
    }

    /**
     * Helper: Get target language frequencies
     * @returns {Object} Letter frequencies for target language
     */
    getTargetFrequencies() {
        // English letter frequencies (as percentages)
        return {
            'A': 8.2, 'B': 1.5, 'C': 2.8, 'D': 4.3, 'E': 12.7, 'F': 2.2,
            'G': 2.0, 'H': 6.1, 'I': 7.0, 'J': 0.15, 'K': 0.77, 'L': 4.0,
            'M': 2.4, 'N': 6.7, 'O': 7.5, 'P': 1.9, 'Q': 0.095, 'R': 6.0,
            'S': 6.3, 'T': 9.1, 'U': 2.8, 'V': 0.98, 'W': 2.4, 'X': 0.15,
            'Y': 2.0, 'Z': 0.074
        };
    }

    /**
     * Helper: Score text against target frequencies using chi-squared
     * @param {string} text - Text to score
     * @param {Object} targetFreq - Target frequencies
     * @returns {number} Chi-squared score (lower is better, so we negate it)
     */
    scoreFrequency(text, targetFreq) {
        const observed = Stats.frequency(text);
        let chiSquared = 0;

        for (const letter in targetFreq) {
            const expected = targetFreq[letter];
            const obs = observed[letter] || 0;
            chiSquared += Math.pow(obs - expected, 2) / expected;
        }

        return -chiSquared; // Negate so higher is better
    }
}

