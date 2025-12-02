import { TextUtils } from '../core/text-utils.js';
import { Stats } from './stats.js';
import { Kasiski } from './kasiski.js';
import configLoader from '../config/config-loader.js';

/**
 * Advanced Periodic Analysis for Cryptographic Detection
 *
 * Enhanced version with multiple detection methods for better polyalphabetic cipher detection,
 * especially for short texts where traditional methods fail.
 *
 * Features:
 * - Multi-length N-gram Kasiski analysis
 * - Advanced autocorrelation with pattern recognition
 * - Conditional entropy analysis
 * - Composite period detection
 * - Confidence scoring system
 */
export class AdvancedPeriodicAnalysis {

    /**
     * Enhanced Kasiski examination using multiple n-gram lengths
     * @param {string} text - Ciphertext to analyze
     * @param {number[]} ngramLengths - Array of n-gram lengths to test (default: [3,4,5])
     * @returns {Object} Enhanced Kasiski results
     */
    static multiLengthKasiski(text, ngramLengths = null) {
        if (!ngramLengths) {
            ngramLengths = configLoader.get('advanced_periodic_analysis.kasiski.ngram_lengths', [3, 4, 5]);
        }
        const cleaned = TextUtils.onlyLetters(text || '');
        if (cleaned.length < 20) {
            return { hasPeriodicity: false, confidence: 0, periods: [] };
        }

        const results = [];
        let totalScore = 0;

        for (const nLen of ngramLengths) {
            const kasiskiResult = Kasiski.suggestKeyLengths(cleaned, nLen, 25);
            if (kasiskiResult.length > 0) {
                // Weight shorter n-grams less heavily (they have more false positives)
                const weight = Math.max(0.5, 1 - (nLen - 3) * 0.2);
                const weightedScore = kasiskiResult[0].score * weight;
                totalScore += weightedScore;

                results.push({
                    ngramLength: nLen,
                    periods: kasiskiResult.slice(0, 3), // Top 3 candidates
                    bestPeriod: kasiskiResult[0].keyLength,
                    confidence: weightedScore
                });
            }
        }

        // Find consensus period across different n-gram lengths
        const periodCounts = {};
        results.forEach(result => {
            result.periods.forEach(period => {
                const key = period.keyLength;
                periodCounts[key] = (periodCounts[key] || 0) + period.score;
            });
        });

        const consensusPeriods = Object.entries(periodCounts)
            .map(([period, score]) => ({ period: parseInt(period), score }))
            .filter(p => p.period > 1) // Exclude period 1 (monoalphabetic)
            .sort((a, b) => b.score - a.score);

        const consensusThreshold = configLoader.get('advanced_periodic_analysis.kasiski.consensus_threshold', 0.3);
        const strongConsensusRatio = configLoader.get('advanced_periodic_analysis.kasiski.strong_consensus_ratio', 1.5);

        const hasStrongConsensus = consensusPeriods.length > 0 &&
            consensusPeriods[0].score > consensusThreshold &&
            (consensusPeriods[0].score / (consensusPeriods[1]?.score || 0.1)) > strongConsensusRatio;

        return {
            hasPeriodicity: consensusPeriods.length > 0,
            confidence: Math.min(1.0, totalScore / ngramLengths.length),
            consensusPeriod: consensusPeriods[0]?.period || null,
            consensusScore: consensusPeriods[0]?.score || 0,
            hasStrongConsensus,
            detailedResults: results
        };
    }

