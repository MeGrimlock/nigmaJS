import { Stats } from './stats.js';
import { LanguageAnalysis } from './analysis-core.js';
import { TextUtils } from '../core/text-utils.js';
import configLoader from '../config/config-loader.js';

/**
 * Adaptive Frequency Analysis for Cryptographic Detection
 *
 * Advanced frequency analysis that adapts its scoring based on detected cipher type,
 * language context, and text characteristics.
 *
 * Features:
 * - Column-wise frequency analysis for polyalphabetic ciphers
 * - Adaptive scoring based on cipher type detection
 * - Context-aware frequency comparison
 * - Language-specific frequency adaptation
 * - Chi-squared optimization for different cipher types
 */
export class AdaptiveFrequencyAnalysis {

    /**
     * Analyzes frequency patterns adaptively based on detected cipher characteristics
     * @param {string} text - Text to analyze
     * @param {Object} cipherHints - Hints from other analysis (periodicity, IC, etc.)
     * @param {string} language - Language context
     * @returns {Object} Adaptive frequency analysis results
     */
    static analyze(text, cipherHints = {}, language = 'english') {
        const cleaned = TextUtils.onlyLetters(text || '');
        if (cleaned.length < 10) {
            return this._getEmptyResult();
        }

        const frequencyData = Stats.frequency(cleaned, true);

        // Adapt analysis based on detected cipher characteristics
        const adaptationResults = this._adaptAnalysisToCipherType(
            cleaned, frequencyData, cipherHints, language
        );

        // Calculate confidence scores for different cipher types
        const typeConfidences = this._calculateTypeConfidences(
            adaptationResults, cipherHints
        );

        // Find best matching cipher type
        const bestType = this._determineBestCipherType(typeConfidences);

        return {
            frequencyData,
            adaptationResults,
            typeConfidences,
            bestType,
            confidence: Math.max(...Object.values(typeConfidences)),
            language,
            textLength: cleaned.length,
            analysisTimestamp: Date.now()
        };
    }

    /**
     * Adapts frequency analysis based on detected cipher type characteristics
     * @private
     */
    static _adaptAnalysisToCipherType(text, frequencyData, cipherHints, language) {
        const results = {};

        // Monoalphabetic analysis (Caesar, ROT, Substitution)
        results.monoalphabetic = this._analyzeMonoalphabetic(text, frequencyData, language);

        // Polyalphabetic analysis (Vigenere, Beaufort, etc.)
        results.polyalphabetic = this._analyzePolyalphabetic(text, frequencyData, cipherHints, language);

        // Transposition analysis
        results.transposition = this._analyzeTransposition(text, frequencyData, language);

        // Dictionary-based analysis
        results.dictionaryBased = this._analyzeDictionaryBased(text, frequencyData, language);

        return results;
    }

    /**
     * Analyzes monoalphabetic cipher patterns
     * @private
     */
    static _analyzeMonoalphabetic(text, frequencyData, language) {
        const langData = this._getLanguageFrequencies(language);
        const chiSquared = LanguageAnalysis.calculateChiSquared(frequencyData.counts, langData);

        // For monoalphabetic ciphers, we expect single peaks and smooth distribution
        const entropy = Stats.entropy(text);
        const ic = Stats.indexOfCoincidence(text);

        // Monoalphabetic ciphers typically have:
        // - Low entropy variation
        // - IC around 1.7 (English)
        // - Chi-squared varies with shift but has clear minimum

        const expectedIC = language === 'english' ? 1.73 : 1.94;
        const icDeviation = Math.abs(ic - expectedIC);

        // Score based on how well it fits monoalphabetic patterns
        let score = 0;

        // Good IC fit (close to language expected)
        if (icDeviation < 0.3) score += 0.4;

        // Reasonable entropy (not too random, not too ordered)
        if (entropy > 3.5 && entropy < 4.5) score += 0.3;

        // Chi-squared not extremely high (not completely random)
        if (chiSquared < 200) score += 0.3;

        return {
            chiSquared,
            entropy,
            ic,
            icDeviation,
            score: Math.min(1, score),
            confidence: score > 0.6 ? 'high' : score > 0.4 ? 'medium' : 'low'
        };
    }

