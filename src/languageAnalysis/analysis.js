import spanishData from './languages/spanish.js';
import englishData from './languages/english.js';
import italianData from './languages/italian.js';
import frenchData from './languages/french.js';
import germanData from './languages/german.js';
import portugueseData from './languages/portuguese.js';
import russianData from './languages/russian.js';
import chineseData from './languages/chinese.js';

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
	// Keep static properties for backward compatibility if needed, but better to use the languages object
	static spanishLetterFrequencies = spanishData.monograms;
	static spanishBigramFrequencies = spanishData.bigrams;
	static spanishTrigramFrequencies = spanishData.trigrams;
	static spanishQuadgramFrequencies = spanishData.quadgrams;

	static languages = languages;

    /**
     * Cleans text based on language or general mode.
     * Now supports Cyrillic and extended Latin.
     */
    static cleanText(text) {
        // Allow A-Z, Accented chars (Latin-1 Supplement + Latin Extended-A), and Cyrillic
        return text.toUpperCase().replace(/[^A-ZÑÀ-ÿĀ-žА-ЯЁ]/g, '');
    }

	/**
	 * Calculate frequency of characters in text
	 * @param {string} text 
	 * @returns {Object} Map of char -> percentage
	 */
	static getLetterFrequencies(text) {
		const cleaned = this.cleanText(text);
		const total = cleaned.length;
		const counts = {};

		if (total === 0) return {};

		for (const char of cleaned) {
			counts[char] = (counts[char] || 0) + 1;
		}

		const percentages = {};
		for (const char in counts) {
			percentages[char] = (counts[char] / total) * 100;
		}

		return percentages;
	}

	/**
	 * Calculate frequency of N-grams in text
	 * @param {string} text 
	 * @param {number} n 
	 * @returns {Object} Map of ngram -> percentage
	 */
	static getNgramFrequencies(text, n) {
		const cleaned = this.cleanText(text);
		const counts = {};
		let total = 0;

		if (cleaned.length < n) return {};

		for (let i = 0; i <= cleaned.length - n; i++) {
			const ngram = cleaned.substring(i, i + n);
			counts[ngram] = (counts[ngram] || 0) + 1;
			total++;
		}

		const percentages = {};
		for (const ngram in counts) {
			percentages[ngram] = (counts[ngram] / total) * 100;
		}

		return percentages;
	}

	/**
	 * Calculate Chi-Squared statistic comparing text freq to standard freq
	 * Lower value means closer match to standard language
	 * @param {Object} observedFreqs (percentages)
	 * @param {Object} expectedFreqs (percentages)
	 * @returns {number} Chi-Squared value
	 */
	static calculateChiSquared(observedFreqs, expectedFreqs) {
		let chiSquared = 0;

		// We iterate over the expected keys (standard language model)
		// If a key is missing in observed, it counts as 0 frequency
		for (const key in expectedFreqs) {
			const observed = observedFreqs[key] || 0;
			const expected = expectedFreqs[key];
			
			// Formula: sum( (Observed - Expected)^2 / Expected )
			// Since we are using percentages, we can use them directly as normalized counts
			chiSquared += Math.pow(observed - expected, 2) / expected;
		}

		return chiSquared;
	}

    /**
     * Calculates Chi-Squared score based on SORTED distribution shapes.
     * This ignores letter identity (useful for substitution ciphers).
     */
    static calculateShapeScore(observedFreqs, expectedFreqs) {
        const observed = Object.values(observedFreqs).sort((a, b) => b - a);
        const expected = Object.values(expectedFreqs).sort((a, b) => b - a);
        
        let score = 0;
        // Compare based on the length of the expected model (usually top N)
        const len = Math.min(observed.length, expected.length);
        
        for (let i = 0; i < len; i++) {
            const obs = observed[i];
            const exp = expected[i];
            if (exp > 0) {
                score += Math.pow(obs - exp, 2) / exp;
            }
        }
        
        return score;
    }

	/**
	 * Analyze text against a specific language model
	 * @param {string} text 
	 * @param {string} languageKey 'spanish' or 'english'
	 * @returns {Object} Analysis results
	 */
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

    /**
     * Detects the most likely language for a given text
     * @param {string} text 
     * @returns {Object} Array of languages sorted by probability (lowest average Chi-Squared)
     */
    static detectLanguage(text) {
        const results = [];
        const cleanedText = text.toUpperCase();
        
        // 1. Determine Script Dominance
        const latinCount = (cleanedText.match(/[A-ZÑÀ-ÿĀ-ž]/g) || []).length;
        const cyrillicCount = (cleanedText.match(/[А-ЯЁ]/g) || []).length;
        // Simple Chinese check (range 4E00-9FFF usually covers common CJK)
        const chineseCount = (cleanedText.match(/[\u4E00-\u9FFF]/g) || []).length;

        const total = latinCount + cyrillicCount + chineseCount;
        if (total === 0) return []; // No valid chars

        // Determine which languages are candidates based on script
        const candidateLanguages = [];
        
        // If > 50% matches a script, we only test languages of that script
        if (latinCount > total * 0.5) {
            candidateLanguages.push('spanish', 'english', 'italian', 'french', 'german', 'portuguese');
        } else if (cyrillicCount > total * 0.5) {
            candidateLanguages.push('russian');
        } else if (chineseCount > total * 0.5) {
            candidateLanguages.push('chinese');
        } else {
            // Mixed or unknown, try all
            candidateLanguages.push(...Object.keys(languages));
        }

        // 2. Analyze only candidates
        for (const langKey of candidateLanguages) {
            if (!languages[langKey]) continue;

            const analysis = this.analyzeCorrelation(text, langKey);
            
            // Calculate average score across all N-gram types
            // USE SHAPE SCORE for language detection on encrypted text!
            const score = (
                analysis.monograms.shapeScore * 1 +
                analysis.bigrams.shapeScore * 2 +
                analysis.trigrams.shapeScore * 2 + 
                analysis.quadgrams.shapeScore * 1
            ) / 6;

            results.push({
                language: langKey,
                score: score,
                details: analysis
            });
        }

        return results.sort((a, b) => a.score - b.score);
    }

	// Deprecated: Alias for backward compatibility
	static analyzeSpanishCorrelation(text) {
		return this.analyzeCorrelation(text, 'spanish');
	}
}

export default {
	LanguageAnalysis
};
