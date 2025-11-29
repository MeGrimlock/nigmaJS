import { Stats } from './stats.js';

/**
 * IC Sample Size Correction
 * 
 * This module adjusts Index of Coincidence (IC) expectations and tolerances
 * based on sample size (text length). IC variance increases significantly
 * for shorter texts, so we need to adjust both expected values and tolerances.
 * 
 * Key insights:
 * - IC variance ∝ 1/√N (where N is text length)
 * - Short texts (< 50 chars): High variance, unreliable IC
 * - Medium texts (50-200 chars): Moderate variance
 * - Long texts (> 200 chars): Lower variance, more reliable IC
 * 
 * Formula for expected IC variance:
 * σ²(IC) ≈ (IC_expected * (1 - IC_expected)) / N
 * 
 * For normalized IC (×26):
 * - English: IC ≈ 1.73, variance ≈ (1.73 * (1 - 1.73/26)) / N
 * - Random: IC ≈ 1.0, variance ≈ (1.0 * (1 - 1.0/26)) / N
 * 
 * References:
 * - "Cryptanalysis: A Study of Ciphers and Their Solution" (Gaines)
 * - Statistical analysis of IC variance in cryptographic texts
 */
export class ICSampleCorrection {
    /**
     * Calculates expected IC for a given text length and language.
     * For very short texts, IC may deviate from the theoretical value.
     * 
     * @param {number} textLength - Length of text (number of letters)
     * @param {string} language - Language code ('english', 'spanish', etc.)
     * @param {number} baseIC - Base IC for the language (default: 1.73 for English)
     * @returns {number} Expected IC adjusted for sample size
     */
    static expectedIC(textLength, language = 'english', baseIC = null) {
        // Base IC values by language (normalized ×26)
        const baseICs = {
            'english': 1.73,
            'spanish': 1.94,
            'french': 1.90,
            'german': 1.76,
            'italian': 1.94,
            'portuguese': 1.94
        };
        
        const expectedBaseIC = baseIC || baseICs[language.toLowerCase()] || 1.73;
        
        // For very short texts (< 20 chars), IC is highly unreliable
        // Return a wider range estimate
        if (textLength < 20) {
            // IC can vary significantly, return midpoint of possible range
            return expectedBaseIC;
        }
        
        // For short texts (20-50 chars), IC may be slightly lower due to sampling
        if (textLength < 50) {
            // Small downward adjustment for sampling effects
            return expectedBaseIC * 0.98;
        }
        
        // For medium and long texts, IC should be close to base value
        return expectedBaseIC;
    }
    
    /**
     * Calculates expected standard deviation of IC for a given text length.
     * 
     * @param {number} textLength - Length of text
     * @param {number} expectedIC - Expected IC value (normalized)
     * @returns {number} Expected standard deviation
     */
    static expectedStdDev(textLength, expectedIC) {
        if (textLength < 2) {
            return Infinity; // Cannot calculate for very short texts
        }
        
        // Formula: σ²(IC) ≈ (IC * (1 - IC/26)) / N
        // For normalized IC (×26), we need to account for the normalization
        // The unnormalized IC is IC_norm / 26
        const unnormalizedIC = expectedIC / 26;
        const variance = (unnormalizedIC * (1 - unnormalizedIC)) / textLength;
        
        // Convert back to normalized scale
        const normalizedVariance = variance * 26 * 26; // (×26)² for variance
        return Math.sqrt(normalizedVariance);
    }
    
    /**
     * Calculates appropriate tolerance for IC validation.
     * Uses k-sigma rule: tolerance = k * σ, where k is typically 2-3.
     * 
     * @param {number} textLength - Length of text
     * @param {number} expectedIC - Expected IC value
     * @param {number} kSigma - Number of standard deviations (default: 2.5)
     * @returns {number} Tolerance (absolute value)
     */
    static tolerance(textLength, expectedIC, kSigma = 2.5) {
        const stdDev = ICSampleCorrection.expectedStdDev(textLength, expectedIC);
        return kSigma * stdDev;
    }
    