    /**
     * Analyzes polyalphabetic cipher patterns
     * @private
     */
    static _analyzePolyalphabetic(text, frequencyData, cipherHints, language) {
        const suspectedPeriod = cipherHints.detectedPeriod || cipherHints.suggestedKeyLength || 3;

        // Analyze frequency distribution across columns
        const columnAnalysis = this._analyzeColumnFrequencies(text, suspectedPeriod, language);

        // Check for polyalphabetic indicators
        const ic = Stats.indexOfCoincidence(text);
        const expectedIC = language === 'english' ? 1.73 : 1.94;

        // Polyalphabetic ciphers typically have:
        // - Lower IC than monoalphabetic (closer to random)
        // - More uniform column distributions
        // - Less extreme frequency peaks

        let score = 0;

        // IC lower than monoalphabetic (more random)
        if (ic < expectedIC - 0.2) score += 0.3;

        // Column uniformity (polyalphabetic distributes frequencies)
        if (columnAnalysis.uniformity > 0.6) score += 0.4;

        // Not too many extreme peaks (monoalphabetic has clear peaks)
        if (columnAnalysis.peakRatio < 0.3) score += 0.3;

        return {
            suspectedPeriod,
            columnAnalysis,
            ic,
            score: Math.min(1, score),
            confidence: score > 0.6 ? 'high' : score > 0.4 ? 'medium' : 'low'
        };
    }

    /**
     * Analyzes column frequencies for polyalphabetic detection
     * @private
     */
    static _analyzeColumnFrequencies(text, period, language) {
        const columns = [];
        for (let i = 0; i < period; i++) {
            columns.push('');
        }

        // Distribute text across columns
        for (let i = 0; i < text.length; i++) {
            columns[i % period] += text[i];
        }

        // Analyze each column
        const columnStats = columns.map(col => {
            if (col.length < 3) return null;
            const freq = Stats.frequency(col, true);
            const ic = Stats.indexOfCoincidence(col);
            const entropy = Stats.entropy(col);
            return { frequency: freq, ic, entropy, length: col.length };
        }).filter(stat => stat !== null);

        if (columnStats.length === 0) {
            return { uniformity: 0, peakRatio: 0, columnStats: [] };
        }

        // Calculate uniformity across columns
        const icValues = columnStats.map(s => s.ic);
        const avgIC = icValues.reduce((a, b) => a + b, 0) / icValues.length;
        const icVariance = icValues.reduce((sum, ic) => sum + Math.pow(ic - avgIC, 2), 0) / icValues.length;
        const uniformity = Math.max(0, 1 - icVariance * 2); // Lower variance = higher uniformity

        // Calculate peak ratio (how many columns have extreme peaks)
        const peakThreshold = 0.15; // 15% frequency threshold
        const columnsWithPeaks = columnStats.filter(stat => {
            return Object.values(stat.frequency.histogram).some(freq => freq > peakThreshold);
        }).length;
        const peakRatio = columnsWithPeaks / columnStats.length;

        return {
            uniformity,
            peakRatio,
            avgIC,
            icVariance,
            columnStats
        };
    }

    /**
     * Analyzes transposition cipher patterns
     * @private
     */
    static _analyzeTransposition(text, frequencyData, language) {
        // Transposition ciphers preserve letter frequencies but change positions
        // They should have normal frequency distribution but different patterns

        const langData = this._getLanguageFrequencies(language);
        const chiSquared = LanguageAnalysis.calculateChiSquared(frequencyData.counts, langData);

        // Transposition ciphers typically have:
        // - Normal chi-squared (good frequency fit)
        // - Low autocorrelation (positions randomized)
        // - Different n-gram patterns

        let score = 0;

        // Good frequency fit (similar to plaintext)
        if (chiSquared < 100) score += 0.4;

        // Check for transposition indicators (can be added later)
        // For now, rely on frequency fit and other analysis

        return {
            chiSquared,
            score: Math.min(1, score),
            confidence: score > 0.5 ? 'medium' : 'low'
        };
    }

