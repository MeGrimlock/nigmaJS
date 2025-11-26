import { LanguageAnalysis } from '../../analysis/analysis.js';

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
            try {
                // Try to load dictionaries for better detection (non-blocking)
                const allCandidateLanguages = ['english', 'spanish', 'french', 'german', 'italian', 'portuguese'];
                for (const lang of allCandidateLanguages) {
                    // Try to load dictionary, but don't wait if it fails
                    LanguageAnalysis.loadDictionary(lang, 'data/').catch(() => {});
                    LanguageAnalysis.loadDictionary(lang, '../demo/data/').catch(() => {});
                }
                
                // Detect language using statistical analysis + dictionary validation
                const langResults = LanguageAnalysis.detectLanguage(ciphertext);
                languageDetectionResults = langResults;
                
                if (langResults && langResults.length > 0) {
                    // Get top 5 language candidates to try (in order of probability)
                    languageCandidates = langResults
                        .slice(0, 5) // Try top 5 languages
                        .map(r => r.language);
                    
                    detectedLanguage = langResults[0].language;
                    console.log(`[LanguageHandler] Detected language: ${detectedLanguage} (confidence: ${langResults[0].score.toFixed(2)})`);
                    console.log(`[LanguageHandler] Will try ALL methods for each language in order: ${languageCandidates.join(', ')}`);
                } else {
                    console.warn('[LanguageHandler] Could not detect language, defaulting to english');
                    detectedLanguage = 'english';
                    languageCandidates = ['english'];
                }
            } catch (error) {
                console.warn('[LanguageHandler] Language detection failed:', error.message);
                detectedLanguage = 'english';
                languageCandidates = ['english'];
            }
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