    /**
     * Calculates percentage tolerance for IC validation.
     * 
     * @param {number} textLength - Length of text
     * @param {number} expectedIC - Expected IC value
     * @param {number} kSigma - Number of standard deviations (default: 2.5)
     * @returns {number} Tolerance as percentage
     */
    static tolerancePercent(textLength, expectedIC, kSigma = 2.5) {
        const absoluteTolerance = ICSampleCorrection.tolerance(textLength, expectedIC, kSigma);
        return (absoluteTolerance / expectedIC) * 100;
    }
    
    /**
     * Gets recommended tolerance configuration for IC validation.
     * Returns both absolute and percentage tolerances.
     * 
     * @param {number} textLength - Length of text
     * @param {number} expectedIC - Expected IC value
     * @param {Object} options - Options
     * @param {number} options.kSigma - Number of standard deviations (default: 2.5)
     * @param {number} options.minPercent - Minimum percentage tolerance (default: 5%)
     * @param {number} options.maxPercent - Maximum percentage tolerance (default: 60%)
     * @returns {Object} { absolute, percent, stdDev, expectedIC }
     */
    static getToleranceConfig(textLength, expectedIC, options = {}) {
        const {
            kSigma = 2.5,
            minPercent = 5,
            maxPercent = 60
        } = options;
        
        const stdDev = ICSampleCorrection.expectedStdDev(textLength, expectedIC);
        const absoluteTolerance = kSigma * stdDev;
        let percentTolerance = (absoluteTolerance / expectedIC) * 100;
        
        // Clamp to min/max bounds
        percentTolerance = Math.max(minPercent, Math.min(maxPercent, percentTolerance));
        
        // Recalculate absolute tolerance based on clamped percentage
        const clampedAbsoluteTolerance = expectedIC * (percentTolerance / 100);
        
        return {
            absolute: clampedAbsoluteTolerance,
            percent: percentTolerance,
            stdDev: stdDev,
            expectedIC: expectedIC,
            kSigma: kSigma
        };
    }
    
    /**
     * Validates if an actual IC value is within expected range.
     * 
     * @param {number} actualIC - Actual IC value measured
     * @param {number} textLength - Length of text
     * @param {string} language - Language code
     * @param {number} baseIC - Base IC for language (optional)
     * @param {Object} options - Validation options
     * @returns {Object} { valid, expectedIC, tolerance, difference, zScore }
     */
    static validate(actualIC, textLength, language = 'english', baseIC = null, options = {}) {
        const expectedIC = ICSampleCorrection.expectedIC(textLength, language, baseIC);
        const toleranceConfig = ICSampleCorrection.getToleranceConfig(textLength, expectedIC, options);
        
        const difference = Math.abs(actualIC - expectedIC);
        const zScore = toleranceConfig.stdDev > 0 ? difference / toleranceConfig.stdDev : 0;
        
        const valid = difference <= toleranceConfig.absolute;
        
        return {
            valid: valid,
            expectedIC: expectedIC,
            actualIC: actualIC,
            tolerance: toleranceConfig.absolute,
            tolerancePercent: toleranceConfig.percent,
            difference: difference,
            zScore: zScore,
            stdDev: toleranceConfig.stdDev
        };
    }
    
    /**
     * Gets expected IC range [min, max] for a given text length.
     * 
     * @param {number} textLength - Length of text
     * @param {string} language - Language code
     * @param {number} baseIC - Base IC for language (optional)
     * @param {Object} options - Options
     * @returns {Object} { min, max, expected, tolerance }
     */
    static getExpectedRange(textLength, language = 'english', baseIC = null, options = {}) {
        const expectedIC = ICSampleCorrection.expectedIC(textLength, language, baseIC);
        const toleranceConfig = ICSampleCorrection.getToleranceConfig(textLength, expectedIC, options);
        
        return {
            min: expectedIC - toleranceConfig.absolute,
            max: expectedIC + toleranceConfig.absolute,
            expected: expectedIC,
            tolerance: toleranceConfig.absolute,
            tolerancePercent: toleranceConfig.percent
        };
    }
}

export default ICSampleCorrection;

