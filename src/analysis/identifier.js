import { Stats } from './stats.js';
import { Kasiski } from './kasiski.js';
import { TextUtils } from '../core/text-utils.js';
import { LanguageAnalysis } from './analysis.js';

/**
 * Cipher Identifier: Analyzes ciphertext to suggest the type of cipher used.
 * Combines Index of Coincidence, Kasiski examination, entropy, and heuristics.
 */
export class CipherIdentifier {
    /**
     * Identifies the probable cipher type(s) for a given ciphertext.
     * @param {string} text - The ciphertext to analyze.
     * @param {string} language - Target language for dictionary validation (default: 'english').
     * @returns {Promise<Object>} An object containing cipher families with confidence scores.
     */
    static async identify(text, language = 'english') {
        const cleaned = TextUtils.onlyLetters(text);
        const length = cleaned.length;

        // If text is too short, classification is unreliable
        if (length < 20) {
            return {
                families: [
                    { type: 'unknown', confidence: 1.0, reason: 'Text too short for reliable analysis' }
                ],
                stats: {
                    length: length,
                    ic: 0,
                    entropy: 0
                }
            };
        }

        // Calculate basic statistics
        const ic = Stats.indexOfCoincidence(text);
        const entropy = Stats.entropy(text);
        const kasiski = Kasiski.examine(text);
        
        // Dictionary validation: check if text contains valid words
        // This helps distinguish between ciphertext and plaintext/weakly encrypted text
        let dictionaryScore = 0;
        try {
            const dict = LanguageAnalysis.getDictionary(language);
            if (dict) {
                const words = text.toUpperCase()
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
                    dictionaryScore = validWords / words.length; // 0-1, higher = more valid words
                }
            }
        } catch (error) {
            // Dictionary not available, continue without dictionary validation
            console.warn('[CipherIdentifier] Dictionary validation failed:', error);
        }

        // Initialize confidence scores for each cipher family
        const scores = {
            'monoalphabetic-substitution': 0,
            'caesar-shift': 0,
            'vigenere-like': 0,
            'transposition': 0,
            'random-unknown': 0
        };

        // --- Heuristic 1: Index of Coincidence (adjusted for text length) ---
        // IMPORTANT: IC is less reliable for short texts (< 100 chars)
        // Short texts naturally have lower IC due to statistical variance
        // Monoalphabetic: IC ≈ 1.5-2.0 (preserves letter frequency)
        // Polyalphabetic (Vigenère): IC ≈ 1.0-1.4 (flattens frequency)
        // Random/Strong: IC ≈ 1.0 (uniform distribution)
        // Transposition: IC ≈ 1.5-2.0 (preserves frequency, just reorders)
        
        // Adjust IC thresholds based on text length
        // For short texts (< 50 chars), IC is less reliable, so we're more lenient
        // For medium texts (50-150), use standard thresholds
        // For long texts (> 150), IC is very reliable
        const isShortText = length < 50;
        const isMediumText = length >= 50 && length < 150;
        const isLongText = length >= 150;
        
        // Adjusted thresholds based on text length
        const highICThreshold = isShortText ? 1.2 : (isMediumText ? 1.4 : 1.5);
        const mediumICThreshold = isShortText ? 0.8 : (isMediumText ? 1.1 : 1.2);
        