    /**
     * Analyzes dictionary-based cipher patterns
     * @private
     */
    static _analyzeDictionaryBased(text, frequencyData, language) {
        // Dictionary-based ciphers might have unusual frequency patterns
        // This is a placeholder for future dictionary analysis

        return {
            score: 0.1, // Low confidence by default
            confidence: 'low',
            note: 'Dictionary analysis not fully implemented'
        };
    }

    /**
     * Calculates confidence scores for different cipher types
     * @private
     */
    static _calculateTypeConfidences(adaptationResults, cipherHints) {
        const confidences = {};

        // Weight results based on cipher hints and adaptation scores
        const weights = {
            monoalphabetic: 1.0,
            polyalphabetic: cipherHints.isPolyalphabetic ? 1.2 : 0.8,
            transposition: 0.7,
            dictionaryBased: 0.5
        };

        for (const [type, result] of Object.entries(adaptationResults)) {
            confidences[type] = result.score * weights[type];
        }

        // Boost based on hints
        if (cipherHints.isPolyalphabetic) {
            confidences.polyalphabetic *= 1.3;
        }

        if (cipherHints.isTransposition) {
            confidences.transposition *= 1.5;
        }

        // Normalize to ensure they sum appropriately
        const total = Object.values(confidences).reduce((a, b) => a + b, 0);
        if (total > 0) {
            for (const type in confidences) {
                confidences[type] = confidences[type] / total;
            }
        }

        return confidences;
    }

    /**
     * Determines the best matching cipher type
     * @private
     */
    static _determineBestCipherType(typeConfidences) {
        let bestType = 'unknown';
        let bestScore = 0;

        for (const [type, score] of Object.entries(typeConfidences)) {
            if (score > bestScore) {
                bestScore = score;
                bestType = type;
            }
        }

        return {
            type: bestType,
            confidence: bestScore,
            allScores: typeConfidences
        };
    }

    /**
     * Gets language-specific frequency data
     * @private
     */
    static _getLanguageFrequencies(language) {
        // This should be expanded to support more languages
        // For now, using English as default
        const englishFreq = {
            E: 12.02, T: 9.10, A: 8.12, O: 7.68, I: 7.31, N: 6.95,
            S: 6.28, R: 6.02, H: 5.92, D: 4.32, L: 3.98, U: 2.88,
            C: 2.71, M: 2.61, F: 2.30, Y: 2.11, W: 2.09, G: 2.03,
            P: 1.82, B: 1.49, V: 1.11, K: 0.69, X: 0.17, Q: 0.11,
            J: 0.10, Z: 0.07
        };

        // Normalize to expected counts for chi-squared
        const total = Object.values(englishFreq).reduce((a, b) => a + b, 0);
        const normalized = {};
        for (const [letter, freq] of Object.entries(englishFreq)) {
            normalized[letter] = (freq / 100); // Convert percentage to proportion
        }

        return normalized;
    }

    /**
     * Returns empty result for invalid inputs
     * @private
     */
    static _getEmptyResult() {
        return {
            frequencyData: null,
            adaptationResults: {},
            typeConfidences: {},
            bestType: { type: 'unknown', confidence: 0 },
            confidence: 0,
            language: 'unknown',
            textLength: 0
        };
    }

    /**
     * Provides detailed analysis for debugging
     * @param {string} text - Text to analyze
     * @param {Object} options - Analysis options
     * @returns {Object} Detailed analysis results
     */
    static detailedAnalysis(text, options = {}) {
        const basicResult = this.analyze(text, options.cipherHints || {}, options.language || 'english');

        // Add additional debugging information
        return {
            ...basicResult,
            debug: {
                textSample: text.substring(0, 50),
                options,
                timestamp: new Date().toISOString()
            }
        };
    }
}

export default AdaptiveFrequencyAnalysis;
