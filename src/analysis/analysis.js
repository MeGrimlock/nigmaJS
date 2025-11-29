import 'regenerator-runtime/runtime';
import spanishData from '../language/models/spanish.js';
import englishData from '../language/models/english.js';
import italianData from '../language/models/italian.js';
import frenchData from '../language/models/french.js';
import germanData from '../language/models/german.js';
import portugueseData from '../language/models/portuguese.js';
import russianData from '../language/models/russian.js';
import chineseData from '../language/models/chinese.js';
import { configLoader } from '../config/config-loader.js';

// Dictionaries will be loaded asynchronously
const dictionaries = {
    english: null, // Set<string>
    spanish: null,
    italian: null,
    french: null,
    portuguese: null,
    german: null
};

const languages = {
	spanish: spanishData,
	english: englishData,
    italian: italianData,
    french: frenchData,
    german: germanData,
    portuguese: portugueseData,
    russian: russianData,
    chinese: chineseData
};

// Re-export for backward compatibility
export const spanishLetterFrequencies = spanishData.monograms;
export const spanishBigramFrequencies = spanishData.bigrams;
export const spanishTrigramFrequencies = spanishData.trigrams;
export const spanishQuadgramFrequencies = spanishData.quadgrams;

export class LanguageAnalysis {
	// Keep static properties for backward compatibility
	static spanishLetterFrequencies = spanishData.monograms;
	static spanishBigramFrequencies = spanishData.bigrams;
	static spanishTrigramFrequencies = spanishData.trigrams;
	static spanishQuadgramFrequencies = spanishData.quadgrams;

	static languages = languages;

    /**
     * Loads a dictionary for a specific language from external JSON.
     * @param {string} language - 'english', 'spanish', 'italian', 'french', 'portuguese', or 'german'
     * @param {string} basePath - Path to the data folder (e.g. 'data/')
     */
    static async loadDictionary(language, basePath = 'data/') {
        if (dictionaries[language]) return true; // Already loaded

        try {
            const response = await fetch(`${basePath}${language}-dictionary.json`);
            if (!response.ok) throw new Error(`Failed to load ${language} dictionary`);
            
            const words = await response.json();
            dictionaries[language] = new Set(words); // Words are already normalized/uppercase in JSON
            console.log(`Dictionary loaded: ${language} (${words.length} words)`);
            return true;
        } catch (error) {
            console.error(`Error loading dictionary for ${language}:`, error);
            return false;
        }
    }

    /**
     * Gets the loaded dictionary for a specific language.
     * @param {string} language - 'english', 'spanish', 'italian', 'french', 'portuguese', or 'german'
     * @returns {Set<string>|null} The dictionary Set, or null if not loaded
     */
    static getDictionary(language) {
        return dictionaries[language] || null;
    }

    /**
     * Checks if a dictionary is loaded for a specific language.
     * @param {string} language - 'english', 'spanish', 'italian', 'french', 'portuguese', or 'german'
     * @returns {boolean} True if dictionary is loaded
     */
    static isDictionaryLoaded(language) {
        return dictionaries[language] !== null;
    }

    /**
     * Cleans text based on language or general mode.
     * Preserves accents for alphabet validation.
     */
    static cleanText(text) {
        // Allow A-Z, Accented chars, Cyrillic, and Chinese
        return text.toUpperCase().replace(/[^A-ZÑÀ-ÿĀ-žА-ЯЁ\u4E00-\u9FFF]/g, '');
    }