        if (ic >= highICThreshold) {
            scores['monoalphabetic-substitution'] += 1.0;
            scores['caesar-shift'] += 0.9; // Caesar is a special case of monoalphabetic
            scores['transposition'] += 0.6;
        } else if (ic >= mediumICThreshold && ic < highICThreshold) {
            // Medium IC: could be Vigenère or short monoalphabetic text
            // For short texts, prefer monoalphabetic (Caesar/Rot13/Rot47)
            if (isShortText) {
                scores['caesar-shift'] += 0.8;
                scores['monoalphabetic-substitution'] += 0.7;
                scores['vigenere-like'] += 0.4; // Less likely for short texts
            } else {
                scores['vigenere-like'] += 0.9;
                scores['monoalphabetic-substitution'] += 0.3;
            }
        } else if (ic < mediumICThreshold) {
            // Low IC: could be Vigenère, random, or short monoalphabetic with statistical variance
            if (isShortText) {
                // Short texts with low IC are often Caesar/Rot13/Rot47 with statistical variance
                scores['caesar-shift'] += 0.6;
                scores['monoalphabetic-substitution'] += 0.5;
                scores['vigenere-like'] += 0.3;
            } else {
                scores['vigenere-like'] += 0.7;
                scores['random-unknown'] += 0.8;
            }
        }

        // --- Heuristic 2: Kasiski Examination (improved) ---
        // If we find repeated n-grams with consistent distances, it's likely polyalphabetic
        // BUT: If IC is very high (> 1.6), repetitions are from plaintext, not polyalphabetic cipher
        // IMPORTANT: For short texts, Kasiski is less reliable (fewer repetitions)
        const reliableKasiski = length >= 100 && kasiski.hasRepetitions && kasiski.suggestedKeyLengths.length > 0;
        const highIC = ic >= (isShortText ? 1.3 : 1.6); // Adjusted threshold for short texts
        
        if (reliableKasiski && !highIC) {
            const topKeyLength = kasiski.suggestedKeyLengths[0];
            if (topKeyLength.score > 0.3) { // Strong evidence
                scores['vigenere-like'] += 1.2;
                scores['monoalphabetic-substitution'] -= 0.5;
                scores['caesar-shift'] -= 0.5;
            } else if (topKeyLength.score > 0.1) { // Weak evidence
                scores['vigenere-like'] += 0.6;
            }
        } else {
            // No reliable repetitions → likely monoalphabetic or very short key
            // For short texts, this is especially true (Caesar/Rot13/Rot47)
            if (isShortText) {
                scores['caesar-shift'] += 0.6; // Short texts are often Caesar shifts
                scores['monoalphabetic-substitution'] += 0.5;
            } else {
                scores['monoalphabetic-substitution'] += 0.5;
                scores['caesar-shift'] += 0.4;
            }
        }

        // --- Heuristic 3: Entropy ---
        // High entropy (close to 4.7) → strong cipher or random
        // Low entropy (< 3.5) → weak cipher or plaintext leak
        // Transposition preserves entropy of plaintext (~4.0-4.2 for English)
        // IMPORTANT: Entropy is less reliable for short texts
        if (entropy >= 4.3) {
            scores['random-unknown'] += 0.5;
            scores['vigenere-like'] += 0.2;
        } else if (entropy >= 3.8 && entropy < 4.3) {
            // Entropy in this range suggests transposition OR monoalphabetic
            // Use IC to distinguish: high IC + medium entropy = transposition
            // Low IC + medium entropy = might be Vigenère
            if (ic >= 1.5) {
                scores['transposition'] += 0.7; // High IC + medium entropy = transposition
                scores['monoalphabetic-substitution'] += 0.3;
            } else {
                scores['transposition'] += 0.5;
                scores['vigenere-like'] += 0.3;
            }
        } else if (entropy < 3.8) {
            scores['monoalphabetic-substitution'] += 0.3;
            scores['caesar-shift'] += 0.3;
        }
        
        // --- Heuristic 3b: Transposition Detection (improved) ---
        // Transposition ciphers have:
        // - High IC (≈1.5-2.0) because they preserve letter frequencies
        // - Medium entropy (≈3.8-4.2) because they preserve plaintext entropy
        // - No letter substitutions (all letters from plaintext alphabet)
        // - Character positions changed but frequencies preserved
        if (ic >= 1.5 && entropy >= 3.8 && entropy < 4.3 && length >= 50) {
            // Check if all characters are from expected alphabet (no substitutions)
            const uniqueChars = new Set(cleaned);
            const isOnlyLetters = Array.from(uniqueChars).every(c => /[A-Za-z]/.test(c));
            
            if (isOnlyLetters) {
                // High IC + medium entropy + only letters = likely transposition
                scores['transposition'] += 0.5;
                // Penalize substitution ciphers
                scores['monoalphabetic-substitution'] -= 0.2;
                scores['caesar-shift'] -= 0.2;
            }
        }

