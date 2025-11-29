import { Stats } from './stats.js';
import { TextUtils } from '../core/text-utils.js';
import configLoader from '../config/config-loader.js';

/**
 * Periodic Analysis for Cryptographic Detection
 * Improved and noise-resistant version.
 */
export class PeriodicAnalysis {

    /**
     * Computes how repetitive a text is.
     * Helps detect AAAA, ABCABC, etc. which break IC/autocorrelation heuristics.
     * Returns ratio of repeated adjacent chars.
     */
    static _repetitionScore(text) {
        const cleaned = TextUtils.onlyLetters(text);
        if (cleaned.length < configLoader.get('periodic_analysis.repetition_score.minimum_text_length', 3)) return 0;

        let totalRepetitions = 0;
        let currentRun = 1;

        for (let i = 1; i < cleaned.length; i++) {
            if (cleaned[i] === cleaned[i - 1]) {
                currentRun++;
            } else {
                // Count repetitions only for runs of configured minimum identical letters
                if (currentRun >= configLoader.get('periodic_analysis.repetition_score.minimum_run_length', 3)) {
                    totalRepetitions += currentRun - 1; // Number of repeated letters in the run
                }
                currentRun = 1;
            }
        }

        // Handle the last run
        if (currentRun >= configLoader.get('periodic_analysis.repetition_score.minimum_run_length', 3)) {
            totalRepetitions += currentRun - 1;
        }

        return totalRepetitions / cleaned.length;
    }

    /**
     * PERIODIC IC
     */
    static periodicIC(text, options = {}) {
        const {
            maxPeriod = configLoader.get('periodic_analysis.periodic_ic.max_period', 20),
            minPeriod = configLoader.get('periodic_analysis.periodic_ic.min_period', 1)
        } = options;

        const cleaned = TextUtils.onlyLetters(text);
        const length = cleaned.length;

        if (length < configLoader.get('periodic_analysis.periodic_ic.min_text_length', 10)) {
            return [];
        }

        // 🔥 Dynamic protection against tiny texts
        const maxAllowedPeriod = Math.min(
            maxPeriod,
            Math.floor(length / 3),
            12
        );

        const periods = [];

        for (let m = minPeriod; m <= maxAllowedPeriod; m++) {

            const columns = [];
            for (let col = 0; col < m; col++) {
                let columnText = '';
                for (let i = col; i < length; i += m) {
                    columnText += cleaned[i];
                }
                columns.push(columnText);
            }

            // 🔥 Require minimum useful column size
            const columnICs = columns
                .filter(col => col.length >= configLoader.get('periodic_analysis.periodic_ic.min_column_length', 5))
                .map(col => Stats.indexOfCoincidence(col, false)); // Use non-normalized IC

            if (columnICs.length === 0) {
                continue;
            }

            const meanIC = columnICs.reduce((s, x) => s + x, 0) / columnICs.length;
            const variance =
                columnICs.length > 1
                    ? columnICs.reduce((s, x) => s + Math.pow(x - meanIC, 2), 0) / columnICs.length
                    : 0;

            periods.push({
                period: m,
                meanIC,
                variance,
                columnICs,
                columnLengths: columns.map(c => c.length)
            });
        }

        const maxVariancePeriod = periods.reduce(
            (best, p) => (p.variance > (best?.variance || 0) ? p : best),
            null
        );

        const minVariancePeriod = periods.reduce(
            (best, p) => (p.variance < (best?.variance || Infinity) ? p : best),
            null
        );

        // Return just the periods array as expected by tests
        return periods;
    }

