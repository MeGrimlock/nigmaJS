import { DictionaryValidator } from '../../language/dictionary-validator.js';

/**
 * Result Validator
 * 
 * Validates decryption results using dictionary validation.
 * Follows Single Responsibility Principle: only responsible for result validation.
 */
export class ResultValidator {
    /**
     * Validates a single result with dictionary.
     * @param {Object} result - Result object with plaintext
     * @param {string} language - Language to use for validation
     * @returns {Promise<Object>} Result with added validation info
     */
    static async validateResult(result, language) {
        if (!result || !result.plaintext) {
            return result;
        }
        
        try {
            const validator = new DictionaryValidator(language);
            const validation = await validator.validate(result.plaintext);
            const wordCoverage = parseFloat(validation.metrics.wordCoverage) / 100;
            const dictConfidence = validation.confidence;
            
            // Add validation info to result
            result.wordCoverage = wordCoverage;
            result.dictConfidence = dictConfidence;
            
            // Calculate combined score: confidence + dictionary validation
            result.combinedScore = result.confidence + (wordCoverage * 0.5) + (dictConfidence * 0.3);
            
            return result;
        } catch (error) {
            // Dictionary validation failed, return result without validation
            result.wordCoverage = 0;
            result.dictConfidence = 0;
            result.combinedScore = result.confidence;
            return result;
        }
    }
    
    /**
     * Validates multiple results and returns best one.
     * @param {Array<Object>} results - Array of result objects
     * @param {string} language - Language to use for validation
     * @returns {Promise<Object>} Best validated result
     */
    static async validateMultiple(results, language) {
        if (!results || results.length === 0) {
            return null;
        }
        
        // Validate all results
        const validatedResults = await Promise.all(
            results.map(r => this.validateResult(r, r.language || language))
        );
        
        // Sort by combined score (higher is better)
        validatedResults.sort((a, b) => (b.combinedScore || -Infinity) - (a.combinedScore || -Infinity));
        
        return validatedResults[0];
    }
    
    /**
     * Checks if a result is excellent (should stop early).
     * @param {Object} result - Result object
     * @returns {boolean} True if result is excellent
     */
    static isExcellentResult(result) {
        return result && 
               result.confidence > 0.85 && 
               (result.wordCoverage || 0) > 0.50;
    }
    
    /**
     * Checks if a result is good (should stop language iteration).
     * @param {Object} result - Result object
     * @returns {boolean} True if result is good
     */
    static isGoodResult(result) {
        return result && 
               result.confidence > 0.80 && 
               (result.wordCoverage || 0) > 0.40;
    }
}

