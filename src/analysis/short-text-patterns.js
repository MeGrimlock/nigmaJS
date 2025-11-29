import { TextUtils } from '../core/text-utils.js';
import configLoader from '../config/config-loader.js';

/**
 * Short Text Patterns for Cryptographic Analysis
 * 
 * This module provides specialized dictionaries and patterns for short texts
 * where traditional dictionary validation is unreliable due to low word count.
 * 
 * Features:
 * - Common words list (ultra-frequent words like "the", "and", "of", etc.)
 * - Common n-grams (bigrams/trigrams like "th", "he", "the", etc.)
 * - Pattern scoring for short texts
 * 
 * This helps improve validation for:
 * - Autokey short/medium
 * - Caesar short
 * - Other ciphers with short ciphertexts
 */
export class ShortTextPatterns {
    /**
     * Common words for English (ultra-frequent, appear in most texts)
     */
    static commonWordsEnglish = new Set([
        'THE', 'AND', 'OF', 'TO', 'IN', 'IS', 'IT', 'YOU', 'THAT', 'HE',
        'WAS', 'FOR', 'ON', 'ARE', 'AS', 'WITH', 'HIS', 'THEY', 'I', 'AT',
        'BE', 'THIS', 'HAVE', 'FROM', 'OR', 'ONE', 'HAD', 'BY', 'WORD', 'BUT',
        'NOT', 'WHAT', 'ALL', 'WERE', 'WE', 'WHEN', 'YOUR', 'CAN', 'SAID',
        'THERE', 'EACH', 'WHICH', 'SHE', 'DO', 'HOW', 'THEIR', 'IF', 'WILL',
        'UP', 'OTHER', 'ABOUT', 'OUT', 'MANY', 'THEN', 'THEM', 'THESE', 'SO',
        'SOME', 'HER', 'WOULD', 'MAKE', 'LIKE', 'INTO', 'HIM', 'TIME', 'HAS',
        'LOOK', 'TWO', 'MORE', 'WRITE', 'GO', 'SEE', 'NUMBER', 'NO', 'WAY',
        'COULD', 'PEOPLE', 'MY', 'THAN', 'FIRST', 'WATER', 'BEEN', 'CALL',
        'WHO', 'OIL', 'SIT', 'NOW', 'FIND', 'DOWN', 'DAY', 'DID', 'GET',
        'COME', 'MADE', 'MAY', 'PART'
    ]);
    
    /**
     * Common words for Spanish
     */
    static commonWordsSpanish = new Set([
        'EL', 'LA', 'DE', 'QUE', 'Y', 'A', 'EN', 'UN', 'SER', 'SE',
        'NO', 'HABER', 'POR', 'CON', 'SU', 'PARA', 'COMO', 'ESTAR', 'TENER',
        'LE', 'LO', 'TODO', 'PERO', 'MÁS', 'HACER', 'O', 'PODER', 'DECIR',
        'ESTE', 'IR', 'OTRO', 'ESE', 'LA', 'SI', 'ME', 'YA', 'VER', 'PORQUE',
        'DAR', 'CUANDO', 'ÉL', 'MUY', 'SIN', 'VEZ', 'MUCHO', 'SABER', 'QUÉ',
        'SOBRE', 'MI', 'ALGUNO', 'MISMO', 'YO', 'TAMBIÉN', 'HASTA', 'AÑO',
        'DOS', 'QUERER', 'ENTRE', 'ASÍ', 'PRIMERO', 'DESDE', 'GRANDE', 'ESO',
        'NI', 'NOS', 'LLEGAR', 'PASAR', 'TIEMPO', 'ELLA', 'SI', 'SÍ', 'DÍA',
        'UNO', 'BIEN', 'POCOS', 'TANTO', 'SEGUIR', 'HACER', 'MODO', 'NUEVO'
    ]);
    
    /**
     * Common bigrams for English (most frequent letter pairs)
     */
    static commonBigramsEnglish = new Set([
        'TH', 'HE', 'IN', 'ER', 'AN', 'RE', 'ED', 'ON', 'ES', 'ST',
        'EN', 'AT', 'TO', 'NT', 'HA', 'ND', 'OU', 'EA', 'NG', 'AS',
        'OR', 'TI', 'IS', 'ET', 'IT', 'AR', 'TE', 'SE', 'HI', 'OF'
    ]);
    
    /**
     * Common trigrams for English (most frequent letter triplets)
     */
    static commonTrigramsEnglish = new Set([
        'THE', 'AND', 'THA', 'ENT', 'ING', 'ION', 'TIO', 'FOR', 'NDE',
        'HAS', 'NCE', 'EDT', 'TIS', 'OFT', 'STH', 'MEN', 'HER', 'HAT',
        'HIS', 'ERE', 'FOR', 'ENT', 'ION', 'TER', 'WAS', 'YOU', 'ITH',
        'VER', 'ALL', 'WIT', 'THI', 'TIO', 'NDE', 'HAS', 'NCE', 'EDT'
    ]);
    
    /**
     * Gets common words for a language.
     * @param {string} language - Language code
     * @returns {Set<string>} Set of common words
     */
    static getCommonWords(language) {
        const languageMap = {
            'english': ShortTextPatterns.commonWordsEnglish,
            'spanish': ShortTextPatterns.commonWordsSpanish
        };
        return languageMap[language.toLowerCase()] || new Set(); // Return empty set for unknown languages
    }
    
