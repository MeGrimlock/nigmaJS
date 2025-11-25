import 'regenerator-runtime/runtime';
import { TextUtils } from '../core/text-utils.js';
import { LanguageAnalysis } from '../analysis/analysis.js';

// Flag to check if we're in browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * DictionaryValidator
 * 
 * Validates decrypted text against language dictionaries to assess
 * the quality and confidence of a decryption result.
 * 
 * Key Metrics:
 * - Word Coverage: % of characters in valid dictionary words
 * - Word Count: Number of valid words found
 * - Average Word Length: Longer valid words = higher confidence
 * - Vocabulary Richness: Unique words / Total words
 */

export class DictionaryValidator {
    constructor(language = 'english') {
        this.language = language;
        this.dictionaryLoaded = false;
    }

    /**
     * Ensures the dictionary for the current language is loaded.
     * @param {string} basePath - Path to dictionary files (default: 'data/')
     * @returns {Promise<boolean>} True if loaded successfully
     */
    async ensureDictionaryLoaded(basePath = 'data/') {
        if (this.dictionaryLoaded) return true;
        
        try {
            // Try to load dictionary
            const loaded = await LanguageAnalysis.loadDictionary(this.language, basePath);
            if (loaded) {
                this.dictionaryLoaded = true;
                return true;
            }
            
            // If loading failed in browser, try alternative path
            if (isBrowser && !loaded) {
                console.warn(`[DictionaryValidator] Failed to load from ${basePath}, trying alternative path...`);
                const altLoaded = await LanguageAnalysis.loadDictionary(this.language, '../demo/data/');
                if (altLoaded) {
                    this.dictionaryLoaded = true;
                    return true;
                }
            }
            
            console.error(`[DictionaryValidator] Could not load dictionary for ${this.language}`);
            return false;
        } catch (error) {
            console.error(`[DictionaryValidator] Failed to load dictionary for ${this.language}:`, error);
            return false;
        }
    }

    /**
     * Validates a decrypted text against the dictionary.
     * 
     * @param {string} text - The decrypted plaintext to validate
     * @param {Object} options - Validation options
     * @param {number} options.minWordLength - Minimum word length to consider (default: 3)
     * @param {boolean} options.strict - If true, only count words >= minWordLength (default: false)
     * @returns {Promise<Object>} Validation result with metrics and confidence score
     */
    async validate(text, options = {}) {
        const {
            minWordLength = 3,
            strict = false
        } = options;

        // Ensure dictionary is loaded
        const loaded = await this.ensureDictionaryLoaded();
        if (!loaded) {
            return {
                valid: false,
                confidence: 0,
                error: 'Dictionary not available',
                metrics: {}
            };
        }

        // Clean and normalize text
        const cleanText = TextUtils.onlyLetters(text);
        if (cleanText.length === 0) {
            return {
                valid: false,
                confidence: 0,
                error: 'Empty text',
                metrics: {}
            };
        }

        // Extract words (split by spaces in original text, then clean)
        const words = text.toUpperCase()
            .split(/\s+/)
            .map(w => TextUtils.onlyLetters(w))
            .filter(w => w.length > 0);

        if (words.length === 0) {
            return {
                valid: false,
                confidence: 0,
                error: 'No words found',
                metrics: {}
            };
        }

        // Get dictionary
        const dictionary = LanguageAnalysis.getDictionary(this.language);
        if (!dictionary) {
            return {
                valid: false,
                confidence: 0,
                error: 'Dictionary not loaded',
                metrics: {}
            };
        }

        // Count valid words and characters
        let validWords = 0;
        let validChars = 0;
        let totalChars = 0;
        const validWordLengths = [];
        const uniqueWords = new Set();
        const foundWords = [];

        for (const word of words) {
            totalChars += word.length;
            
            // Skip very short words if strict mode
            if (strict && word.length < minWordLength) {
                continue;
            }

            if (dictionary.has(word)) {
                validWords++;
                validChars += word.length;
                validWordLengths.push(word.length);
                uniqueWords.add(word);
                foundWords.push(word);
            }
        }

        // Calculate metrics
        const wordCoverage = words.length > 0 ? (validWords / words.length) * 100 : 0;
        const charCoverage = totalChars > 0 ? (validChars / totalChars) * 100 : 0;
        const avgWordLength = validWordLengths.length > 0 
            ? validWordLengths.reduce((a, b) => a + b, 0) / validWordLengths.length 
            : 0;
        const vocabularyRichness = validWords > 0 ? (uniqueWords.size / validWords) : 0;

        // Calculate confidence score (0-1)
        // Weighted combination of metrics:
        // - 40% character coverage (most important)
        // - 30% word coverage
        // - 20% average word length (normalized to 0-1, max at 8+ chars)
        // - 10% vocabulary richness
        const confidence = Math.min(1, 
            (charCoverage / 100) * 0.4 +
            (wordCoverage / 100) * 0.3 +
            Math.min(avgWordLength / 8, 1) * 0.2 +
            vocabularyRichness * 0.1
        );

        // Determine if valid (confidence > 0.5 is generally good)
        const valid = confidence > 0.5;

        return {
            valid,
            confidence,
            metrics: {
                totalWords: words.length,
                validWords,
                wordCoverage: wordCoverage.toFixed(2),
                totalChars,
                validChars,
                charCoverage: charCoverage.toFixed(2),
                avgWordLength: avgWordLength.toFixed(2),
                vocabularyRichness: vocabularyRichness.toFixed(2),
                uniqueWords: uniqueWords.size,
                longestValidWord: validWordLengths.length > 0 ? Math.max(...validWordLengths) : 0
            },
            foundWords: foundWords.slice(0, 10), // First 10 valid words as sample
            summary: this.generateSummary(confidence, wordCoverage, charCoverage)
        };
    }

