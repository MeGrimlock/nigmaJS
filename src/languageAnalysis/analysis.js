import spanishData from './languages/spanish.js';
import englishData from './languages/english.js';
import italianData from './languages/italian.js';
import frenchData from './languages/french.js';
import germanData from './languages/german.js';
import portugueseData from './languages/portuguese.js';
import russianData from './languages/russian.js';
import chineseData from './languages/chinese.js';

import englishWords from 'an-array-of-english-words';
import spanishWords from 'an-array-of-spanish-words';

// Initialize Dictionaries (Sets for O(1) lookup)
const dictionaries = {
    english: new Set(englishWords.map(w => w.toUpperCase())),
    spanish: new Set(spanishWords.map(w => w.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase())) 
    // Normalize Spanish to remove accents for easier matching if cipher produces plain text
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
     * Calculates the percentage of words in the text that are valid dictionary words.
     * @param {string} text - The text to check.
     * @param {string} language - 'english' or 'spanish'.
     * @returns {number} Score from 0.0 to 1.0 (1.0 = all tokens are valid words).
     */
    static getWordCountScore(text, language = 'english') {
        if (!dictionaries[language]) return 0;

        // Split by non-word characters to get tokens
        const clean = text.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        // Keep pure alphabetic tokens
        const tokens = clean.split(/[^A-Z]+/);
        
        let validChars = 0;
        let totalChars = 0;

        const dict = dictionaries[language];

        for (const token of tokens) {
            if (token.length === 0) continue;
            totalChars += token.length;
            
            // Filter out single letters (except 'A' or 'I' in English, 'Y' in Spanish?)
            // Actually, simplistic approach: check dictionary.
            // But 1-letter words match too easily randomly.
            if (token.length < 2) continue; 

            if (dict.has(token)) {
                validChars += token.length;
            }
        }

        if (totalChars === 0) return 0;
        return validChars / totalChars;
    }

    /**
     * Generates a Transition Matrix (Markov Chain Order 1) from text.
     * Returns a 26x26 object where matrix[char1][char2] = probability.
     */
    static getTransitionMatrix(text) {
        const cleaned = this.cleanText(text);
        const matrix = {};
        const totals = {};
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        // Initialize
        for (const c1 of chars) {
            matrix[c1] = {};
            totals[c1] = 0;
            for (const c2 of chars) {
                matrix[c1][c2] = 0;
            }
        }

        // Count transitions
        for (let i = 0; i < cleaned.length - 1; i++) {
            const c1 = cleaned[i];
            const c2 = cleaned[i+1];
            if (matrix[c1] && matrix[c1][c2] !== undefined) {
                matrix[c1][c2]++;
                totals[c1]++;
            }
        }

        // Normalize to probabilities
        for (const c1 of chars) {
            if (totals[c1] > 0) {
                for (const c2 of chars) {
                    matrix[c1][c2] = matrix[c1][c2] / totals[c1];
                }
            }
        }

        return matrix;
    }

    /**
     * Approximates a Transition Matrix from Language Bigram Data.
     * P(B|A) approx P(AB) / P(A)
     */
    static getLanguageTransitionMatrix(languageKey) {
        const langData = languages[languageKey];
        if (!langData) return null;

        const matrix = {};
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        // Initialize
        for (const c1 of chars) {
            matrix[c1] = {};
            for (const c2 of chars) {
                matrix[c1][c2] = 0;
            }
        }

        // Fill from Bigrams
        // Note: P(AB) is percentage of total bigrams. P(A) is percentage of total letters.
        // P(B|A) = Count(AB) / Count(A) = (Freq(AB)/100 * N) / (Freq(A)/100 * N) = Freq(AB) / Freq(A)
        
        for (const bigram in langData.bigrams) {
            if (bigram.length !== 2) continue;
            const c1 = bigram[0];
            const c2 = bigram[1];
            const probAB = langData.bigrams[bigram] || 0;
            const probA = langData.monograms[c1] || 0.01; // Avoid div by zero
            
            if (matrix[c1]) {
                matrix[c1][c2] = probAB / probA;
            }
        }

        return matrix;
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
     * Calculates Index of Coincidence (IoC) for a text.
     * IoC is invariant to substitution ciphers.
     */
    static calculateIoC(text) {
        const counts = {};
        const cleaned = this.cleanText(text);
        const N = cleaned.length;
        
        if (N <= 1) return 0;

        for (const char of cleaned) {
            counts[char] = (counts[char] || 0) + 1;
        }

        let sum = 0;
        for (const char in counts) {
            const n = counts[char];
            sum += n * (n - 1);
        }

        // Normalized IoC (multiplied by 26 for standard comparison scale)
        // Normal random text is ~1.0, English ~1.73
        return (sum / (N * (N - 1))) * 26;
    }

    /**
     * Detects the most likely language for a given text
     * @param {string} text 
     * @returns {Object} Array of languages sorted by probability
     */
    static detectLanguage(text) {
        const results = [];
        const cleanedText = text.toUpperCase();
        
        // Standard IoC values for languages (Refined)
        const expectedIoC = {
            english: 1.73,
            french: 2.02,
            german: 2.05,
            italian: 1.94,
            portuguese: 1.94, // Very close to Spanish
            spanish: 1.94,
            russian: 1.76,
            chinese: 0.0
        };

        // ... (rest of code) ...

        // 1. Determine Script Dominance
        const latinCount = (cleanedText.match(/[A-ZÑÀ-ÿĀ-ž]/g) || []).length;
        const cyrillicCount = (cleanedText.match(/[А-ЯЁ]/g) || []).length;
        const chineseCount = (cleanedText.match(/[\u4E00-\u9FFF]/g) || []).length;

        const total = latinCount + cyrillicCount + chineseCount;
        if (total === 0) return []; 

        let script = 'latin';
        if (cyrillicCount > total * 0.5) script = 'cyrillic';
        if (chineseCount > total * 0.5) script = 'chinese';

        // Candidates based on script
        let candidateLanguages = [];
        if (script === 'latin') candidateLanguages = ['english', 'french', 'german', 'italian', 'portuguese', 'spanish'];
        else if (script === 'cyrillic') candidateLanguages = ['russian'];
        else if (script === 'chinese') candidateLanguages = ['chinese'];

        // Calculate Text IoC
        const textIoC = this.calculateIoC(text);

        for (const langKey of candidateLanguages) {
            if (!languages[langKey]) continue;

            const analysis = this.analyzeCorrelation(text, langKey);
            
            // Metric 1: Shape Difference
            // Bigrams are the best fingerprint for Latin languages
            const shapeScore = (
                analysis.monograms.shapeScore * 0.5 +
                analysis.bigrams.shapeScore * 3.0 + // Increased weight
                analysis.trigrams.shapeScore * 2.0 + 
                analysis.quadgrams.shapeScore * 1.0
            ) / 6.5;

            // Metric 2: IoC Distance
            const targetIoC = expectedIoC[langKey] || 1.7;
            const iocDistance = Math.abs(textIoC - targetIoC) * 50; // Scaled down slightly

            // Metric 3: Unique Bigram Match (Experimental)
            // Check if the top observed bigrams exist in the top language bigrams
            // This helps distinguish Es vs It (e.g. 'EL' vs 'IL')
            // Note: This only works if Substitution is standard/simple. If shifted, this fails.
            // But ShapeScore handles shifted. This metric is a tie-breaker.
            
            // Combined Score
            const finalScore = shapeScore + iocDistance;

            results.push({
                language: langKey,
                score: finalScore,
                details: { ...analysis, ioc: textIoC, expectedIoC: targetIoC }
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
