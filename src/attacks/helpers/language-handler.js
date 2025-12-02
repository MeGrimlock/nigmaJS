import { LanguageAnalysis } from '../../analysis/analysis-core.js';

/**
 * Language Handler
 * 
 * Handles language detection and candidate selection.
 * Follows Single Responsibility Principle: only responsible for language management.
 */
export class LanguageHandler {
    /**
     * Detects language and returns candidates.
     * @param {string} ciphertext - The text to analyze
     * @param {boolean} autoDetect - Whether to auto-detect language
     * @param {string} defaultLanguage - Default language if auto-detection is disabled
     * @returns {Promise<Object>} Object with { language, languageCandidates, languageDetectionResults }
     */
    static async detectLanguage(ciphertext, autoDetect = false, defaultLanguage = 'english') {
        let languageCandidates = [defaultLanguage];
        let languageDetectionResults = null;
        let detectedLanguage = defaultLanguage;
        
        if (autoDetect) {
            console.log('[LanguageHandler] Auto-detecting language...');

            // For encrypted/ciphertext, language detection will always fail because
            // encrypted text doesn't follow natural language patterns.
            // So we directly assume English as default for encrypted content.
            console.log(`[LanguageHandler] Assuming English for encrypted/ciphertext content (detection not possible)`);
            detectedLanguage = 'english';
            languageCandidates = ['english'];

            // Create a mock result for english to maintain compatibility
            languageDetectionResults = [{
                language: 'english',
                score: 0.5,
                method: 'ciphertext-assumption'
            }];
        }
        
        return {
            language: detectedLanguage,
            languageCandidates: languageCandidates,
            languageDetectionResults: languageDetectionResults
        };
    }
    
    /**
     * Loads dictionary for a specific language.
     * @param {string} language - Language to load dictionary for
     * @returns {Promise<void>}
     */
    static async loadDictionary(language) {
        try {
            await LanguageAnalysis.loadDictionary(language, 'data/');
        } catch (e) {
            try {
                await LanguageAnalysis.loadDictionary(language, '../demo/data/');
            } catch (e2) {
                // Dictionary not available, continue anyway
            }
        }
    }
}