        // --- Heuristic 4: Text Length (improved) ---
        // Very short texts are hard to classify, but we can still make educated guesses
        // For very short texts, prefer simpler ciphers (Caesar/Rot13/Rot47)
        if (length < 50) {
            // Don't boost "unknown" too much - short texts are often simple ciphers
            scores['random-unknown'] += 0.1;
            // Boost Caesar shift for short texts (common use case)
            scores['caesar-shift'] += 0.3;
        }

        // --- Heuristic 5: Caesar Shift Detection (improved) ---
        // Test if text could be a Caesar shift by trying a few shifts
        // This is a quick test that helps distinguish Caesar from Vigenère
        let caesarTestScore = 0;
        if (length >= 20 && length < 200) { // Only for reasonable lengths
            // Quick test: try shifts 1, 13, 25 (common Caesar shifts)
            const testShifts = [1, 13, 25];
            let bestShiftScore = 0;
            
            for (const shift of testShifts) {
                let shifted = '';
                for (const char of cleaned) {
                    const code = char.charCodeAt(0);
                    if (code >= 65 && code <= 90) { // A-Z
                        const shiftedCode = ((code - 65 + shift) % 26) + 65;
                        shifted += String.fromCharCode(shiftedCode);
                    }
                }
                
                // Check if shifted text has valid words (quick dictionary check)
                try {
                    const dict = LanguageAnalysis.getDictionary(language);
                    if (dict && shifted.length > 0) {
                        const words = shifted.split(/\s+/).filter(w => w.length >= 3);
                        if (words.length > 0) {
                            let validWords = 0;
                            for (const word of words.slice(0, 10)) { // Check first 10 words only
                                if (dict.has(word)) validWords++;
                            }
                            const wordScore = validWords / words.length;
                            if (wordScore > bestShiftScore) {
                                bestShiftScore = wordScore;
                            }
                        }
                    }
                } catch (e) {
                    // Dictionary not available, skip
                }
            }
            
            // If we found a good Caesar shift match, boost Caesar score
            if (bestShiftScore > 0.3) {
                caesarTestScore = bestShiftScore * 0.8; // Convert to score boost
                scores['caesar-shift'] += caesarTestScore;
                scores['monoalphabetic-substitution'] += caesarTestScore * 0.7;
                // Strongly penalize Vigenère if Caesar test succeeds
                scores['vigenere-like'] -= caesarTestScore * 1.5;
            }
        }
        
        // Also use IC-based detection (for longer texts where IC is reliable)
        if (ic >= 1.4 && length >= 100) {
            scores['caesar-shift'] += 0.8;
            scores['monoalphabetic-substitution'] += 0.7;
            // Penalize vigenere if IC is too high
            scores['vigenere-like'] -= 0.6;
        }

        // --- Heuristic 6: Dictionary Validation ---
        // If text contains many valid words, it might be:
        // 1. Plaintext (not encrypted)
        // 2. Weakly encrypted (Caesar with small shift)
        // 3. Partially decrypted
        // High dictionary score + high IC → likely monoalphabetic or plaintext
        // High dictionary score + low IC → might be transposition or partially decrypted
        // Low dictionary score → likely properly encrypted ciphertext
        if (dictionaryScore > 0.5) {
            // Many valid words: likely weak cipher or plaintext
            if (ic >= 1.5) {
                scores['monoalphabetic-substitution'] += 0.4;
                scores['caesar-shift'] += 0.3;
            } else if (ic >= 1.2) {
                scores['transposition'] += 0.3;
            }
            // Penalize strong ciphers if text has valid words
            scores['random-unknown'] -= 0.3;
        } else if (dictionaryScore < 0.2) {
            // Few valid words: likely properly encrypted
            scores['vigenere-like'] += 0.2;
            scores['random-unknown'] += 0.2;
        }

