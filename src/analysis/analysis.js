// -------------------------------------------
// analysis.js — Versión corregida y estable
// -------------------------------------------

import 'regenerator-runtime/runtime';

import { LanguageAnalysis } from './analysis-core.js';   // NUEVO: extraemos lógica pesada
import { Stats } from './stats.js';
import { NgramScorer } from './ngram-scorer.js';
import { CipherIdentifier } from './identifier.js';
import { Kasiski } from './kasiski.js';
import { PeriodicAnalysis } from './periodic-analysis.js';
import { ShortTextPatterns } from './short-text-patterns.js';
import { TextUtils } from '../core/text-utils.js';

// Modelos de lenguaje
import spanishData from '../language/models/spanish.js';
import englishData from '../language/models/english.js';
import italianData from '../language/models/italian.js';
import frenchData from '../language/models/french.js';
import germanData from '../language/models/german.js';
import portugueseData from '../language/models/portuguese.js';
import russianData from '../language/models/russian.js';
import chineseData from '../language/models/chinese.js';

export const Languages = {
    english: englishData,
    spanish: spanishData,
    italian: italianData,
    french: frenchData,
    german: germanData,
    portuguese: portugueseData,
    russian: russianData,
    chinese: chineseData
};

// ======================================================
//  OBJETO ANALYSIS — FACHADA DE ALTO NIVEL
// ======================================================

const Analysis = {
    // ---------------------------------------
    // Limpiador estándar
    // ---------------------------------------
    clean(text) {
        return TextUtils.onlyLetters(text || "").toUpperCase();
    },

    // ---------------------------------------
    // Puntaje de lenguaje usando NgramScorer
    // ---------------------------------------
    scoreLanguage(text, language = "english") {
        const model = Languages[language];
        if (!model) return 0;

        const scorer = new NgramScorer(language);
        return scorer.score(text);
    },

    // ---------------------------------------
    // Detección de idioma (delegado a LanguageAnalysis)
    // ---------------------------------------
    detectLanguage(text) {
        return LanguageAnalysis.detectLanguage(text);
    },

    // ---------------------------------------
    // Detección de cifrado (Identifier.js)
    // ---------------------------------------
    identifyCipher(text) {
        const result = CipherIdentifier.identify(text);
        // Transform to expected format
        return {
            detected: result.families ? result.families.map(f => f.type) : [],
            ...result
        };
    },

    // ---------------------------------------
    // Wrapper para Kasiski
    // ---------------------------------------
    kasiski(text) {
        return Kasiski.examine(text);
    },

    // ---------------------------------------
    // Wrapper Periodic IC
    // ---------------------------------------
    periodicIC(text, maxPeriod = 20) {
        return PeriodicAnalysis.periodicIC(text, { maxPeriod });
    },

    // ---------------------------------------
    // Wrapper AutoCorrelation
    // ---------------------------------------
    autoCorrelation(text, maxShift = 20) {
        return PeriodicAnalysis.autoCorrelation(text, { maxShift });
    },

    // ---------------------------------------
    // Wrapper ShortTextPatterns
    // ---------------------------------------
    shortTextPatterns(text) {
        return ShortTextPatterns.analyzeShortText(text);
    },

    // ======================================================
    // ANÁLISIS COMPLETO — Usa TODO el sistema
    // ======================================================
    analyze(text, language = "english") {

        if (!text || text.trim().length === 0) {
            return {
                textLength: 0,
                cleaned: "",
                error: "Empty text provided",
                cryptographic: {
                    indexOfCoincidence: 0,
                    chiSquared: 0,
                    frequencyProfile: {}
                },
                periodicAnalysis: null,
                kasiski: null,
                languageAnalysis: null,
                patterns: null,
                identification: { detected: [] }
            };
        }

        const cleaned = Analysis.clean(text);

        // Métricas básicas
        const ic = Stats.indexOfCoincidence(cleaned, true);
        const icNonNormalized = Stats.indexOfCoincidence(cleaned, false);
        const entropy = LanguageAnalysis.calculateEntropy(cleaned);
        const observed = LanguageAnalysis.getLetterFrequencies(cleaned);

        // Chi-squared consistente
        const expected = Languages[language]?.monograms || englishData.monograms;
        const chiSquared = LanguageAnalysis.calculateChiSquared(observed, expected);

        // Scoring del idioma
        const langScore = this.scoreLanguage(cleaned, language);

        // Cipher detection
        const cipher = this.identifyCipher(cleaned);

        // Periodicidad
        const periodicIC = this.periodicIC(cleaned);
        const autoCorrelation = this.autoCorrelation(cleaned);

        // Short text analysis
        const shortPatterns = this.shortTextPatterns(cleaned);

        // Kasiski analysis
        const kasiski = this.kasiski(cleaned);

        // Language analysis
        const languageAnalysis = {
            score: langScore,
            ngramScore: langScore,
            scorerLanguage: language,
            detected: this.detectLanguage(cleaned),
            entropy: entropy
        };

        return {
            textLength: cleaned.length,
            cleaned,
            cryptographic: {
                indexOfCoincidence: ic,
                chiSquared: chiSquared,
                frequencyProfile: observed
            },
            periodicAnalysis: {
                periodicIC: periodicIC,
                autoCorrelation: autoCorrelation
            },
            kasiski: kasiski,
            languageAnalysis: languageAnalysis,
            patterns: shortPatterns,
            identification: {
                detected: cipher.families ? cipher.families.map(f => f.type) : []
            }
        };
    }
};

// Export por compatibilidad
export { Analysis };
export default Analysis;
