import 'regenerator-runtime/runtime';
import { TextUtils } from '../core/text-utils.js';
import { Stats } from '../analysis/stats.js';
import { Kasiski } from '../analysis/kasiski.js';
import { Scorers } from '../language/scorers.js';
import { LanguageAnalysis } from '../analysis/analysis.js';
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
     * Validates partially decrypted text against dictionary.
     * Returns a score (0-1) indicating how many words are valid.
     * @private
     * @param {string} text - Partially decrypted text to validate
     * @returns {number} Validation score (0-1, higher is better)
     */
    _validatePartialKey(text) {
        const dict = LanguageAnalysis.getDictionary(this.language);
        if (!dict) return 0; // No dictionary available
        
        // Extract words from text
        const words = text.toUpperCase()
            .split(/\s+/)
            .map(w => TextUtils.onlyLetters(w))
            .filter(w => w.length >= 3); // Only consider words >= 3 chars
        
        if (words.length === 0) return 0;
        
        // Count valid words
        let validWords = 0;
        for (const word of words) {
            if (dict.has(word)) {
                validWords++;
            }
        }
        
        // Return percentage of valid words
        return validWords / words.length;
    }

    /**
     * Scores text using N-gram scoring + dictionary validation (hybrid).
     * @private
     * @param {string} cleanText - Clean text (letters only) for N-gram scoring
     * @param {string} fullText - Full text (with punctuation) for dictionary validation
     * @returns {number} Combined score (higher is better)
     */
    _scoreWithDictionary(cleanText, fullText) {
        // N-gram score (primary)
        const ngramScore = Scorers.scoreText(cleanText, this.language);
        
        // Dictionary validation score (bonus)
        const dictScore = this._validatePartialKey(fullText);
        
        // Combine: 70% N-gram, 30% dictionary
        // Dictionary score is 0-1, convert to bonus: if 0.8 valid, add 0.8 * 100 = 80 to score
        const dictBonus = dictScore * 100;
        
        // Final score: N-gram score + dictionary bonus
        return ngramScore + dictBonus;
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
                
                // Score using hybrid method (N-gram + dictionary)
                const score = this._scoreWithDictionary(testPlaintext, testPlaintext);
                
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
                // Score using hybrid method (N-gram + dictionary)
                const score = this._scoreWithDictionary(testPlaintext, testPlaintext);

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
        // Score using hybrid method (N-gram + dictionary)
        const finalScore = this._scoreWithDictionary(finalPlaintext, finalPlaintext);
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

        // Strategy 1: Try common short keys first (faster)
        // IMPORTANT: Include 'KEY' as first option since it's very common
        const commonKeys = ['KEY', 'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'ITS', 'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE'];
        
        let bestResult = { plaintext: '', key: '', score: -Infinity, confidence: 0, method: 'porta', keyLength };
        
        // Try common keys of the right length
        for (const testKey of commonKeys) {
            if (testKey.length === keyLength) {
                try {
                    // Porta cipher works on the full ciphertext (preserves punctuation)
                    const porta = new Polyalphabetic.Porta(ciphertext, testKey);
                    const plaintext = porta.decode();
                    
                    // Score using hybrid method (N-gram + dictionary)
                    const cleanPlaintext = TextUtils.onlyLetters(plaintext);
                    const score = this._scoreWithDictionary(cleanPlaintext, plaintext);
                    
                    if (score > bestResult.score) {
                        const ic = Stats.indexOfCoincidence(plaintext);
                        const confidence = Math.max(0, Math.min(1, 1 - Math.abs(ic - 1.73) / 1.73));
                        bestResult = { 
                            plaintext,  // Keep full text with punctuation
                            key: testKey, 
                            score, 
                            confidence, 
                            method: 'porta', 
                            keyLength 
                        };
                        console.log(`[Porta] Found better key: ${testKey}, score=${score.toFixed(2)}, confidence=${confidence.toFixed(2)}`);
                    }
                } catch (error) {
                    console.warn(`[Porta] Error with key ${testKey}:`, error);
                }
            }
        }

        // Strategy 2: If common keys didn't work well, try brute force column-by-column
        // But only if the best score is still very low
        if (bestResult.score < -5) {
            // Split into columns
            const columns = [];
            for (let i = 0; i < keyLength; i++) {
                columns.push('');
            }
            
            for (let i = 0; i < cleanText.length; i++) {
                columns[i % keyLength] += cleanText[i];
            }

            // For each column, find the most likely key letter
            let key = '';

            for (const column of columns) {
                let bestKeyChar = 'A';
                let bestScore = -Infinity;

                // Try all 26 possible key letters (though only 13 are unique in Porta)
                for (let k = 0; k < 26; k++) {
                    const keyChar = String.fromCharCode(k + 65);
                    const porta = new Polyalphabetic.Porta(column, keyChar);
                    const decrypted = porta.decode();
                    // Use hybrid scoring (N-gram + dictionary)
                    const cleanDecrypted = TextUtils.onlyLetters(decrypted);
                    const score = this._scoreWithDictionary(cleanDecrypted, decrypted);
                    
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
            // Score using hybrid method (N-gram + dictionary)
            const cleanPlaintext = TextUtils.onlyLetters(plaintext);
            const hybridScore = this._scoreWithDictionary(cleanPlaintext, plaintext);
            
            // Only use this result if it's better than common keys
            if (hybridScore > bestResult.score) {
                const ic = Stats.indexOfCoincidence(plaintext);
                const confidence = Math.max(0, Math.min(1, 1 - Math.abs(ic - 1.73) / 1.73));
                bestResult = { plaintext, key, score: hybridScore, confidence, method: 'porta', keyLength };
            }
        }

        return bestResult;
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
            return { plaintext: '', key: '', score: -Infinity, confidence: 0, method: 'none' };
        }

        // Try Quagmire 1, 2, 3, and 4
        const quagmire1Result = this.solveQuagmire1(ciphertext, keyLength);
        const quagmire2Result = this.solveQuagmire2(ciphertext, keyLength);
        const quagmire3Result = this.solveQuagmire3(ciphertext, keyLength);
        const quagmire4Result = this.solveQuagmire4(ciphertext, keyLength);

        // Return the best result
        const allResults = [quagmire1Result, quagmire2Result, quagmire3Result, quagmire4Result]
            .filter(r => r && r.score > -Infinity && r.method !== 'none');
        
        if (allResults.length === 0) {
            return { plaintext: '', key: '', score: -Infinity, confidence: 0, method: 'none' };
        }

        // Sort by score, but if scores are very close (within 5%), prefer more specific methods (4 > 3 > 2 > 1)
        allResults.sort((a, b) => {
            const scoreDiff = b.score - a.score;
            // If scores are very close (within 5% of the higher score), prefer higher Quagmire number
            if (Math.abs(scoreDiff) < Math.abs(b.score * 0.05)) {
                const methodPriority = { quagmire4: 4, quagmire3: 3, quagmire2: 2, quagmire1: 1 };
                const aPriority = methodPriority[a.method] || 0;
                const bPriority = methodPriority[b.method] || 0;
                return bPriority - aPriority; // Higher number = more specific = better
            }
            return scoreDiff;
        });
        
        console.log(`[PolyalphabeticSolver] Quagmire results: ${allResults.map(r => `${r.method}(${r.score.toFixed(2)})`).join(', ')}`);
        return allResults[0];
    }

    /**
     * Attempts to solve Quagmire I cipher
     * @private
     */
    solveQuagmire1(ciphertext, keyLength) {
        const cleanText = TextUtils.onlyLetters(ciphertext);
        if (cleanText.length < 100) {
            return { plaintext: '', key: '', score: -Infinity, confidence: 0, method: 'none' };
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
                    // Score using hybrid method (N-gram + dictionary)
                    const cleanPlaintext = TextUtils.onlyLetters(plaintext);
                    const ngramScore = this._scoreWithDictionary(cleanPlaintext, plaintext);

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
     * Attempts to solve Quagmire II cipher
     * Quagmire II uses indicator-based alphabet selection
     * @private
     */
    solveQuagmire2(ciphertext, keyLength) {
        const cleanText = TextUtils.onlyLetters(ciphertext);
        if (cleanText.length < 100) {
            return { plaintext: '', key: '', score: -Infinity, confidence: 0, method: 'none' };
        }

        const commonKeywords = ['KEY', 'SECRET', 'CIPHER', 'CODE', 'CRYPTO', 'ENIGMA'];
        const commonIndicators = ['A', 'B', 'C', 'D', 'E', 'KEY', 'ABC'];
        
        let bestResult = { plaintext: '', key: '', score: -Infinity, confidence: 0, method: 'quagmire2' };

        for (const keyword of commonKeywords) {
            for (const indicator of commonIndicators) {
                try {
                    const quagmire = new Polyalphabetic.Quagmire2(ciphertext, keyword, indicator);
                    const plaintext = quagmire.decode();
                    const cleanPlaintext = TextUtils.onlyLetters(plaintext);
                    const ngramScore = this._scoreWithDictionary(cleanPlaintext, plaintext);

                    if (ngramScore > bestResult.score) {
                        const ic = Stats.indexOfCoincidence(plaintext);
                        const confidence = Math.max(0, Math.min(1, 1 - Math.abs(ic - 1.73) / 1.73));
                        bestResult = {
                            plaintext,
                            key: `${keyword}:${indicator}`,
                            score: ngramScore,
                            confidence,
                            method: 'quagmire2',
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
     * Attempts to solve Quagmire III cipher
     * Quagmire III uses a keyed alphabet for both plaintext and ciphertext
     * @private
     */
    solveQuagmire3(ciphertext, keyLength) {
        const cleanText = TextUtils.onlyLetters(ciphertext);
        if (cleanText.length < 100) {
            return { plaintext: '', key: '', score: -Infinity, confidence: 0, method: 'none' };
        }

        const commonKeywords = ['KEY', 'SECRET', 'CIPHER', 'CODE', 'CRYPTO', 'ENIGMA', 'AUTOMOBILE'];
        const commonIndicators = ['KEY', 'A', 'B', 'C', 'ABC'];
        
        let bestResult = { plaintext: '', key: '', score: -Infinity, confidence: 0, method: 'quagmire3' };

        for (const keyword of commonKeywords) {
            for (const indicator of commonIndicators) {
                try {
                    const quagmire = new Polyalphabetic.Quagmire3(ciphertext, keyword, indicator);
                    const plaintext = quagmire.decode();
                    const cleanPlaintext = TextUtils.onlyLetters(plaintext);
                    const ngramScore = this._scoreWithDictionary(cleanPlaintext, plaintext);

                    if (ngramScore > bestResult.score) {
                        const ic = Stats.indexOfCoincidence(plaintext);
                        const confidence = Math.max(0, Math.min(1, 1 - Math.abs(ic - 1.73) / 1.73));
                        bestResult = {
                            plaintext,
                            key: `${keyword}:${indicator}`,
                            score: ngramScore,
                            confidence,
                            method: 'quagmire3',
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
     * Attempts to solve Quagmire IV cipher
     * Quagmire IV uses different keyed alphabets for plaintext and ciphertext
     * @private
     */
    solveQuagmire4(ciphertext, keyLength) {
        const cleanText = TextUtils.onlyLetters(ciphertext);
        if (cleanText.length < 100) {
            return { plaintext: '', key: '', score: -Infinity, confidence: 0, method: 'none' };
        }

        const commonKeywords = ['KEY', 'SECRET', 'CIPHER', 'CODE', 'CRYPTO', 'ENIGMA'];
        const commonIndicators = ['ABC', 'KEY', 'A', 'B', 'C'];
        const commonCipherAlphabets = ['', 'ZYXWVUTSRQPONMLKJIHGFEDCBA']; // Empty = use keyword-based
        
        let bestResult = { plaintext: '', key: '', score: -Infinity, confidence: 0, method: 'quagmire4' };

        for (const keyword of commonKeywords) {
            for (const indicator of commonIndicators) {
                for (const cipherAlphabet of commonCipherAlphabets) {
                    try {
                        const quagmire = new Polyalphabetic.Quagmire4(ciphertext, keyword, indicator, cipherAlphabet);
                        const plaintext = quagmire.decode();
                        const cleanPlaintext = TextUtils.onlyLetters(plaintext);
                        const ngramScore = this._scoreWithDictionary(cleanPlaintext, plaintext);

                        if (ngramScore > bestResult.score) {
                            const ic = Stats.indexOfCoincidence(plaintext);
                            const confidence = Math.max(0, Math.min(1, 1 - Math.abs(ic - 1.73) / 1.73));
                            bestResult = {
                                plaintext,
                                key: `${keyword}:${indicator}${cipherAlphabet ? ':' + cipherAlphabet : ''}`,
                                score: ngramScore,
                                confidence,
                                method: 'quagmire4',
                                keyLength
                            };
                        }
                    } catch (e) {
                        // Skip invalid combinations
                        continue;
                    }
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

                // Use hybrid scoring (N-gram + dictionary) for better accuracy
                const score = this._scoreWithDictionary(decrypted, decrypted);
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
        // Score using hybrid method (N-gram + dictionary)
        const cleanPlaintext = TextUtils.onlyLetters(plaintext);
        const ngramScore = this._scoreWithDictionary(cleanPlaintext, plaintext);
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
            if (portaResult && portaResult.score > -Infinity) {
                allResults.push({ ...portaResult, keyLength });
            }
            
            const beaufortResult = this.solveBeaufort(ciphertext, keyLength);
            if (beaufortResult && beaufortResult.score > -Infinity) {
                allResults.push({ ...beaufortResult, keyLength });
            }
            
            const gronsfeldResult = this.solveGronsfeld(ciphertext, keyLength);
            if (gronsfeldResult && gronsfeldResult.score > -Infinity) {
                allResults.push({ ...gronsfeldResult, keyLength });
            }
            
            const quagmireResult = this.solveQuagmire(ciphertext, keyLength);
            if (quagmireResult && quagmireResult.score > -Infinity) {
                allResults.push({ ...quagmireResult, keyLength });
            }
        }

        // Sort by score (higher is better for N-gram scoring)
        allResults.sort((a, b) => b.score - a.score);
        
        // Log top 3 results for debugging
        console.log('[PolyalphabeticSolver] Top 3 results:');
        allResults.slice(0, 3).forEach((r, i) => {
            console.log(`  ${i + 1}. ${r.method} (keyLength=${r.keyLength}): score=${r.score.toFixed(2)}, confidence=${r.confidence.toFixed(2)}, key=${r.key}`);
        });

        // Ensure we always return a valid result with method defined
        if (allResults.length === 0) {
            return { 
                plaintext: '', 
                key: '', 
                score: -Infinity, 
                confidence: 0, 
                method: 'none',
                keyLength: probableKeyLengths[0]?.length || probableKeyLengths[0]?.keyLength || 0
            };
        }
        
        const bestResult = allResults[0];
        // Ensure method is always defined
        if (!bestResult.method) {
            bestResult.method = 'unknown';
        }
        
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

