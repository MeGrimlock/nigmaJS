import { default as Dictionary } from '../../ciphers/dictionary/dictionary.js';
import { Scorer } from '../../search/scorer.js';
import { TextUtils } from '../../core/text-utils.js';
import { LanguageAnalysis } from '../../analysis/analysis-core.js';

/**
 * Baconian Cipher Solver
 * 
 * Baconian encodes letters as 5-bit patterns (A/B or 0/1).
 * Strategy: Try both A/B and 0/1 patterns, validate with dictionary + n-grams.
 */
export class BaconianSolver {
    constructor(language = 'english') {
        this.language = language;
    }

    /**
     * Solves Baconian cipher.
     * @param {string} ciphertext - The encrypted text
     * @returns {Promise<Object>} Result with plaintext, method, confidence, score, etc.
     */
    async solve(ciphertext) {
        // Handle null/undefined input
        if (!ciphertext) {
            return {
                plaintext: '',
                method: 'baconian',
                confidence: 0,
                score: -Infinity,
                key: null,
                pattern: null,
                wordCoverage: 0
            };
        }

        // Handle empty input
        if (ciphertext.length === 0) {
            return {
                plaintext: '',
                method: 'baconian',
                confidence: 0,
                score: -Infinity,
                key: null,
                pattern: null,
                wordCoverage: 0
            };
        }

        let scorer;
        try {
            scorer = new Scorer(this.language, 4);
        } catch (error) {
            // Fallback to English if language not supported
            try {
                scorer = new Scorer('english', 4);
            } catch (fallbackError) {
                // If even English fails, return error result
                return {
                    plaintext: ciphertext,
                    method: 'baconian',
                    confidence: 0,
                    score: -Infinity,
                    key: null,
                    pattern: null,
                    wordCoverage: 0,
                    error: 'Language model not available'
                };
            }
        }

        const dict = LanguageAnalysis.getDictionary(this.language);

        let bestResult = {
            plaintext: ciphertext,
            method: 'baconian',
            confidence: 0,
            score: -Infinity,
            key: null,
            pattern: null,
            wordCoverage: 0
        };

        // Patterns to try: A/B and 0/1
        const patterns = [
            { name: 'A/B', convert: (text) => text }, // No conversion needed
            { name: '0/1', convert: (text) => text.replace(/0/g, 'a').replace(/1/g, 'b') } // Convert 0->a, 1->b
        ];

        for (const pattern of patterns) {
            try {
                // Convert the ciphertext if needed (for 0/1 pattern)
                const convertedCiphertext = pattern.convert(ciphertext);

                const baconian = new Dictionary.Baconian(convertedCiphertext, true); // encoded = true
                const plaintext = baconian.decode();

                // Even if decode returns empty, try to score what we have
                const cleanText = TextUtils.onlyLetters(plaintext || convertedCiphertext);

                // Much lower threshold - Baconian can work with very short texts
                if (cleanText.length >= 1) {
                    const score = scorer.score(cleanText);

                    // Validate with dictionary
                    let wordCoverage = 0;
                    if (dict && plaintext) {
                        const words = plaintext.toUpperCase()
                            .split(/\s+/)
                            .map(w => TextUtils.onlyLetters(w))
                            .filter(w => w.length >= 2); // Even shorter words

                        if (words.length > 0) {
                            let validWords = 0;
                            for (const word of words) {
                                if (dict.has(word)) {
                                    validWords++;
                                }
                            }
                            wordCoverage = validWords / words.length;
                        }
                    }

                    const combinedScore = score + (wordCoverage * 20); // Lower word bonus

                    // Always update if this is our first valid result, or if score is better
                    if (bestResult.confidence === 0 || combinedScore > bestResult.score) {
                        let confidence = 0.1; // Very low base confidence
                        if (wordCoverage > 0.5) {
                            confidence = 0.8;
                        } else if (wordCoverage > 0.2) {
                            confidence = 0.6;
                        } else if (score > -20) {
                            confidence = 0.4;
                        } else if (score > -50) {
                            confidence = 0.2;
                        }

                        bestResult = {
                            plaintext: plaintext || convertedCiphertext, // Fallback if decode fails
                            method: 'baconian',
                            confidence: confidence,
                            score: combinedScore,
                            key: null,
                            pattern: pattern.name, // Always set the pattern name
                            wordCoverage: wordCoverage
                        };
                    }
                }
            } catch (error) {
                // If this pattern fails, try the next one
                continue;
            }
        }

        return bestResult;
    }
}

