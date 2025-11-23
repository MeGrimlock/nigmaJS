import { NGramModel } from './ngram-model.js';

// Import existing data models
import spanishData from './models/spanish.js';
import englishData from './models/english.js';
import frenchData from './models/french.js';
import germanData from './models/german.js';
import italianData from './models/italian.js';
import portugueseData from './models/portuguese.js';

// Initialize models lazily or on load. 
// Since we want high performance, initializing once is better.
const models = {
    spanish: new NGramModel(spanishData.quadgrams, 4),
    english: new NGramModel(englishData.quadgrams, 4),
    french: new NGramModel(frenchData.quadgrams, 4),
    german: new NGramModel(germanData.quadgrams, 4),
    italian: new NGramModel(italianData.quadgrams, 4),
    portuguese: new NGramModel(portugueseData.quadgrams, 4),
};

export const Scorers = {
    /**
     * Scores text against a specific language.
     * @param {string} text 
     * @param {string} languageId 
     */
    scoreText: (text, languageId) => {
        const model = models[languageId];
        if (!model) {
            throw new Error(`Language model '${languageId}' not found.`);
        }
        return model.score(text);
    },

    /**
     * Scores text against all available languages and returns a ranking.
     * @param {string} text 
     * @returns {Array<{lang: string, score: number}>} Sorted high to low.
     */
    rankLanguages: (text) => {
        const results = [];
        for (const lang in models) {
            results.push({
                lang,
                score: models[lang].score(text)
            });
        }
        
        // Sort descending (higher score is better, closer to 0)
        return results.sort((a, b) => b.score - a.score);
    },

    /**
     * Helper to get the underlying model instance if needed.
     */
    getModel: (lang) => models[lang]
};

export default Scorers;

