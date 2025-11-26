import 'regenerator-runtime/runtime';
import spanishData from '../language/models/spanish.js';
import englishData from '../language/models/english.js';
import italianData from '../language/models/italian.js';
import frenchData from '../language/models/french.js';
import germanData from '../language/models/german.js';
import portugueseData from '../language/models/portuguese.js';
import russianData from '../language/models/russian.js';
import chineseData from '../language/models/chinese.js';

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
     * Helper method to calculate dictionary score for language detection.
     * Extracts words from text and checks them against dictionary.
     * @private
     */
    static _calculateDictionaryScore(text, language) {
        const dict = this.getDictionary(language);
        if (!dict) return null; // No dictionary available, return null to indicate no validation
        
        // Extract words from text
        const words = text.toUpperCase()
            .split(/\s+/)
            .map(w => this.cleanText(w))
            .filter(w => w.length >= 3); // Only consider words >= 3 chars
        
        if (words.length === 0) return null; // No words to validate
        
        // Count valid words
        let validWords = 0;
        for (const word of words) {
            if (dict.has(word)) {
                validWords++;
            }
        }
        
        // Return score: percentage of valid words (0-1, where 1 = 100% valid)
        // Higher is better, so we return as a positive score
        const wordCoverage = validWords / words.length;
        
        // Also consider average word length (longer valid words = higher confidence)
        const avgLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
        const lengthBonus = Math.min(avgLength / 10, 0.2); // Max 0.2 bonus for long words
        
        return wordCoverage * (1 + lengthBonus);
    }

    static detectLanguage(text) {
        const results = [];
        // Keep accents for alphabet checking
        const cleanedText = this.cleanText(text);
        
        const expectedIoC = {
            english: 1.73,
            french: 2.02,
            german: 2.05,
            italian: 1.94,
            portuguese: 1.94,
            spanish: 1.94,
            russian: 1.76,
            chinese: 0.0
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
            
            // Adjust weights based on text length
            // For short texts, rely more on dictionary and less on statistical analysis
            const textLength = cleanedText.length;
            const isShortText = textLength < 50;
            const isMediumText = textLength >= 50 && textLength < 150;
            
            // 1. Chi-Squared (Identity Match)
            // For short texts, reduce weight of statistical analysis
            const monogramWeight = isShortText ? 0.3 : (isMediumText ? 0.4 : 0.5);
            const bigramWeight = isShortText ? 2.0 : (isMediumText ? 2.5 : 3.0);
            const identityScore = (
                analysis.monograms.score * monogramWeight + 
                analysis.bigrams.score * bigramWeight
            ) / (monogramWeight + bigramWeight);

            // 2. Shape Score (Distribution Match)
            // For short texts, reduce weight of n-grams (less reliable)
            const shapeMonogramWeight = isShortText ? 0.3 : 0.5;
            const shapeBigramWeight = isShortText ? 2.0 : 3.0;
            const shapeTrigramWeight = isShortText ? 1.0 : 2.0;
            const shapeQuadgramWeight = isShortText ? 0.5 : 1.0;
            const shapeScore = (
                analysis.monograms.shapeScore * shapeMonogramWeight +
                analysis.bigrams.shapeScore * shapeBigramWeight + 
                analysis.trigrams.shapeScore * shapeTrigramWeight + 
                analysis.quadgrams.shapeScore * shapeQuadgramWeight
            ) / (shapeMonogramWeight + shapeBigramWeight + shapeTrigramWeight + shapeQuadgramWeight);

            const targetIoC = expectedIoC[langKey] || 1.7;
            // For short texts, IoC distance is less reliable, reduce its impact
            const iocWeight = isShortText ? 20 : (isMediumText ? 35 : 50);
            const iocDistance = Math.abs(textIoC - targetIoC) * iocWeight; 
            
            const alphabetPenalty = this.getAlphabetPenalty(cleanedText, langKey);

            // 3. Dictionary Score (IMPROVED: more important for short texts)
            // For short texts, dictionary validation is MORE important (fewer words to analyze)
            const dictionaryScore = this._calculateDictionaryScore(text, langKey);
            // Dictionary score is 0-1, convert to penalty (lower is better for identityScore)
            // For short texts, INCREASE dictionary weight (it's more reliable than stats)
            const dictionaryWeight = isShortText ? 1.5 : (isMediumText ? 1.2 : 1.0);
            const dictionaryBonus = (dictionaryScore !== null && dictionaryScore > 0.2) 
                ? -dictionaryScore * 50 * dictionaryWeight 
                : 0;
            
            // 4. Additional penalty for short texts when dictionary score is low
            // If we have a dictionary but very few valid words, it's likely wrong language
            if (isShortText && dictionaryScore !== null && dictionaryScore < 0.1) {
                // Strong penalty if dictionary validation fails for short text
                // This helps distinguish between similar languages (e.g., Portuguese vs Spanish)
                alphabetPenalty += 100; // Add significant penalty
            }

            // Final Encrypted Score
            const encryptedScore = shapeScore + iocDistance;

            results.push({
                language: langKey,
                identityScore: identityScore + alphabetPenalty + dictionaryBonus,
                encryptedScore: encryptedScore + alphabetPenalty, 
                dictionaryScore: dictionaryScore, // Add dictionary score to details
                details: { ...analysis, ioc: textIoC, expectedIoC: targetIoC, dictionaryScore }
            });
        }

        const bestIdentity = results.reduce((min, r) => r.identityScore < min ? r.identityScore : min, Infinity);
        
        // For short texts, prefer identityScore (includes dictionary validation)
        // For longer texts, use standard logic
        const isShortText = cleanedText.length < 50;
        
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