        // --- Heuristic 7: Specific Cipher Pattern Detection ---
        // Detect patterns that indicate specific cipher types
        
        // Polybius Square: Contains number pairs (11-55)
        const numberPairs = text.match(/\d{2}/g);
        if (numberPairs && numberPairs.length >= 5) {
            // Check if pairs are in valid range (11-55)
            const validPairs = numberPairs.filter(p => {
                const num = parseInt(p);
                return num >= 11 && num <= 55;
            });
            if (validPairs.length >= numberPairs.length * 0.8) {
                // High percentage of valid Polybius pairs
                scores['monoalphabetic-substitution'] += 0.5;
                scores['caesar-shift'] += 0.2; // Polybius is a substitution cipher
            }
        }
        
        // Baconian: Contains A/B patterns (5-bit groups) or binary patterns
        const baconianPattern = /[ABab]{5,}/.test(text) || /[01]{5,}/.test(text);
        if (baconianPattern) {
            scores['monoalphabetic-substitution'] += 0.4;
        }
        
        // Atbash: Very high IC (>= 1.6) with monoalphabetic characteristics
        // Atbash is essentially Caesar shift 25, so it has very high IC
        // It's hard to distinguish from other monoalphabetic ciphers statistically,
        // but we can boost monoalphabetic score when IC is very high
        if (ic >= 1.6 && !kasiski.hasRepetitions) {
            scores['monoalphabetic-substitution'] += 0.3;
            scores['caesar-shift'] += 0.2; // Atbash is similar to Caesar shift 25
        }

        // Normalize scores to [0, 1] and filter out very low scores
        const maxScore = Math.max(...Object.values(scores));
        const families = [];

        for (const type in scores) {
            const normalizedScore = maxScore > 0 ? scores[type] / maxScore : 0;
            if (normalizedScore > 0.2) { // Only include if confidence > 20%
                families.push({
                    type: type,
                    confidence: parseFloat(normalizedScore.toFixed(2)),
                    ...(type === 'vigenere-like' && kasiski.suggestedKeyLengths.length > 0 && {
                        suggestedKeyLength: kasiski.suggestedKeyLengths[0].keyLength
                    })
                });
            }
        }

        // Sort by confidence (descending)
        families.sort((a, b) => b.confidence - a.confidence);

        return {
            families: families.length > 0 ? families : [{ type: 'unknown', confidence: 1.0, reason: 'Unable to classify' }],
            stats: {
                length: length,
                ic: parseFloat(ic.toFixed(2)),
                entropy: parseFloat(entropy.toFixed(2)),
                hasRepetitions: kasiski.hasRepetitions,
                suggestedKeyLengths: kasiski.suggestedKeyLengths.slice(0, 3) // Top 3
            }
        };
    }

    /**
     * Returns a human-readable description of a cipher type.
     * @param {string} type - The cipher type identifier.
     * @returns {string} A description of the cipher.
     */
    static getDescription(type) {
        const descriptions = {
            'monoalphabetic-substitution': 'Monoalphabetic Substitution (each letter maps to one other letter)',
            'caesar-shift': 'Caesar Shift (simple rotation of the alphabet)',
            'vigenere-like': 'Polyalphabetic Cipher (Vigenère, Beaufort, etc.)',
            'transposition': 'Transposition Cipher (letters are rearranged, not substituted)',
            'random-unknown': 'Strong Cipher or Random Text (high entropy, uniform distribution)',
            'unknown': 'Unknown or Unclassifiable'
        };
        return descriptions[type] || 'Unknown cipher type';
    }
}

