import spanishData from './languages/spanish.js';
import englishData from './languages/english.js';

const languages = {
	spanish: spanishData,
	english: englishData
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
	 * Calculate frequency of characters in text
	 * @param {string} text 
	 * @returns {Object} Map of char -> percentage
	 */
	static getLetterFrequencies(text) {
		const cleanText = text.toUpperCase().replace(/[^A-ZÑ]/g, '');
		const total = cleanText.length;
		const counts = {};

		if (total === 0) return {};

		for (const char of cleanText) {
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
		const cleanText = text.toUpperCase().replace(/[^A-ZÑ]/g, '');
		const counts = {};
		let total = 0;

		if (cleanText.length < n) return {};

		for (let i = 0; i <= cleanText.length - n; i++) {
			const ngram = cleanText.substring(i, i + n);
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
				frequencies: letterFreqs
			},
			bigrams: {
				score: this.calculateChiSquared(bigramFreqs, langData.bigrams),
				frequencies: bigramFreqs
			},
			trigrams: {
				score: this.calculateChiSquared(trigramFreqs, langData.trigrams),
				frequencies: trigramFreqs
			},
			quadgrams: {
				score: this.calculateChiSquared(quadgramFreqs, langData.quadgrams),
				frequencies: quadgramFreqs
			}
		};
	}

	// Deprecated: Alias for backward compatibility
	static analyzeSpanishCorrelation(text) {
		return this.analyzeCorrelation(text, 'spanish');
	}
}

export default {
	LanguageAnalysis
};