    /**
     * Generates a human-readable summary of the validation result.
     * @private
     */
    generateSummary(confidence, wordCoverage, charCoverage) {
        if (confidence > 0.9) {
            return `Excellent match (${(confidence * 100).toFixed(0)}% confidence). Text appears to be valid ${this.language}.`;
        } else if (confidence > 0.7) {
            return `Good match (${(confidence * 100).toFixed(0)}% confidence). Most words are valid ${this.language}.`;
        } else if (confidence > 0.5) {
            return `Moderate match (${(confidence * 100).toFixed(0)}% confidence). Some valid ${this.language} words found.`;
        } else if (confidence > 0.3) {
            return `Weak match (${(confidence * 100).toFixed(0)}% confidence). Few valid words found.`;
        } else {
            return `Poor match (${(confidence * 100).toFixed(0)}% confidence). Text does not appear to be valid ${this.language}.`;
        }
    }

    /**
     * Validates multiple decryption results and ranks them by confidence.
     * 
     * @param {Array<Object>} results - Array of decryption results with { plaintext, ... }
     * @returns {Promise<Array<Object>>} Ranked results with validation metrics
     */
    async validateMultiple(results) {
        const validatedResults = [];

        for (const result of results) {
            // Skip results without plaintext or with invalid plaintext
            if (!result.plaintext || typeof result.plaintext !== 'string' || result.plaintext.length === 0) {
                console.warn(`[DictionaryValidator] Skipping result with invalid plaintext: method=${result.method}, plaintext type=${typeof result.plaintext}`);
                validatedResults.push({
                    ...result,
                    validation: {
                        valid: false,
                        confidence: 0,
                        error: 'No plaintext available',
                        metrics: {
                            validWords: 0,
                            wordCoverage: '0.00',
                            charCoverage: '0.00',
                            avgWordLength: '0.00'
                        },
                        summary: 'No plaintext to validate'
                    },
                    confidence: result.confidence || 0
                });
                continue;
            }

            try {
                const validation = await this.validate(result.plaintext);
                validatedResults.push({
                    ...result,
                    validation,
                    // Update confidence to be weighted average of original + dictionary validation
                    confidence: result.confidence && !isNaN(result.confidence)
                        ? (result.confidence * 0.6 + validation.confidence * 0.4)
                        : validation.confidence
                });
            } catch (error) {
                console.error(`[DictionaryValidator] Error validating result for method ${result.method}:`, error);
                validatedResults.push({
                    ...result,
                    validation: {
                        valid: false,
                        confidence: 0,
                        error: error.message || 'Validation failed',
                        metrics: {
                            validWords: 0,
                            wordCoverage: '0.00',
                            charCoverage: '0.00',
                            avgWordLength: '0.00'
                        },
                        summary: 'Validation error occurred'
                    },
                    confidence: result.confidence || 0
                });
            }
        }

        // Sort by updated confidence (descending)
        validatedResults.sort((a, b) => {
            const confA = a.confidence || 0;
            const confB = b.confidence || 0;
            if (isNaN(confA)) return 1; // NaN goes to end
            if (isNaN(confB)) return -1;
            return confB - confA;
        });

        return validatedResults;
    }

    /**
     * Quick check: Does text contain ANY valid words?
     * Useful for fast rejection of obviously wrong decryptions.
     * 
     * @param {string} text - Text to check
     * @param {number} minWords - Minimum number of valid words to consider it valid (default: 3)
     * @returns {Promise<boolean>} True if text contains enough valid words
     */
    async hasValidWords(text, minWords = 3) {
        const validation = await this.validate(text);
        return validation.metrics.validWords >= minWords;
    }
}

/**
 * Helper function to get dictionary for a language (used by LanguageAnalysis)
 * This is added to LanguageAnalysis class via monkey-patching if not present.
 */
if (!LanguageAnalysis.getDictionary) {
    LanguageAnalysis.getDictionary = function(language) {
        // Access private dictionaries object
        // This is a workaround - ideally LanguageAnalysis should expose this method
        const dictionaries = {
            english: null,
            spanish: null
        };
        
        // Try to access from module scope (requires modification to analysis.js)
        // For now, return null and rely on proper integration
        return null;
    };
}

