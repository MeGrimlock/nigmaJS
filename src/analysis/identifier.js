import { Stats } from './stats.js';
import { Kasiski } from './kasiski.js';
import { TextUtils } from '../core/text-utils.js';

/**
 * Cipher Identifier: Analyzes ciphertext to suggest the type of cipher used.
 * Combines Index of Coincidence, Kasiski examination, entropy, and heuristics.
 */
export class CipherIdentifier {
    /**
     * Identifies the probable cipher type(s) for a given ciphertext.
     * @param {string} text - The ciphertext to analyze.
     * @returns {Object} An object containing cipher families with confidence scores.
     */
    static identify(text) {
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

        // Initialize confidence scores for each cipher family
        const scores = {
            'monoalphabetic-substitution': 0,
            'caesar-shift': 0,
            'vigenere-like': 0,
            'transposition': 0,
            'random-unknown': 0
        };

        // --- Heuristic 1: Index of Coincidence ---
        // Monoalphabetic: IC ≈ 1.5-2.0 (preserves letter frequency)
        // Polyalphabetic (Vigenère): IC ≈ 1.0-1.4 (flattens frequency)
        // Random/Strong: IC ≈ 1.0 (uniform distribution)
        // Transposition: IC ≈ 1.5-2.0 (preserves frequency, just reorders)

        if (ic >= 1.5) {
            scores['monoalphabetic-substitution'] += 1.0;
            scores['caesar-shift'] += 0.9; // Caesar is a special case of monoalphabetic
            scores['transposition'] += 0.6;
        } else if (ic >= 1.2 && ic < 1.5) {
            scores['vigenere-like'] += 0.9;
            scores['monoalphabetic-substitution'] += 0.3;
        } else if (ic < 1.2) {
            scores['vigenere-like'] += 0.7;
            scores['random-unknown'] += 0.8;
        }

        // --- Heuristic 2: Kasiski Examination ---
        // If we find repeated n-grams with consistent distances, it's likely polyalphabetic
        // BUT: If IC is very high (> 1.6), repetitions are from plaintext, not polyalphabetic cipher
        if (kasiski.hasRepetitions && kasiski.suggestedKeyLengths.length > 0 && ic < 1.6) {
            const topKeyLength = kasiski.suggestedKeyLengths[0];
            if (topKeyLength.score > 0.3) { // Strong evidence
                scores['vigenere-like'] += 1.2;
                scores['monoalphabetic-substitution'] -= 0.5;
                scores['caesar-shift'] -= 0.5;
            } else if (topKeyLength.score > 0.1) { // Weak evidence
                scores['vigenere-like'] += 0.6;
            }
        } else {
            // No repetitions → likely monoalphabetic or very short key
            scores['monoalphabetic-substitution'] += 0.5;
            scores['caesar-shift'] += 0.4;
        }

        // --- Heuristic 3: Entropy ---
        // High entropy (close to 4.7) → strong cipher or random
        // Low entropy (< 3.5) → weak cipher or plaintext leak
        // Transposition preserves entropy of plaintext (~4.0-4.2 for English)
        if (entropy >= 4.3) {
            scores['random-unknown'] += 0.5;
            scores['vigenere-like'] += 0.2;
        } else if (entropy >= 3.8 && entropy < 4.3) {
            scores['transposition'] += 0.5;
            scores['vigenere-like'] += 0.3;
        } else if (entropy < 3.8) {
            scores['monoalphabetic-substitution'] += 0.3;
            scores['caesar-shift'] += 0.3;
        }

        // --- Heuristic 4: Text Length ---
        // Very short texts are hard to classify, boost "unknown"
        if (length < 50) {
            scores['random-unknown'] += 0.2;
        }

        // --- Heuristic 5: Caesar Shift Detection ---
        // If IC is high (>= 1.4), it's likely Caesar or simple substitution (even with repetitions from plaintext)
        if (ic >= 1.4) {
            scores['caesar-shift'] += 0.8;
            scores['monoalphabetic-substitution'] += 0.7;
            // Penalize vigenere if IC is too high
            scores['vigenere-like'] -= 0.6;
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