    /**
     * Advanced autocorrelation with pattern recognition
     * @param {string} text - Ciphertext to analyze
     * @param {number} maxShift - Maximum shift to analyze
     * @returns {Object} Enhanced autocorrelation results
     */
    static advancedAutocorrelation(text, maxShift = null) {
        if (maxShift === null) {
            maxShift = configLoader.get('advanced_periodic_analysis.autocorrelation.max_shift', 25);
        }
        const cleaned = TextUtils.onlyLetters(text || '');
        if (cleaned.length < 30) {
            return { hasPeriodicity: false, confidence: 0, periods: [] };
        }

        const shifts = [];
        const length = cleaned.length;

        // Calculate autocorrelation for each shift
        for (let d = 1; d <= Math.min(maxShift, length - 10); d++) {
            let coincidences = 0;
            let comparisons = 0;

            // Use sliding window approach for more robust statistics
            const windowSizeRatio = configLoader.get('advanced_periodic_analysis.autocorrelation.window_size_ratio', 0.33);
            const windowStepRatio = configLoader.get('advanced_periodic_analysis.autocorrelation.window_step_ratio', 0.25);
            const windowSize = Math.min(100, Math.floor(length * windowSizeRatio));
            const stepSize = Math.floor(windowSize * windowStepRatio);

            for (let start = 0; start <= length - windowSize - d; start += stepSize) {
                const end = Math.min(start + windowSize, length - d);
                for (let i = start; i < end; i++) {
                    if (cleaned[i] === cleaned[i + d]) coincidences++;
                    comparisons++;
                }
            }

            const normalized = comparisons > 0 ? coincidences / comparisons : 0;
            const expected = 1 / 26; // Random baseline
            const significance = normalized - expected;

            shifts.push({
                shift: d,
                coincidences,
                comparisons,
                normalized,
                significance,
                zScore: significance > 0 ? significance / Math.sqrt(expected * (1 - expected) / comparisons) : 0
            });
        }

        // Find significant peaks
        const peaks = [];
        for (let i = 1; i < shifts.length - 1; i++) {
            const prev = shifts[i - 1];
            const curr = shifts[i];
            const next = shifts[i + 1];

            // Peak detection with multiple criteria
            const significanceThreshold = configLoader.get('advanced_periodic_analysis.autocorrelation.significance_threshold', 2.0);
            const isPeak = curr.significance > prev.significance &&
                          curr.significance > next.significance &&
                          curr.zScore > significanceThreshold; // Statistically significant

            if (isPeak) {
                peaks.push({
                    period: curr.shift,
                    significance: curr.significance,
                    zScore: curr.zScore,
                    strength: curr.significance * curr.zScore
                });
            }
        }

        peaks.sort((a, b) => b.strength - a.strength);

        // Analyze period relationships (harmonics, multiples)
        const periodRelationships = this._analyzePeriodRelationships(peaks);

        const hasStrongPeriodicity = peaks.length > 0 && peaks[0].zScore > 3.0;
        const confidence = peaks.length > 0 ?
            Math.min(1.0, peaks[0].strength / 0.1) : 0; // Normalize by expected strong signal

        return {
            hasPeriodicity: peaks.length > 0,
            hasStrongPeriodicity,
            confidence,
            primaryPeriod: peaks[0]?.period || null,
            peaks: peaks.slice(0, 5), // Top 5 peaks
            periodRelationships,
            detailedShifts: shifts
        };
    }

    /**
     * Analyze relationships between detected periods
     * @private
     */
    static _analyzePeriodRelationships(peaks) {
        if (peaks.length < 2) return { hasHarmonics: false, relationships: [] };

        const relationships = [];
        const primaryPeriod = peaks[0].period;

        for (let i = 1; i < Math.min(peaks.length, 4); i++) {
            const period = peaks[i].period;
            const ratio = period / primaryPeriod;

            // Check for harmonic relationships
            const nearestInteger = Math.round(ratio);
            const deviation = Math.abs(ratio - nearestInteger) / nearestInteger;

            if (deviation < 0.15) { // Within 15% of integer ratio
                relationships.push({
                    period1: primaryPeriod,
                    period2: period,
                    ratio,
                    nearestInteger,
                    deviation,
                    isHarmonic: true,
                    strength: peaks[i].strength * (1 - deviation)
                });
            }
        }

        return {
            hasHarmonics: relationships.length > 0,
            relationships,
            harmonicStrength: relationships.length > 0 ?
                relationships.reduce((sum, r) => sum + r.strength, 0) / relationships.length : 0
        };
    }

    /**
     * Conditional entropy analysis for polyalphabetic detection
     * @param {string} text - Ciphertext to analyze
     * @param {number} suspectedPeriod - Period to test
     * @returns {Object} Conditional entropy results
     */
    static conditionalEntropyAnalysis(text, suspectedPeriod) {
        const cleaned = TextUtils.onlyLetters(text || '');
        if (cleaned.length < suspectedPeriod * 3) {
            return { isPolyalphabetic: false, confidence: 0 };
        }

        // Split text into columns based on suspected period
        const columns = [];
        for (let i = 0; i < suspectedPeriod; i++) {
            columns.push('');
        }

        for (let i = 0; i < cleaned.length; i++) {
            columns[i % suspectedPeriod] += cleaned[i];
        }

        // Calculate entropy for each column
        const minColumnLength = configLoader.get('advanced_periodic_analysis.entropy_analysis.min_column_length', 5);
        const columnEntropies = columns.map(col => {
            if (col.length < minColumnLength) return 1.0; // High entropy for short columns
            return Stats.entropy(col);
        });

        const avgEntropy = columnEntropies.reduce((sum, e) => sum + e, 0) / columnEntropies.length;
        const entropyVariance = columnEntropies.reduce((sum, e) => sum + Math.pow(e - avgEntropy, 2), 0) / columnEntropies.length;

        // For polyalphabetic ciphers, each column should have similar entropy (close to expected value)
        // For monoalphabetic ciphers, entropy varies more between columns
        const expectedEntropy = configLoader.get('advanced_periodic_analysis.entropy_analysis.expected_entropy', 4.7);
        const varianceThreshold = configLoader.get('advanced_periodic_analysis.entropy_analysis.variance_threshold', 0.3);
        const deviationThreshold = configLoader.get('advanced_periodic_analysis.entropy_analysis.deviation_threshold', 1.0);

        const entropyDeviation = Math.abs(avgEntropy - expectedEntropy);
        const normalizedVariance = entropyVariance / (avgEntropy * avgEntropy);

        // Low variance + reasonable entropy = likely polyalphabetic
        const isPolyalphabetic = normalizedVariance < varianceThreshold && entropyDeviation < deviationThreshold;
        const confidence = isPolyalphabetic ?
            Math.max(0, 1 - normalizedVariance * 3 - entropyDeviation * 0.5) : 0;

        return {
            isPolyalphabetic,
            confidence,
            avgEntropy,
            entropyVariance: normalizedVariance,
            entropyDeviation,
            columnEntropies
        };
    }

