import { TextUtils } from '../core/text-utils.js';

export class NGramModel {
    /**
     * @param {Object} frequencyMap - Object with n-grams as keys and frequencies (percentages) as values.
     * @param {number} n - The 'n' in n-gram.
     */
    constructor(frequencyMap, n = 4) {
        this.n = n;
        this.logProbs = new Map();
        // Fixed floor for all models to ensure comparability.
        // Assuming inputs are percentages (0-100).
        // Floor represents a probability for an unseen n-gram.
        // log10(0.00001 / 100) = -7. This is effectively a penalty for mismatch.
        this.floor = -7; 

        this._preprocessMap(frequencyMap);
    }

    _preprocessMap(map) {
        // precise assumption: map values are percentages (0 to 100).
        // We do NOT normalize by sum(values) because the map might be partial (incomplete).
        // Normalizing by partial sum would artificially inflate probabilities of sparse models.
        
        for (const key in map) {
            const val = map[key];
            // val is percentage. P = val / 100.
            // Log10(P) = Log10(val) - 2.
            if (val > 0) {
                const logProb = Math.log10(val) - 2;
                this.logProbs.set(key, logProb);
            }
        }
    }

    /**
     * Calculates the fitness score of the text.
     * Score = Sum(log(P(ngram)))
     * @param {string} text 
     */
    score(text) {
        // We need to handle accents based on the model.
        // Most of our current N-gram models (English/Spanish) in json/js files seem to be uppercase.
        // Spanish model might have 'Ñ' but usually crypto N-gram files are A-Z.
        // Let's check the keys in the map during debugging if needed.
        // For now, we use TextUtils.onlyLetters which returns A-Z.
        // If the Spanish model expects 'Ñ', we might miss it, but consistency is key.
        
        const clean = TextUtils.onlyLetters(text);
        const len = clean.length;
        let score = 0;

        if (len < this.n) return this.floor * len; // Penalty for too short

        for (let i = 0; i <= len - this.n; i++) {
            const ngram = clean.substring(i, i + this.n);
            const val = this.logProbs.get(ngram);
            
            if (val !== undefined) {
                score += val;
            } else {
                score += this.floor;
            }
        }

        return score;
    }
}