    /**
     * Normalizes text to A-Z (removes accents) for Frequency Analysis.
     * This matches the format of our language models.
     */
    static normalizeText(text) {
        return text.toUpperCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^A-Z]/g, ''); // Keep only A-Z
    }

    /**
     * Calculates the percentage of words in the text that are valid dictionary words.
     * @returns {number} Score from 0.0 to 1.0
     */
    static getWordCountScore(text, language = 'english') {
        if (!dictionaries[language]) {
            return 0;
        }

        const clean = text.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        const tokens = clean.split(/[^A-Z]+/);
        
        let validChars = 0;
        let totalChars = 0;
        const dict = dictionaries[language];

        for (const token of tokens) {
            if (token.length === 0) continue;
            totalChars += token.length;
            if (token.length < 2) continue; 

            if (dict.has(token)) {
                validChars += token.length;
            }
        }

        if (totalChars === 0) return 0;
        return validChars / totalChars;
    }

    /**
     * Calculates Shannon Entropy of the text.
     * Higher entropy = more random (better encryption).
     * Range: 0 to ~4.7 (log2(26))
     */
    static calculateEntropy(text) {
        const freqs = this.getLetterFrequencies(text); // returns percentages 0-100
        let entropy = 0;
        
        for (const char in freqs) {
            const p = freqs[char] / 100; // Convert back to 0-1 probability
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        }
        return entropy;
    }

    static getTransitionMatrix(text) {
        const cleaned = this.normalizeText(text); // Use normalized text
        const matrix = {};
        const totals = {};
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (const c1 of chars) {
            matrix[c1] = {};
            totals[c1] = 0;
            for (const c2 of chars) matrix[c1][c2] = 0;
        }

        for (let i = 0; i < cleaned.length - 1; i++) {
            const c1 = cleaned[i];
            const c2 = cleaned[i+1];
            if (matrix[c1] && matrix[c1][c2] !== undefined) {
                matrix[c1][c2]++;
                totals[c1]++;
            }
        }

        for (const c1 of chars) {
            if (totals[c1] > 0) {
                for (const c2 of chars) matrix[c1][c2] = matrix[c1][c2] / totals[c1];
            }
        }
        return matrix;
    }

    static getLanguageTransitionMatrix(languageKey) {
        const langData = languages[languageKey];
        if (!langData) return null;

        const matrix = {};
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (const c1 of chars) {
            matrix[c1] = {};
            for (const c2 of chars) matrix[c1][c2] = 0;
        }

        for (const bigram in langData.bigrams) {
            if (bigram.length !== 2) continue;
            const c1 = bigram[0];
            const c2 = bigram[1];
            const probAB = langData.bigrams[bigram] || 0;
            const probA = langData.monograms[c1] || 0.01; 
            
            if (matrix[c1]) matrix[c1][c2] = probAB / probA;
        }
        return matrix;
    }

	static getLetterFrequencies(text) {
		const cleaned = this.normalizeText(text); // Use normalized text
		const total = cleaned.length;
		const counts = {};

		if (total === 0) return {};

		for (const char of cleaned) counts[char] = (counts[char] || 0) + 1;

		const percentages = {};
		for (const char in counts) percentages[char] = (counts[char] / total) * 100;

		return percentages;
	}

	static getNgramFrequencies(text, n) {
		const cleaned = this.normalizeText(text); // Use normalized text
		const counts = {};
		let total = 0;

		if (cleaned.length < n) return {};

		for (let i = 0; i <= cleaned.length - n; i++) {
			const ngram = cleaned.substring(i, i + n);
			counts[ngram] = (counts[ngram] || 0) + 1;
			total++;
		}

		const percentages = {};
		for (const ngram in counts) percentages[ngram] = (counts[ngram] / total) * 100;

		return percentages;
	}

	static calculateChiSquared(observedFreqs, expectedFreqs) {
		let chiSquared = 0;
		for (const key in observedFreqs) {
			const observed = observedFreqs[key] || 0;
			const expected = expectedFreqs[key] || 0; // Use 0 if missing in expected
			if (expected > 0) {
                chiSquared += Math.pow(observed - expected, 2) / expected;
            } else if (observed > 0) {
                // Penalty for observed but not expected (Language mismatch)
                chiSquared += observed * 10; // Significant penalty
            }
		}
		return chiSquared;
	}

    static calculateShapeScore(observedFreqs, expectedFreqs) {
        const observed = Object.values(observedFreqs).sort((a, b) => b - a);
        const expected = Object.values(expectedFreqs).sort((a, b) => b - a);
        
        let score = 0;
        const len = Math.min(observed.length, expected.length);
        
        for (let i = 0; i < len; i++) {
            const obs = observed[i];
            const exp = expected[i];
            if (exp > 0) score += Math.pow(obs - exp, 2) / exp;
        }
        return score;
    }

	static analyzeCorrelation(text, languageKey = 'spanish') {
		const langData = languages[languageKey] || languages.spanish;

		const letterFreqs = this.getLetterFrequencies(text);
		const bigramFreqs = this.getNgramFrequencies(text, 2);
		const trigramFreqs = this.getNgramFrequencies(text, 3);
		const quadgramFreqs = this.getNgramFrequencies(text, 4);

		return {
			monograms: {
				score: this.calculateChiSquared(letterFreqs, langData.monograms),
                shapeScore: this.calculateShapeScore(letterFreqs, langData.monograms),
				frequencies: letterFreqs
			},
			bigrams: {
				score: this.calculateChiSquared(bigramFreqs, langData.bigrams),
                shapeScore: this.calculateShapeScore(bigramFreqs, langData.bigrams),
				frequencies: bigramFreqs
			},
			trigrams: {
				score: this.calculateChiSquared(trigramFreqs, langData.trigrams),
                shapeScore: this.calculateShapeScore(trigramFreqs, langData.trigrams),
				frequencies: trigramFreqs
			},
			quadgrams: {
				score: this.calculateChiSquared(quadgramFreqs, langData.quadgrams),
                shapeScore: this.calculateShapeScore(quadgramFreqs, langData.quadgrams),
				frequencies: quadgramFreqs
			}
		};
	}

    static calculateIoC(text) {
        const counts = {};
        const cleaned = this.normalizeText(text); // Use normalized text
        const N = cleaned.length;
        
        if (N <= 1) return 0;

        for (const char of cleaned) counts[char] = (counts[char] || 0) + 1;

        let sum = 0;
        for (const char in counts) {
            const n = counts[char];
            sum += n * (n - 1);
        }

        // Normalized IoC
        return (sum / (N * (N - 1))) * 26;
    }

    static getAlphabetPenalty(text, language) {
        let penalty = 0;
        
        const hasN = text.includes('Ñ');
        const hasC = text.includes('Ç');
        const hasSz = text.includes('ß');
        
        // Accents
        const hasUmlaut = /[ÄÖÜ]/i.test(text);
        const hasAcute = /[ÁÉÍÓÚ]/i.test(text); 
        const hasGrave = /[ÀÈÌÒÙ]/i.test(text); 
        const hasCircumflex = /[ÂÊÎÔÛ]/i.test(text); 
        const hasTilde = /[ÃÕ]/i.test(text); 

        if (language === 'english') {
            if (hasN || hasC || hasSz || hasUmlaut || hasAcute || hasGrave || hasCircumflex || hasTilde) penalty += 1000;
        } 
        else if (language === 'german') {
            if (hasN || hasC || hasTilde || hasGrave || hasCircumflex) penalty += 500;
        }
        else if (language === 'french') {
            if (hasN || hasSz || hasTilde) penalty += 500;
            if (/[ÄÖ]/i.test(text)) penalty += 500; 
        }
        else if (language === 'spanish') {
            if (hasC || hasSz || hasTilde || hasGrave || hasCircumflex) penalty += 500;
            if (/[ÄÖ]/i.test(text)) penalty += 500; 
        }
        else if (language === 'italian') {
            if (hasN || hasSz || hasC || hasTilde || hasCircumflex || hasUmlaut) penalty += 500;
        }
        else if (language === 'portuguese') {
            if (hasN || hasSz || hasUmlaut) penalty += 500;
        }

        return penalty;
    }

    /**
     * Helper method to calculate stop words score for language detection.
     * Stop words are common words specific to each language that help distinguish languages,
     * especially useful for short texts where statistical analysis is less reliable.
     * @private
     */
    static _calculateStopWordsScore(text, language) {
        // Get stop words from config
        const stopWords = configLoader.get(`stop_words.${language}`, []);
        if (stopWords.length === 0) return null; // No stop words configured for this language
        
        // Get stop words scoring config
        const scoringConfig = configLoader.get('stop_words_scoring', {});
        const minCount = scoringConfig.min_count || 1;
        const bonusPerWord = scoringConfig.bonus_per_word || 20;
        const weight = scoringConfig.weight || 0.3;
        
        // Extract words from text (uppercase, cleaned)
        const words = text.toUpperCase()
            .split(/\s+/)
            .map(w => this.cleanText(w))
            .filter(w => w.length >= 2); // At least 2 chars
        
        if (words.length === 0) return null;
        
        // Count stop words found
        const stopWordsSet = new Set(stopWords.map(w => w.toUpperCase()));
        let stopWordsFound = 0;
        for (const word of words) {
            if (stopWordsSet.has(word)) {
                stopWordsFound++;
            }
        }
        
        // Only return score if we found at least minCount stop words
        if (stopWordsFound < minCount) return null;
        
        // Calculate score: bonus per word found, weighted
        // More stop words = higher confidence in language
        const rawScore = stopWordsFound * bonusPerWord;
        const weightedScore = rawScore * weight;
        
        // Return as negative value (lower is better for identityScore)
        return -weightedScore;
    }

    /**
     * Helper method to calculate dictionary score for language detection.
     * Extracts words from text and checks them against dictionary.
     * @private
     */
    static _calculateDictionaryScore(text, language) {
        const dict = this.getDictionary(language);
        if (!dict) return null; // No dictionary available, return null to indicate no validation
        
        // Get configuration values
        const minWordLength = configLoader.get('language_detection.dictionary.min_word_length', 2);
        const lengthBonusMax = configLoader.get('language_detection.dictionary.bonuses.length_bonus_max', 0.3);
        const lengthBonusDivisor = configLoader.get('language_detection.dictionary.bonuses.length_bonus_divisor', 8);
        const shortTextBonus = configLoader.get('language_detection.dictionary.bonuses.short_text_bonus', 0.2);
        const shortTextMaxWords = configLoader.get('language_detection.dictionary.bonuses.short_text_max_words', 3);
        
        // Extract words from text
        const words = text.toUpperCase()
            .split(/\s+/)
            .map(w => this.cleanText(w))
            .filter(w => w.length >= minWordLength);
        
        if (words.length === 0) return null; // No words to validate
        
        // Count valid words and track their lengths
        let validWords = 0;
        let totalValidWordLength = 0;
        for (const word of words) {
            if (dict.has(word)) {
                validWords++;
                totalValidWordLength += word.length;
            }
        }
        
        // Return score: percentage of valid words (0-1, where 1 = 100% valid)
        // Higher is better, so we return as a positive score
        const wordCoverage = validWords / words.length;
        
        // For short texts, give more weight to longer valid words
        // A single long valid word (e.g., "CRYPTOGRAPHY") is more significant than short words
        const avgValidWordLength = validWords > 0 ? totalValidWordLength / validWords : 0;
        const lengthBonus = Math.min(avgValidWordLength / lengthBonusDivisor, lengthBonusMax);
        
        // For very short texts, boost score if we have at least one valid word
        const isVeryShort = words.length <= shortTextMaxWords;
        const shortTextBonusValue = isVeryShort && validWords > 0 ? shortTextBonus : 0;
        
        return wordCoverage * (1 + lengthBonus + shortTextBonusValue);
    }

    /**
     * Calculates stop words score for language detection.
     * Stop words are common words specific to each language that help identify the language.
     * @private
     * @param {string} text - Text to analyze
     * @param {string} language - Language to check
     * @returns {number} Score 0-1 (higher = more stop words found)
     */
    static _calculateStopWordsScore(text, language) {
        const stopWords = configLoader.get(`stop_words.${language}`, []);
        if (!stopWords || stopWords.length === 0) {
            return 0; // No stop words defined for this language
        }
        
        // Extract words from text
        const words = text.toUpperCase()
            .split(/\s+/)
            .map(w => this.cleanText(w))
            .filter(w => w.length >= 2);
        
        if (words.length === 0) return 0;
        
        // Create a Set for fast lookup
        const stopWordsSet = new Set(stopWords.map(w => w.toUpperCase()));
        
        // Count how many stop words are found
        let foundStopWords = 0;
        for (const word of words) {
            if (stopWordsSet.has(word)) {
                foundStopWords++;
            }
        }
        
        // Return score: percentage of stop words found
        // Also give bonus for finding multiple stop words (more confidence)
        const baseScore = foundStopWords / Math.max(words.length, 1);
        const bonusPerWord = configLoader.get('stop_words_scoring.bonus_per_word', 20);
        const bonus = Math.min(foundStopWords * bonusPerWord / 100, 0.3); // Max 0.3 bonus
        
        return Math.min(baseScore + bonus, 1.0); // Cap at 1.0
    }

    static detectLanguage(text) {
        const results = [];
        // Keep accents for alphabet checking
        const cleanedText = this.cleanText(text);
        
        // Get expected IoC values from config (with fallback to defaults)
        const expectedIoCConfig = configLoader.get('ic_analysis.expected_values', {});
        const expectedIoC = {
            english: expectedIoCConfig.english || 1.73,
            french: expectedIoCConfig.french || 2.02,
            german: expectedIoCConfig.german || 2.05,
            italian: expectedIoCConfig.italian || 1.94,
            portuguese: expectedIoCConfig.portuguese || 1.94,
            spanish: expectedIoCConfig.spanish || 1.94,
            russian: expectedIoCConfig.russian || 1.76,
            chinese: expectedIoCConfig.chinese || 0.0
        };

        // 1. Determine Script Dominance
        const latinCount = (cleanedText.match(/[A-ZÑÀ-ÿĀ-ž]/g) || []).length;
        const cyrillicCount = (cleanedText.match(/[А-ЯЁ]/g) || []).length;
        const chineseCount = (cleanedText.match(/[\u4E00-\u9FFF]/g) || []).length;

        const total = latinCount + cyrillicCount + chineseCount;
        if (total === 0) return []; 

        let script = 'latin';
        if (cyrillicCount > total * 0.5) script = 'cyrillic';
        if (chineseCount > total * 0.5) script = 'chinese';

        let candidateLanguages = [];
        if (script === 'latin') candidateLanguages = ['english', 'french', 'german', 'italian', 'portuguese', 'spanish'];
        else if (script === 'cyrillic') candidateLanguages = ['russian'];
        else if (script === 'chinese') candidateLanguages = ['chinese'];

        const textIoC = this.calculateIoC(text);

        for (const langKey of candidateLanguages) {
            if (!languages[langKey]) continue;

            const analysis = this.analyzeCorrelation(text, langKey);
            
            // Adjust weights based on text length (using config)
            const textLength = cleanedText.length;
            const lengthCategory = configLoader.getTextLengthCategory(textLength);
            
            // 1. Chi-Squared (Identity Match) - using config values
            const chiSquaredWeights = configLoader.get('language_detection.weights.chi_squared', {});
            const monogramWeight = chiSquaredWeights.monogram?.[lengthCategory] || 0.5;
            const bigramWeight = chiSquaredWeights.bigram?.[lengthCategory] || 3.0;
            const identityScore = (
                analysis.monograms.score * monogramWeight + 
                analysis.bigrams.score * bigramWeight
            ) / (monogramWeight + bigramWeight);

            // 2. Shape Score (Distribution Match) - using config values
            const shapeWeights = configLoader.get('language_detection.weights.shape_score', {});
            const shapeMonogramWeight = shapeWeights.monogram?.[lengthCategory] || 0.5;
            const shapeBigramWeight = shapeWeights.bigram?.[lengthCategory] || 3.0;
            const shapeTrigramWeight = shapeWeights.trigram?.[lengthCategory] || 2.0;
            const shapeQuadgramWeight = shapeWeights.quadgram?.[lengthCategory] || 1.0;
            const shapeScore = (
                analysis.monograms.shapeScore * shapeMonogramWeight +
                analysis.bigrams.shapeScore * shapeBigramWeight + 
                analysis.trigrams.shapeScore * shapeTrigramWeight + 
                analysis.quadgrams.shapeScore * shapeQuadgramWeight
            ) / (shapeMonogramWeight + shapeBigramWeight + shapeTrigramWeight + shapeQuadgramWeight);

            const targetIoC = expectedIoC[langKey] || 1.7;
            // IoC weight from config
            const iocWeights = configLoader.get('language_detection.ioc.weight', {});
            const iocWeight = iocWeights[lengthCategory] || 50;
            const iocDistance = Math.abs(textIoC - targetIoC) * iocWeight; 
            
            const alphabetPenalty = this.getAlphabetPenalty(cleanedText, langKey);

            // 3. Stop Words Score (NEW: helps distinguish languages, especially for short texts)
            const stopWordsScore = this._calculateStopWordsScore(text, langKey);
            
            // 4. Dictionary Score (IMPROVED: cross-validation for short texts)
            // For short texts, dictionary validation is MORE important (fewer words to analyze)
            const dictionaryScore = this._calculateDictionaryScore(text, langKey);
            
            // Get dictionary config values
            const dictConfig = configLoader.get('language_detection.dictionary', {});
            const minScoreForBonus = dictConfig.min_score_for_bonus || 0.2;
            const bonusMultiplier = dictConfig.bonus_multiplier || 50;
            const weightMultipliers = dictConfig.weight_multiplier || {};
            const dictionaryWeight = weightMultipliers[lengthCategory] || 1.0;
            const crossValidationConfig = dictConfig.cross_validation || {};
            const significantDifference = crossValidationConfig.significant_difference || 0.2;
            const crossValidationBonusValue = crossValidationConfig.bonus || -30;
            const crossValidationPenaltyValue = crossValidationConfig.penalty || 30;
            const lowScorePenalties = dictConfig.low_score_penalty || {};
            const lowScoreThreshold = dictConfig.low_score_threshold || 0.1;
            
            // For short texts, also check against other languages to find the best match
            let crossValidationBonus = 0;
            if (lengthCategory === 'very_short' && dictionaryScore !== null) {
                // Compare dictionary score with other similar languages
                const otherScores = {};
                for (const otherLang of candidateLanguages) {
                    if (otherLang !== langKey) {
                        const otherScore = this._calculateDictionaryScore(text, otherLang);
                        if (otherScore !== null) {
                            otherScores[otherLang] = otherScore;
                        }
                    }
                }
                
                // If this language has significantly better dictionary score, add bonus
                const maxOtherScore = Math.max(...Object.values(otherScores), 0);
                if (dictionaryScore > maxOtherScore + significantDifference) {
                    // This language is clearly better
                    crossValidationBonus = crossValidationBonusValue;
                } else if (dictionaryScore < maxOtherScore - significantDifference) {
                    // Another language is clearly better
                    crossValidationBonus = crossValidationPenaltyValue;
                }
            }
            
            // Dictionary score is 0-1, convert to penalty (lower is better for identityScore)
            const dictionaryBonus = (dictionaryScore !== null && dictionaryScore > minScoreForBonus) 
                ? -dictionaryScore * bonusMultiplier * dictionaryWeight + crossValidationBonus
                : crossValidationBonus;
            
            // 5. Additional penalty for short texts when dictionary score is low
            // If we have a dictionary but very few valid words, it's likely wrong language
            const lowScorePenalty = lowScorePenalties[lengthCategory] || 0;
            if (dictionaryScore !== null && dictionaryScore < lowScoreThreshold && lowScorePenalty > 0) {
                alphabetPenalty += lowScorePenalty;
            }
            
            // 6. Stop Words Bonus (helps distinguish languages, especially for short texts)
            // Stop words are more reliable than dictionary for encrypted text
            const stopWordsBonus = stopWordsScore !== null ? stopWordsScore : 0;

            // Final Encrypted Score
            const encryptedScore = shapeScore + iocDistance;

            results.push({
                language: langKey,
                identityScore: identityScore + alphabetPenalty + dictionaryBonus + stopWordsBonus,
                encryptedScore: encryptedScore + alphabetPenalty, 
                dictionaryScore: dictionaryScore, // Add dictionary score to details
                stopWordsScore: stopWordsScore, // Add stop words score to details
                details: { ...analysis, ioc: textIoC, expectedIoC: targetIoC, dictionaryScore, stopWordsScore }
            });
        }

        const bestIdentity = results.reduce((min, r) => r.identityScore < min ? r.identityScore : min, Infinity);
        
        // For short texts, prefer identityScore (includes dictionary validation)
        // For longer texts, use standard logic
        const lengthCategory = configLoader.getTextLengthCategory(cleanedText.length);
        const isShortText = lengthCategory === 'very_short';
        
        if (isShortText) {
            // For short texts, always use identityScore (includes dictionary bonus)
            // Dictionary validation is more reliable than statistical analysis for short texts
            return results.sort((a, b) => a.identityScore - b.identityScore).map(r => ({
                ...r,
                score: r.identityScore 
            }));
        } else if (bestIdentity < 500) { 
             return results.sort((a, b) => a.identityScore - b.identityScore).map(r => ({
                 ...r,
                 score: r.identityScore 
             }));
        } else {
             return results.sort((a, b) => a.encryptedScore - b.encryptedScore).map(r => ({
                 ...r,
                 score: r.encryptedScore 
             }));
        }
    }

	static analyzeSpanishCorrelation(text) {
		return this.analyzeCorrelation(text, 'spanish');
	}
}

export default {
	LanguageAnalysis
};
