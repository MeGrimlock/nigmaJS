import { TextUtils } from './text-utils.js';

/**
 * Text Preprocessor
 * 
 * Normalizes ciphertext input and provides a clean interface for analysis.
 * Separates raw user input from cleaned text used for cryptanalysis.
 */

/**
 * Supported alphabets for different cipher types
 */
export const ALPHABETS = {
    'A-Z': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'A-Z+Ñ': 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ',
    'A-Z+0-9': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    'A-Z+0-9+Ñ': 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789',
    'PRINTABLE': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
};

/**
 * Character mapping for normalization (accented to unaccented)
 */
const ACCENT_MAP = {
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ü': 'U',
    'á': 'A', 'é': 'E', 'í': 'I', 'ó': 'O', 'ú': 'U', 'ü': 'U',
    'À': 'A', 'È': 'E', 'Ì': 'I', 'Ò': 'O', 'Ù': 'U',
    'à': 'A', 'è': 'E', 'ì': 'I', 'ò': 'O', 'ù': 'U',
    'Â': 'A', 'Ê': 'E', 'Î': 'I', 'Ô': 'O', 'Û': 'U',
    'â': 'A', 'ê': 'E', 'î': 'I', 'ô': 'O', 'û': 'U',
    'Ã': 'A', 'Õ': 'O',
    'ã': 'A', 'õ': 'O',
    'Ç': 'C', 'ç': 'C',
    'Ñ': 'N', 'ñ': 'N'
};

/**
 * Normalizes ciphertext input
 * @param {string} raw - Raw user input (may contain spaces, newlines, punctuation)
 * @param {string} alphabetType - Type of alphabet to use (default: 'A-Z')
 * @param {Object} options - Options
 * @param {boolean} options.removeSpaces - Remove spaces (default: true)
 * @param {boolean} options.removePunctuation - Remove punctuation (default: true)
 * @param {boolean} options.mapAccents - Map accented characters to unaccented (default: true)
 * @returns {Object} { original, cleaned, alphabet, meta }
 */
export function normalizeCiphertext(raw, alphabetType = 'A-Z', options = {}) {
    const {
        removeSpaces = true,
        removePunctuation = true,
        mapAccents = true
    } = options;

    const original = raw;
    let cleaned = raw;

    // Step 1: Convert to uppercase
    cleaned = cleaned.toUpperCase();

    // Step 2: Map accented characters to unaccented (if enabled)
    if (mapAccents) {
        for (const [accented, unaccented] of Object.entries(ACCENT_MAP)) {
            cleaned = cleaned.replace(new RegExp(accented, 'g'), unaccented);
        }
    }

    // Step 3: Get allowed alphabet
    const alphabet = ALPHABETS[alphabetType] || ALPHABETS['A-Z'];
    const alphabetSet = new Set(alphabet);

    // Step 4: Filter characters based on alphabet
    if (removeSpaces && removePunctuation) {
        // Remove everything not in alphabet
        cleaned = cleaned.split('').filter(ch => alphabetSet.has(ch)).join('');
    } else if (removePunctuation) {
        // Keep spaces but remove punctuation
        cleaned = cleaned.split('').filter(ch => alphabetSet.has(ch) || ch === ' ').join('');
        if (removeSpaces) {
            cleaned = cleaned.replace(/\s+/g, '');
        }
    } else {
        // Keep only alphabet characters, remove rest
        cleaned = cleaned.split('').filter(ch => alphabetSet.has(ch)).join('');
    }

    // Metadata
    const meta = {
        originalLength: original.length,
        cleanedLength: cleaned.length,
        removedChars: original.length - cleaned.length,
        alphabetType,
        hasSpaces: original.includes(' ') || original.includes('\n') || original.includes('\t'),
        hasPunctuation: /[.,!?;:()\[\]{}\-"'\/\\]/.test(original)
    };

    return {
        original,
        cleaned,
        alphabet,
        meta
    };
}

/**
 * Groups text into blocks for better readability
 * @param {string} text - Text to group
 * @param {number} blockSize - Size of each block (default: 5)
 * @param {string} separator - Separator between blocks (default: ' ')
 * @returns {string} Grouped text
 */
export function groupText(text, blockSize = 5, separator = ' ') {
    if (!text) return '';
    const chunks = [];
    for (let i = 0; i < text.length; i += blockSize) {
        chunks.push(text.slice(i, i + blockSize));
    }
    return chunks.join(separator);
}

/**
 * Formats text into lines of specified length
 * @param {string} text - Text to format
 * @param {number} lineLength - Length of each line (default: 50)
 * @returns {string} Formatted text with line breaks
 */
export function formatTextLines(text, lineLength = 50) {
    if (!text) return '';
    const lines = [];
    for (let i = 0; i < text.length; i += lineLength) {
        lines.push(text.slice(i, i + lineLength));
    }
    return lines.join('\n');
}

/**
 * Word segmentation using dynamic programming
 * Attempts to insert spaces into continuous text using dictionary
 * @param {string} text - Continuous text without spaces
 * @param {Set|Object} dictionary - Dictionary of valid words (Set or object with has method)
 * @param {Object} options - Options
 * @param {number} options.maxWordLength - Maximum word length to consider (default: 20)
 * @param {number} options.minWordLength - Minimum word length to consider (default: 2)
 * @returns {string} Text with spaces inserted
 */
export function segmentText(text, dictionary, options = {}) {
    const {
        maxWordLength = 20,
        minWordLength = 2
    } = options;

    if (!text || !dictionary) return text;

    const n = text.length;
    const dp = new Array(n + 1).fill(null);
    dp[0] = [];

    // Helper to check if word exists in dictionary
    const hasWord = (word) => {
        if (dictionary instanceof Set) {
            return dictionary.has(word);
        } else if (typeof dictionary.has === 'function') {
            return dictionary.has(word);
        } else if (typeof dictionary === 'object') {
            return word in dictionary;
        }
        return false;
    };

    for (let i = 0; i < n; i++) {
        if (dp[i] === null) continue;

        // Try words from i to i+maxWordLength
        for (let j = i + minWordLength; j <= Math.min(n, i + maxWordLength); j++) {
            const word = text.slice(i, j);
            if (hasWord(word)) {
                const candidate = [...dp[i], word];
                // Prefer solutions with fewer words (greedy)
                if (dp[j] === null || candidate.length < dp[j].length) {
                    dp[j] = candidate;
                }
            }
        }
    }

    // If we found a solution, join words with spaces
    if (dp[n] && dp[n].length > 0) {
        return dp[n].join(' ');
    }

    // Fallback: return original text
    return text;
}

/**
 * CipherText class - Model for ciphertext data
 */
export class CipherText {
    constructor(raw, alphabetType = 'A-Z', options = {}) {
        const normalized = normalizeCiphertext(raw, alphabetType, options);
        this.raw = normalized.original;
        this.cleaned = normalized.cleaned;
        this.alphabet = normalized.alphabet;
        this.meta = normalized.meta;
    }

    /**
     * Get grouped representation (blocks of 5)
     */
    getGrouped(blockSize = 5) {
        return groupText(this.cleaned, blockSize);
    }

    /**
     * Get formatted representation (lines of 50 chars)
     */
    getFormatted(lineLength = 50) {
        return formatTextLines(this.cleaned, lineLength);
    }

    /**
     * Segment text using dictionary
     */
    segment(dictionary, options = {}) {
        return segmentText(this.cleaned, dictionary, options);
    }
}

export default {
    normalizeCiphertext,
    groupText,
    formatTextLines,
    segmentText,
    CipherText,
    ALPHABETS
};