    /**
     * Gets common bigrams for a language.
     * @param {string} language - Language code
     * @returns {Set<string>} Set of common bigrams
     */
    static getCommonBigrams(language) {
        // For now, only English bigrams are defined
        // Can be extended for other languages
        if (language.toLowerCase() === 'english') {
            return ShortTextPatterns.commonBigramsEnglish;
        }
        return new Set(); // Empty set for unsupported languages
    }
    
    /**
     * Gets common trigrams for a language.
     * @param {string} language - Language code
     * @returns {Set<string>} Set of common trigrams
     */
    static getCommonTrigrams(language) {
        // For now, only English trigrams are defined
        if (language.toLowerCase() === 'english') {
            return ShortTextPatterns.commonTrigramsEnglish;
        }
        return new Set(); // Empty set for unsupported languages
    }
    
    /**
     * Scores text using common words and patterns.
     * Useful for short texts where traditional dictionary validation fails.
     * 
     * @param {string} text - Text to score
     * @param {string} language - Language code
     * @returns {Object} { wordScore, bigramScore, trigramScore, combinedScore }
     */
    static score(text, language = 'english') {
        const config = configLoader.loadConfig();
        const cleaned = text.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z\s]/g, '');
        const length = cleaned.replace(/\s/g, '').length;
        
        // Score common words
        const commonWords = ShortTextPatterns.getCommonWords(language);
        const words = cleaned.split(/\s+/).filter(w => w.length >= 2 && /^[A-Z]+$/.test(w));
        let wordHits = 0;
        let wordTotal = 0;

        for (const word of words) {
            wordTotal++;
            if (commonWords.has(word)) {
                wordHits++;
            }
        }
        
        const wordScore = wordTotal > 0 ? wordHits / wordTotal : 0;
        
        // Score common bigrams
        const lettersOnly = TextUtils.onlyLetters(cleaned);
        const commonBigrams = ShortTextPatterns.getCommonBigrams(language);
        let bigramHits = 0;
        let bigramTotal = 0;

        for (let i = 0; i < lettersOnly.length - 1; i++) {
            const bigram = lettersOnly.substring(i, i + 2);
            bigramTotal++;
            if (commonBigrams.has(bigram)) {
                bigramHits++;
            }
        }
        
        const bigramScore = bigramTotal > 0 ? bigramHits / bigramTotal : 0;
        
        // Score common trigrams
        const commonTrigrams = ShortTextPatterns.getCommonTrigrams(language);
        let trigramHits = 0;
        let trigramTotal = 0;

        for (let i = 0; i < lettersOnly.length - 2; i++) {
            const trigram = lettersOnly.substring(i, i + 3);
            trigramTotal++;
            if (commonTrigrams.has(trigram)) {
                trigramHits++;
            }
        }
        
        const trigramScore = trigramTotal > 0 ? trigramHits / trigramTotal : 0;
        
        // Combined score: weighted average
        // Words are most important, then trigrams, then bigrams
        const combinedScore = (wordScore * 0.5) + (trigramScore * 0.3) + (bigramScore * 0.2);
        
        return {
            wordScore: wordScore,
            wordCount: wordTotal,
            bigramScore: bigramScore,
            bigramCount: bigramTotal,
            trigramScore: trigramScore,
            trigramCount: trigramTotal,
            combinedScore: combinedScore
        };
    }
    
    /**
     * Analyzes short text patterns for cryptographic detection.
     * Detects symmetry patterns and other characteristics.
     *
     * @param {string} text - Text to analyze
     * @returns {Object} Analysis results with symmetryScore and other metrics
     */
    static analyzeShortText(text) {
        const config = configLoader.loadConfig();
        const cleaned = TextUtils.onlyLetters(text);
        if (cleaned.length < config.short_text_patterns.score.minimum_text_length) {
            return { symmetryScore: 0, length: cleaned.length, hasSymmetry: false };
        }

        // Detect symmetry patterns (like Atbash: ABC -> XYZ)
        let symmetryScore = 0;
        const len = cleaned.length;

        // Check for patterns where first half maps to second half
        if (len >= config.short_text_patterns.symmetry_analysis.minimum_length && len % 2 === 0) {
            const half = len / 2;
            const firstHalf = cleaned.substring(0, half);
            const secondHalf = cleaned.substring(half);

            // Simple symmetry check: A->Z, B->Y, etc.
            let symmetricPairs = 0;
            for (let i = 0; i < half; i++) {
                const first = firstHalf[i].charCodeAt(0) - 65; // A=0, B=1, etc.
                const second = secondHalf[i].charCodeAt(0) - 65;

                // Check if they form a symmetric pair (distance from start/end)
                const expectedSecond = 25 - first; // A->Z(25), B->Y(24), etc.
                if (Math.abs(second - expectedSecond) <= 1) { // Allow small deviation
                    symmetricPairs++;
                }
            }

            symmetryScore = symmetricPairs / half;
        }

        return {
            symmetryScore,
            length: cleaned.length,
            hasSymmetry: symmetryScore > 0.6
        };
    }

    /**
     * Alias for analyzeShortText - for backward compatibility with tests
     */
    static detect(text) {
        return this.analyzeShortText(text);
    }

    /**
     * Quick validation: checks if text contains common patterns.
     * Returns true if text appears to be in the target language.
     *
     * @param {string} text - Text to validate
     * @param {string} language - Language code
     * @param {number} threshold - Minimum score threshold (default: 0.15)
     * @returns {boolean} True if text appears to be in target language
     */
    static validate(text, language = 'english', threshold = 0.15) {
        const score = ShortTextPatterns.score(text, language);
        return score.combinedScore >= threshold;
    }
}

export default ShortTextPatterns;