    /**
     * Composite period detection combining multiple methods
     * @param {string} text - Ciphertext to analyze
     * @returns {Object} Comprehensive periodicity analysis
     */
    static detectCompositePeriodicity(text) {
        const cleaned = TextUtils.onlyLetters(text || '');
        if (cleaned.length < 40) {
            return {
                isPolyalphabetic: false,
                confidence: 0,
                detectedPeriod: null,
                methods: { kasiski: null, autocorrelation: null, entropy: null }
            };
        }

        // Run all detection methods
        const kasiskiResult = this.multiLengthKasiski(cleaned);
        const autocorrResult = this.advancedAutocorrelation(cleaned);

        // Test conditional entropy for top candidates
        const candidates = [];
        if (kasiskiResult.consensusPeriod) {
            candidates.push(kasiskiResult.consensusPeriod);
        }
        if (autocorrResult.primaryPeriod) {
            candidates.push(autocorrResult.primaryPeriod);
        }

        const entropyResults = candidates.map(period =>
            ({ period, ...this.conditionalEntropyAnalysis(cleaned, period) })
        );

        // Score each candidate based on all methods
        const scoredCandidates = candidates.map((period, index) => {
            const entropyResult = entropyResults[index];

            let totalScore = 0;
            let methodCount = 0;

            // Kasiski score
            if (kasiskiResult.consensusPeriod === period) {
                totalScore += kasiskiResult.confidence * 0.4;
                methodCount++;
            }

            // Autocorrelation score
            if (autocorrResult.primaryPeriod === period) {
                totalScore += autocorrResult.confidence * 0.4;
                methodCount++;
            }

            // Entropy score
            if (entropyResult.isPolyalphabetic) {
                totalScore += entropyResult.confidence * 0.2;
                methodCount++;
            }

            return {
                period,
                score: methodCount > 0 ? totalScore / methodCount : 0,
                methods: {
                    kasiski: kasiskiResult.consensusPeriod === period,
                    autocorrelation: autocorrResult.primaryPeriod === period,
                    entropy: entropyResult.isPolyalphabetic
                },
                entropyConfidence: entropyResult.confidence
            };
        });

        scoredCandidates.sort((a, b) => b.score - a.score);
        const bestCandidate = scoredCandidates[0];

        return {
            isPolyalphabetic: bestCandidate && bestCandidate.score > 0.4,
            confidence: bestCandidate ? bestCandidate.score : 0,
            detectedPeriod: bestCandidate ? bestCandidate.period : null,
            methods: {
                kasiski: kasiskiResult,
                autocorrelation: autocorrResult,
                entropy: entropyResults[0] || null
            },
            candidates: scoredCandidates.slice(0, 3)
        };
    }

    /**
     * Main analysis function combining all advanced methods
     * @param {string} text - Ciphertext to analyze
     * @param {Object} options - Analysis options
     * @returns {Object} Comprehensive analysis results
     */
    static analyze(text, options = {}) {
        const cleaned = TextUtils.onlyLetters(text || '');
        const minTextLength = configLoader.get('advanced_periodic_analysis.composite_detection.min_text_length', 30);

        if (cleaned.length < minTextLength) {
            return {
                isPolyalphabetic: false,
                confidence: 0,
                recommendation: 'insufficient_data',
                methods: {}
            };
        }

        const compositeResult = this.detectCompositePeriodicity(cleaned);

        // Enhanced confidence calculation
        let enhancedConfidence = compositeResult.confidence;

        // Bonus for multiple methods agreeing
        const methodAgreement = Object.values(compositeResult.methods).filter(m =>
            m && (m.hasPeriodicity || m.isPolyalphabetic)
        ).length;

        if (methodAgreement >= 2) {
            enhancedConfidence = Math.min(1.0, enhancedConfidence * 1.3);
        }

        // Penalty for very short texts
        const shortTextLength = 60;
        const shortTextPenalty = configLoader.get('advanced_periodic_analysis.composite_detection.short_text_penalty', 0.7);

        if (cleaned.length < shortTextLength && enhancedConfidence > 0.5) {
            enhancedConfidence *= shortTextPenalty;
        }

        let recommendation = 'unclear';
        if (enhancedConfidence > 0.7) {
            recommendation = 'likely_polyalphabetic';
        } else if (enhancedConfidence < 0.3) {
            recommendation = 'likely_monoalphabetic';
        }

        return {
            isPolyalphabetic: compositeResult.isPolyalphabetic,
            confidence: enhancedConfidence,
            detectedPeriod: compositeResult.detectedPeriod,
            recommendation,
            methodAgreement,
            detailedResults: compositeResult
        };
    }
}

export default AdvancedPeriodicAnalysis;