    /**
     * AUTO-CORRELATION
     */
    static autoCorrelation(text, options = {}) {
        const {
            maxShift = 20
        } = options;

        const cleaned = TextUtils.onlyLetters(text);
        const length = cleaned.length;

        if (length < 10) {
            return { shifts: [], peaks: [] };
        }

        const shifts = [];

        for (let d = 1; d <= Math.min(maxShift, length - 1); d++) {
            let coincidences = 0;
            let comparisons = 0;

            for (let i = 0; i < length - d; i++) {
                if (cleaned[i] === cleaned[i + d]) coincidences++;
                comparisons++;
            }

            const normalized = comparisons > 0 ? coincidences / comparisons : 0;

            shifts.push({
                shift: d,
                coincidences,
                comparisons,
                normalized
            });
        }

        // 🔥 Baseline depends on alphabet (1/26)
        const baseline = 1 / 26;
        const threshold = baseline + 0.03;

        const peaks = [];
        for (let i = 1; i < shifts.length - 1; i++) {
            const prev = shifts[i - 1].normalized;
            const curr = shifts[i].normalized;
            const next = shifts[i + 1].normalized;

            if (curr > prev && curr > next && curr > threshold) {
                peaks.push({
                    shift: shifts[i].shift,
                    value: curr,
                    prominence: curr - Math.min(prev, next)
                });
            }
        }

        peaks.sort((a, b) => b.prominence - a.prominence);

        return {
            shifts,
            peaks,
            avgNormalized:
                shifts.length > 0
                    ? shifts.reduce((s, x) => s + x.normalized, 0) / shifts.length
                    : 0
        };
    }

    /**
     * COMBINED ANALYSIS
     */
    static analyze(text, options = {}) {
        const {
            maxPeriod = 20,
            maxShift = 20
        } = options;

        const cleaned = TextUtils.onlyLetters(text);
        const length = cleaned.length;

        if (length < configLoader.get('periodic_analysis.analyze.minimum_text_length', 10)) {
            return null; // Tests expect null for very short texts
        }

        const periodicICResult = PeriodicAnalysis.periodicIC(cleaned, { maxPeriod });
        const autoCorrResult = PeriodicAnalysis.autoCorrelation(cleaned, { maxShift });
        const repetitionScore = PeriodicAnalysis._repetitionScore(cleaned);

        let confidence = 0.5;

        // 🔥 Evidence 0 – Repetition penalty
        if (repetitionScore > 0.25) {
            confidence -= 0.2;
        }

        // Evidence 1 – Periodic IC variance
        if (periodicICResult.length > 0) {
            // Calculate average variance from periodic results
            const variances = periodicICResult.map(p => p.variance).filter(v => v !== undefined);
            if (variances.length > 0) {
                const avgVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
                if (avgVariance > 0.1) {
                    confidence += 0.2;
                } else if (avgVariance < 0.05) {
                    confidence -= 0.2;
                }
            }
        }

        // Evidence 2 – Autocorrelation peaks
        if (autoCorrResult.peaks.length > 0) {
            const topPeak = autoCorrResult.peaks[0];
            if (topPeak.value > 0.08) {
                confidence += 0.3;
            }
        }

        // Evidence 3 – Multiple autocorrelation peaks
        if (autoCorrResult.peaks.length >= 2) {
            const ratio = autoCorrResult.peaks[0].shift / autoCorrResult.peaks[1].shift;
            if (Math.abs(Math.round(ratio) - ratio) < 0.15) {
                confidence += 0.2;
            }
        }

        // 🔥 Clamp to [0,1]
        confidence = Math.max(0, Math.min(1, confidence));

        let recommendation = 'unclear_periodicity';

        // 🔥 Recommendation logic
        if (confidence > 0.7) {
            recommendation = 'likely_polyalphabetic';
        } else if (confidence < 0.3) {
            recommendation = 'likely_monoalphabetic';
        }

        // Analysis details
        const analysis = {
            periodicityDetected: confidence > 0.6,
            strongestPeriod: periodicICResult.length > 0 ?
                periodicICResult.reduce((max, p) => p.variance > max.variance ? p : max, periodicICResult[0]) : null,
            varianceThreshold: 0.1,
            peakThreshold: 0.08
        };

        return {
            repetitionScore,
            confidence,
            analysis,
            periodicIC: periodicICResult,
            autoCorrelation: autoCorrResult,
            recommendation
        };
    }
}

export default PeriodicAnalysis;
