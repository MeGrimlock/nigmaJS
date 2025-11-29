/**
 * Word Segmentation
 * 
 * Inserts spaces into continuous text using dictionary-based dynamic programming.
 * This is used after decryption to reconstruct readable text from continuous plaintext.
 */

/**
 * Segments continuous text into words using dictionary
 * Uses dynamic programming to find optimal word boundaries
 * @param {string} text - Continuous text without spaces
 * @param {Set|Object} dictionary - Dictionary of valid words
 * @param {Object} options - Options
 * @param {number} options.maxWordLength - Maximum word length to consider (default: 20)
 * @param {number} options.minWordLength - Minimum word length to consider (default: 2)
 * @param {boolean} options.preserveUnknown - If true, unknown sequences are kept as-is (default: true)
 * @returns {string} Text with spaces inserted
 */
export function segmentText(text, dictionary, options = {}) {
    const {
        maxWordLength = 20,
        minWordLength = 2,
        preserveUnknown = true
    } = options;

    if (!text || !dictionary) return text;
    if (text.length === 0) return text;

    const n = text.length;
    const dp = new Array(n + 1).fill(null);
    dp[0] = { words: [], score: 0 };

    // Helper to check if word exists in dictionary
    const hasWord = (word) => {
        if (dictionary instanceof Set) {
            return dictionary.has(word);
        } else if (typeof dictionary.has === 'function') {
            return dictionary.has(word);
        } else if (typeof dictionary === 'object' && dictionary !== null) {
            return word in dictionary;
        }
        return false;
    };

    // Dynamic programming: find best segmentation
    for (let i = 0; i < n; i++) {
        if (dp[i] === null) continue;

        // Try words from i to i+maxWordLength
        for (let j = i + minWordLength; j <= Math.min(n, i + maxWordLength); j++) {
            const word = text.slice(i, j);
            if (hasWord(word)) {
                const candidate = {
                    words: [...dp[i].words, word],
                    score: dp[i].score + word.length // Prefer longer words
                };
                
                // Update if this is better (more words or better score)
                if (dp[j] === null || 
                    candidate.words.length > dp[j].words.length ||
                    (candidate.words.length === dp[j].words.length && candidate.score > dp[j].score)) {
                    dp[j] = candidate;
                }
            }
        }
    }

    // If we found a solution, join words with spaces
    if (dp[n] && dp[n].words.length > 0) {
        return dp[n].words.join(' ');
    }

    // Fallback: if preserveUnknown, try to segment what we can
    if (preserveUnknown) {
        return segmentWithFallback(text, dictionary, { maxWordLength, minWordLength });
    }

    // No solution found, return original
    return text;
}

/**
 * Fallback segmentation: segments what it can, preserves unknown sequences
 * @private
 */
function segmentWithFallback(text, dictionary, options) {
    const { maxWordLength = 20, minWordLength = 2 } = options;
    const hasWord = (word) => {
        if (dictionary instanceof Set) return dictionary.has(word);
        if (typeof dictionary.has === 'function') return dictionary.has(word);
        if (typeof dictionary === 'object' && dictionary !== null) return word in dictionary;
        return false;
    };

    const result = [];
    let i = 0;
    
    while (i < text.length) {
        let found = false;
        let bestWord = null;
        let bestLen = 0;
        
        // Try to find longest word starting at position i
        for (let len = Math.min(maxWordLength, text.length - i); len >= minWordLength; len--) {
            const word = text.slice(i, i + len);
            if (hasWord(word)) {
                bestWord = word;
                bestLen = len;
                found = true;
                break; // Take longest valid word
            }
        }
        
        if (found) {
            result.push(bestWord);
            i += bestLen;
        } else {
            // No word found, take single character and continue
            result.push(text[i]);
            i++;
        }
    }
    
    return result.join(' ');
}

/**
 * Segments text with confidence scoring
 * Returns both segmented text and confidence metrics
 * @param {string} text - Continuous text
 * @param {Set|Object} dictionary - Dictionary
 * @param {Object} options - Options
 * @returns {Object} { segmented: string, confidence: number, wordCount: number, coverage: number }
 */
export function segmentTextWithConfidence(text, dictionary, options = {}) {
    const segmented = segmentText(text, dictionary, options);
    const words = segmented.split(/\s+/);
    
    // Calculate confidence metrics
    const hasWord = (word) => {
        if (dictionary instanceof Set) return dictionary.has(word);
        if (typeof dictionary.has === 'function') return dictionary.has(word);
        if (typeof dictionary === 'object' && dictionary !== null) return word in dictionary;
        return false;
    };
    
    let validWords = 0;
    let totalChars = 0;
    let validChars = 0;
    
    for (const word of words) {
        const wordUpper = word.toUpperCase();
        totalChars += word.length;
        if (hasWord(wordUpper)) {
            validWords++;
            validChars += word.length;
        }
    }
    
    const wordCoverage = words.length > 0 ? validWords / words.length : 0;
    const charCoverage = totalChars > 0 ? validChars / totalChars : 0;
    const confidence = (wordCoverage * 0.7) + (charCoverage * 0.3); // Weighted average
    
    return {
        segmented,
        confidence,
        wordCount: words.length,
        validWords,
        wordCoverage,
        charCoverage
    };
}

export default {
    segmentText,
    segmentTextWithConfidence
};

