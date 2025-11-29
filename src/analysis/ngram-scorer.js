import { NGramModel } from '../language/ngram-model.js';
import { TextUtils } from '../core/text-utils.js';

// Import language data
import spanishData from '../language/models/spanish.js';
import englishData from '../language/models/english.js';
import frenchData from '../language/models/french.js';
import germanData from '../language/models/german.js';
import italianData from '../language/models/italian.js';
import portugueseData from '../language/models/portuguese.js';
import russianData from '../language/models/russian.js';
import chineseData from '../language/models/chinese.js';

export class NgramScorer {
    constructor(language = 'english', preferredNgramLength = 4) {
        this.language = (language || 'english').toLowerCase();
        this.preferredNgramLength = preferredNgramLength;

        // Load language data (with fallback)
        let languageData = this._getLanguageData(this.language);
        if (!languageData) {
            console.warn(`[NgramScorer] Unsupported language '${this.language}', falling back to English`);
            this.language = 'english';
            languageData = this._getLanguageData('english');
        }

        // Select model
        if (languageData.trigrams && preferredNgramLength === 3) {
            this.model = new NGramModel(languageData.trigrams, 3);
            this.fallbackModel = languageData.quadgrams ? new NGramModel(languageData.quadgrams, 4) : null;

        } else if (languageData.quadgrams && preferredNgramLength === 4) {
            this.model = new NGramModel(languageData.quadgrams, 4);
            this.fallbackModel = languageData.trigrams ? new NGramModel(languageData.trigrams, 3) : null;

        } else {
            if (languageData.quadgrams) {
                this.model = new NGramModel(languageData.quadgrams, 4);
                this.fallbackModel = null;
            } else if (languageData.trigrams) {
                this.model = new NGramModel(languageData.trigrams, 3);
                this.fallbackModel = null;
            } else {
                throw new Error(`No n-gram data available for language: ${language}`);
            }
        }
    }

    _getLanguageData(language) {
        const dataMap = {
            'spanish': spanishData,
            'english': englishData,
            'french': frenchData,
            'german': germanData,
            'italian': italianData,
            'portuguese': portugueseData,
            'russian': russianData,
            'chinese': chineseData
        };
        return dataMap[language.toLowerCase()];
    }

    score(text, options = {}) {
        const { useFallback = true } = options;

        if (typeof text !== 'string') {
            text = text == null ? '' : String(text);
        }

        const cleaned = TextUtils.onlyLetters(text);

        if (cleaned.length < this.model.n) {
            if (useFallback && this.fallbackModel && cleaned.length >= this.fallbackModel.n) {
                return this._scoreWithModel(cleaned, this.fallbackModel);
            }
            return 0.0;
        }

        return this._scoreWithModel(cleaned, this.model);
    }

    _scoreWithModel(cleaned, model) {
        const totalScore = model.score(cleaned);
        const numNgrams = cleaned.length - model.n + 1;

        if (!Number.isFinite(totalScore) || numNgrams <= 0) {
            return 0.0;
        }

        const avgLogLikelihood = totalScore / numNgrams;

        // Improved normalization
        const minScore = model.min || -12.0;
        const maxScore = model.max || -4.0;

        const normalized = Math.max(0, Math.min(1, (avgLogLikelihood - minScore) / (maxScore - minScore)));

        return normalized;
    }

    scoreMultiple(texts, options = {}) {
        const safeTexts = Array.isArray(texts) ? texts : [];

        const scores = safeTexts.map(t => ({
            text: t,
            score: this.score(t ?? '', options)
        }));

        scores.sort((a, b) => b.score - a.score);

        return {
            bestText: scores.length ? scores[0].text : '',
            bestScore: scores.length ? scores[0].score : 0,
            scores
        };
    }

    getRawScore(text) {
        if (typeof text !== 'string') {
            text = text == null ? '' : String(text);
        }

        const cleaned = TextUtils.onlyLetters(text);

        if (cleaned.length < this.model.n) {
            if (this.fallbackModel && cleaned.length >= this.fallbackModel.n) {
                const total = this.fallbackModel.score(cleaned);
                const num = cleaned.length - this.fallbackModel.n + 1;
                return num > 0 ? total / num : this.fallbackModel.floor;
            }
            return this.model.floor;
        }

        const total = this.model.score(cleaned);
        const num = cleaned.length - this.model.n + 1;
        return num > 0 ? total / num : this.model.floor;
    }
}

export function createNgramScorer(language = 'english', ngramLength = 4) {
    return new NgramScorer(language, ngramLength);
}

export function quickScore(text, language = 'english', ngramLength = 4) {
    const scorer = new NgramScorer(language, ngramLength);
    return scorer.score(text);
}
