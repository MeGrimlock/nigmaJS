import 'regenerator-runtime/runtime';
import { CipherIdentifier } from '../analysis/identifier.js';
import { LanguageAnalysis } from '../analysis/analysis.js';
import { configLoader } from '../config/config-loader.js';
import { StrategySelector } from './helpers/strategy-selector.js';
import { LanguageHandler } from './helpers/language-handler.js';
import { ResultValidator } from './helpers/result-validator.js';
import { ResultAggregator } from './helpers/result-aggregator.js';
import { HillClimb } from '../search/hillclimb.js';
import { SimulatedAnnealing } from '../search/simulated-annealing.js';
import { DictionaryValidator } from '../language/dictionary-validator.js';
import { segmentText } from '../language/word-segmenter.js';
import { TextUtils } from '../core/text-utils.js';

// Debug flag: set to false to disable verbose logging (useful for tests)
const DEBUG = process.env.NIGMAJS_DEBUG !== 'false' && process.env.NODE_ENV !== 'test';
const log = DEBUG ? console.log.bind(console) : () => {};
const warn = DEBUG ? console.warn.bind(console) : () => {};

/**
 * Orchestrator: Intelligent attack coordinator for classical ciphers.
 *
 * Workflow:
 * 1. Detect language (if auto-detection enabled)
 * 2. Detect cipher type using CipherIdentifier
 * 3. Select appropriate attack strategies
 * 4. Execute strategies for each language candidate
 * 5. Validate and return best result
 */
export class Orchestrator {
    /**
     * @param {string} language - Target language ('english', 'spanish', etc.) or 'auto'
     */
    constructor(language = 'english') {
        this.language = language;
        this.autoDetectLanguage = (language === 'auto' || !language);
        this.languageDetectionResults = null;
    }

    // ===========================
    //      PRIVATE HELPERS
    // ===========================

    /**
     * Paso 0/1/2 compartido: detecta idioma(s), tipo de cifrado y estrategias.
     * NO emite progreso (se usa en autoDecrypt).
     */
    async _detectLanguageAndCipher(ciphertext) {
        const langInfo = await LanguageHandler.detectLanguage(
            ciphertext,
            this.autoDetectLanguage,
            this.language
        );

        this.language = langInfo.language;
        this.languageDetectionResults = langInfo.languageDetectionResults;

        const languageCandidates = langInfo.languageCandidates || [langInfo.language];
        const languageForDetection = languageCandidates[0] === 'auto'
            ? 'english'
            : languageCandidates[0];

        const detection = await CipherIdentifier.identify(ciphertext, languageForDetection);
        const topCandidate = detection.families[0];

        log(`[Orchestrator] Detected cipher: ${topCandidate.type} (confidence: ${topCandidate.confidence})`);

        const strategies = StrategySelector.selectStrategies(
            topCandidate,
            detection.stats,
            ciphertext,
            this.language,
            this.languageDetectionResults,
            this.autoDetectLanguage
        );

        log(`[Orchestrator] Selected ${strategies.length} strategy/strategies`);

        return { langInfo, languageCandidates, detection, topCandidate, strategies };
    }

    /**
     * Re-detección de idioma a partir del plaintext.
     * Mantiene la misma lógica y umbrales que tu código original.
     *
     * @param {string} plaintext
     * @param {string} originalLanguage - idioma que se estaba intentando (tryLanguage)
     * @returns {{ language: string }} al menos.
     */
    _redetectLanguageFromPlaintext(plaintext, originalLanguage) {
        let detectedLanguageFromPlaintext = originalLanguage;

        if (!plaintext) {
            return { language: detectedLanguageFromPlaintext };
        }

        try {
            const plaintextLangResults = LanguageAnalysis.detectLanguage(plaintext);
            if (!plaintextLangResults || plaintextLangResults.length === 0) {
                return { language: detectedLanguageFromPlaintext };
            }

            const topPlaintextLang = plaintextLangResults[0];

            const redetectionConfig = configLoader.get('language_detection.plaintext_redetection', {}) || {};
            const confidentScoreThreshold = redetectionConfig.confident_score_threshold ?? 250;
            const minScoreDifference = redetectionConfig.min_score_difference ?? 100;
            const minDictValidation = redetectionConfig.min_dict_validation ?? 0.3;

            const originalLangResult = plaintextLangResults.find(r => r.language === originalLanguage);
            const originalLangScore = originalLangResult ? originalLangResult.score : Infinity;

            let newLangDictScore = 0;
            try {
                const newLangDict = LanguageAnalysis.getDictionary(topPlaintextLang.language);
                if (newLangDict && plaintext) {
                    const words = plaintext
                        .toUpperCase()
                        .split(/\s+/)
                        .filter(w => w.length >= 3);

                    if (words.length > 0) {
                        const validWords = words.filter(w => newLangDict.has(w)).length;
                        newLangDictScore = validWords / words.length;
                    }
                }
            } catch (e) {
                // Dictionary not available for candidate language; ignore
            }

            // Mantengo tu lógica exacta: menor score = mejor (distancia, p.ej.)
            if (
                topPlaintextLang.score < confidentScoreThreshold &&
                topPlaintextLang.language !== originalLanguage &&
                topPlaintextLang.score < originalLangScore - minScoreDifference &&
                newLangDictScore > minDictValidation
            ) {
                detectedLanguageFromPlaintext = topPlaintextLang.language;
                log(
                    `[Orchestrator] Plaintext language re-detection: ${originalLanguage} → ${detectedLanguageFromPlaintext} ` +
                    `(score: ${topPlaintextLang.score.toFixed(2)} vs ${originalLangScore.toFixed(2)}, ` +
                    `dict: ${(newLangDictScore * 100).toFixed(0)}%)`
                );
            }

            return {
                language: detectedLanguageFromPlaintext
            };
        } catch (err) {
            // Si algo falla, seguimos con el idioma original
            return { language: detectedLanguageFromPlaintext };
        }
    }

    /**
     * Aplica word segmentation si el plaintext no tiene espacios.
     *
     * @param {string} plaintext
     * @param {string} language
     * @returns {string}
     */
    _applyWordSegmentation(plaintext, language) {
        if (!plaintext) return plaintext;

        const hasSpaces = /\s/.test(plaintext);
        if (hasSpaces || plaintext.length <= 10) {
            return plaintext;
        }

        try {
            const dict = LanguageAnalysis.getDictionary(language || this.language);
            if (!dict) return plaintext;

            const cleanText = TextUtils.onlyLetters(plaintext);
            const segmented = segmentText(cleanText, dict, {
                maxWordLength: 20,
                minWordLength: 2,
                preserveUnknown: true
            });

            if (segmented && segmented !== cleanText) {
                log(
                    `[Orchestrator] Applied word segmentation: ${cleanText.length} chars → ` +
                    `${segmented.split(/\s+/).length} words`
                );
                return segmented;
            }
        } catch (segError) {
            warn('[Orchestrator] Word segmentation failed:', segError);
        }

        return plaintext;
    }

    /**
     * Validación de diccionario sobre el resultado final.
     *
     * @param {Object} result - { plaintext, language, ... }
     * @param {boolean} useDictionary
     * @returns {Promise<Object>}
     */
    async _finalDictionaryValidation(result, useDictionary) {
        if (!useDictionary || !result || !result.plaintext) {
            return result;
        }

        try {
            const validator = new DictionaryValidator(result.language || this.language);
            const validation = await validator.validate(result.plaintext);
            return {
                ...result,
                dictionaryValidation: validation
            };
        } catch (error) {
            warn('[Orchestrator] Final dictionary validation failed:', error);
            return result;
        }
    }

    // ===========================
    //        autoDecrypt
    // ===========================

    /**
     * Auto-decryption sin reporting de progreso.
     *
     * @param {string} ciphertext
     * @param {Object} options
     * @param {boolean} options.tryMultiple - Try multiple strategies and return best (default: true).
     * @param {number} options.maxTime - Maximum time in ms (default: 60000).
     * @param {boolean} options.useDictionary - Use dictionary validation (default: true).
     */
    async autoDecrypt(ciphertext, options = {}) {
        const {
            tryMultiple = true,
            maxTime = 60000,
            useDictionary = true
        } = options;

        const startTime = Date.now();

        // Paso 0/1/2: idioma + cipher + estrategias
        const {
            langInfo,
            languageCandidates,
            topCandidate,
            strategies
        } = await this._detectLanguageAndCipher(ciphertext);

        const originalLanguage = this.language;
        const results = [];
        let bestResultAcrossLanguages = null;
        let bestScoreAcrossLanguages = -Infinity;

        for (const tryLanguage of languageCandidates) {
            log(`\n[Orchestrator] ===== Trying ALL methods for language: ${tryLanguage} =====`);

            // Cambio de idioma temporal
            this.language = tryLanguage;

            // Cargar diccionario (si existe)
            await LanguageHandler.loadDictionary(tryLanguage);

            for (let i = 0; i < strategies.length; i++) {
                const strategy = strategies[i];
                const elapsed = Date.now() - startTime;

                if (elapsed > maxTime) {
                    log(`[Orchestrator] Timeout reached (${maxTime}ms)`);
                    break;
                }

                try {
                    log(`[Orchestrator] [${tryLanguage}] Trying strategy ${i + 1}/${strategies.length}: ${strategy.name}`);
                    const result = await strategy.execute(ciphertext);

                    if (result && result.plaintext) {
                        // Re-detección de idioma desde el plaintext
                        const redetectInfo = this._redetectLanguageFromPlaintext(
                            result.plaintext,
                            tryLanguage
                        );
                        const detectedLanguageFromPlaintext = redetectInfo.language;

                        // Validación con diccionario del idioma resultante
                        const validatedResult = await ResultValidator.validateResult(
                            result,
                            detectedLanguageFromPlaintext
                        );

                        const enriched = {
                            ...validatedResult,
                            language: detectedLanguageFromPlaintext,
                            originalLanguage: tryLanguage,
                            cipherType: topCandidate.type,
                            detectionConfidence: topCandidate.confidence
                        };

                        results.push(enriched);

                        if (validatedResult.combinedScore > bestScoreAcrossLanguages) {
                            bestScoreAcrossLanguages = validatedResult.combinedScore;
                            bestResultAcrossLanguages = enriched;
                        }

                        log(
                            `[Orchestrator] [${tryLanguage}] ${strategy.name}: ` +
                            `confidence=${(validatedResult.confidence * 100).toFixed(0)}%, ` +
                            `wordCoverage=${((validatedResult.wordCoverage || 0) * 100).toFixed(0)}%, ` +
                            `combinedScore=${validatedResult.combinedScore.toFixed(2)}`
                        );

                        // Early termination: excelente resultado
                        if (ResultValidator.isExcellentResult(validatedResult)) {
                            log(`[Orchestrator] ✓ Excellent result found for ${tryLanguage}! Stopping early.`);

                            // Restaurar idioma original
                            this.language = originalLanguage;

                            if (!bestResultAcrossLanguages) {
                                // Por seguridad
                                return {
                                    plaintext: ciphertext,
                                    method: 'none',
                                    confidence: 0,
                                    cipherType: topCandidate.type,
                                    score: -Infinity,
                                    error: 'No valid result found'
                                };
                            }

                            // Aplicar segmentación de palabras si corresponde
                            const segmentedPlaintext = this._applyWordSegmentation(
                                bestResultAcrossLanguages.plaintext,
                                bestResultAcrossLanguages.language
                            );

                            let finalResult = {
                                ...bestResultAcrossLanguages,
                                originalPlaintext: bestResultAcrossLanguages.plaintext,
                                plaintext: segmentedPlaintext
                            };

                            // Validación final de diccionario
                            finalResult = await this._finalDictionaryValidation(finalResult, useDictionary);

                            return finalResult;
                        }
                    }
                } catch (e) {
                    warn(`[Orchestrator] Strategy ${strategy.name} failed for ${tryLanguage}:`, e.message);
                }

                if (!tryMultiple) {
                    break;
                }
            }

            // Si tenemos un buen resultado, podemos cortar otros idiomas
            if (bestResultAcrossLanguages && ResultValidator.isGoodResult(bestResultAcrossLanguages)) {
                log(`[Orchestrator] ✓ Good result found for ${tryLanguage}, stopping language iteration`);
                break;
            }
        }

        // Restaurar idioma original
        this.language = originalLanguage;

        if (!results.length) {
            warn('[Orchestrator] No successful decryption found for any language');
            return {
                plaintext: ciphertext,
                method: 'none',
                confidence: 0,
                cipherType: topCandidate.type,
                score: -Infinity,
                error: 'No successful decryption'
            };
        }

        // Agregador para elegir mejor resultado y ajustar cipherType si corresponde
        const aggregatedResult = ResultAggregator.aggregate(
            results,
            this.language,
            {
                minNgramScore: 0.6,
                ngramWeight: 0.7,
                dictWeight: 0.3
            }
        );

        const bestResult =
            aggregatedResult ||
            bestResultAcrossLanguages ||
            results[0];

        if (!bestResult) {
            warn('[Orchestrator] No valid result found, returning error result');
            return {
                plaintext: ciphertext,
                method: 'none',
                confidence: 0,
                cipherType: topCandidate.type,
                score: -Infinity,
                error: 'No valid result found'
            };
        }

        log(
            `[Orchestrator] Best result: method=${bestResult.method}, ` +
            `language=${bestResult.language}, ` +
            `confidence=${(bestResult.confidence * 100).toFixed(0)}%, ` +
            `wordCoverage=${((bestResult.wordCoverage || 0) * 100).toFixed(0)}%`
        );

        // Segmentar palabras si no hay espacios
        const segmentedPlaintext = this._applyWordSegmentation(
            bestResult.plaintext,
            bestResult.language
        );

        let finalResult = {
            ...bestResult,
            originalPlaintext: bestResult.plaintext,
            plaintext: segmentedPlaintext
        };

        // Validación final de diccionario
        finalResult = await this._finalDictionaryValidation(finalResult, useDictionary);

        return finalResult;
    }

    // ===========================
    //    autoDecryptGenerator
    // ===========================

    /**
     * Versión con generator para tracking de progreso.
     *
     * @param {string} ciphertext
     * @param {Object} options
     * @param {boolean} options.tryMultiple
     * @param {number} options.maxTime
     * @param {boolean} options.useDictionary
     */
    async *autoDecryptGenerator(ciphertext, options = {}) {
        const {
            tryMultiple = true,
            maxTime = 60000,
            useDictionary = true
        } = options;

        const startTime = Date.now();

        // Paso 0: detección de idioma (con progreso)
        yield {
            stage: 'language-detection',
            message: 'Detecting language...',
            progress: 5
        };

        const langInfo = await LanguageHandler.detectLanguage(
            ciphertext,
            this.autoDetectLanguage,
            this.language
        );
        this.language = langInfo.language;
        this.languageDetectionResults = langInfo.languageDetectionResults;

        const languageCandidates = langInfo.languageCandidates || [langInfo.language];

        yield {
            stage: 'language-detected',
            message: `Language detected: ${langInfo.language}. Will try ALL methods for each language: ${languageCandidates.join(', ')}`,
            language: langInfo.language,
            languageCandidates,
            progress: 8
        };

        // Paso 1: detección de cipher
        const languageForDetection = languageCandidates[0] === 'auto'
            ? 'english'
            : languageCandidates[0];

        yield {
            stage: 'cipher-detection',
            message: 'Analyzing cipher type...',
            progress: 10
        };

        const detection = await CipherIdentifier.identify(ciphertext, languageForDetection);
        const topCandidate = detection.families[0];

        yield {
            stage: 'cipher-detected',
            message: `Detected: ${topCandidate.type} (${(topCandidate.confidence * 100).toFixed(0)}% confidence)`,
            cipherType: topCandidate.type,
            confidence: topCandidate.confidence,
            progress: 15
        };

        // Paso 2: selección de estrategias
        const strategies = StrategySelector.selectStrategies(
            topCandidate,
            detection.stats,
            ciphertext,
            this.language,
            this.languageDetectionResults,
            this.autoDetectLanguage
        );

        yield {
            stage: 'strategies-selected',
            message: `Selected ${strategies.length} strategy/strategies. Will try ALL for each language.`,
            strategies: strategies.map(s => s.name),
            progress: 18
        };

        // Paso 3: ejecución de estrategias por idioma
        const results = [];
        let bestResultAcrossLanguages = null;
        let bestScoreAcrossLanguages = -Infinity;
        const originalLanguage = this.language;
        const totalStrategies = strategies.length * languageCandidates.length;
        let currentStrategyIndex = 0;

        for (const tryLanguage of languageCandidates) {
            yield {
                stage: 'trying-language',
                message: `===== Trying ALL methods for language: ${tryLanguage} =====`,
                language: tryLanguage,
                progress: 18 + (languageCandidates.indexOf(tryLanguage) / languageCandidates.length) * 10
            };

            this.language = tryLanguage;

            // Cargar diccionario de este idioma
            await LanguageHandler.loadDictionary(tryLanguage);

            for (const strategy of strategies) {
                const elapsed = Date.now() - startTime;
                if (elapsed > maxTime) {
                    yield {
                        stage: 'timeout',
                        message: `Timeout reached (${maxTime}ms)`,
                        progress: 100
                    };
                    // restaurar idioma
                    this.language = originalLanguage;
                    return;
                }

                currentStrategyIndex++;
                const strategyProgress = 18 + (currentStrategyIndex / totalStrategies) * 70; // 18-88%

                yield {
                    stage: 'trying-strategy',
                    message: `[${tryLanguage}] Trying: ${strategy.name} (${currentStrategyIndex}/${totalStrategies})`,
                    method: strategy.name,
                    language: tryLanguage,
                    strategyIndex: currentStrategyIndex,
                    totalStrategies,
                    progress: strategyProgress
                };

                try {
                    let result = null;

                    // Soporte especial para métodos iterativos (hillclimb / annealing) con progreso interno
                    if (strategy.name.includes('Hill Climbing') || strategy.name.includes('Simulated Annealing')) {
                        const method = strategy.name.includes('Annealing') ? 'annealing' : 'hillclimb';
                        const solver = method === 'annealing'
                            ? new SimulatedAnnealing(tryLanguage)
                            : new HillClimb(tryLanguage);

                        let lastYieldProgress = strategyProgress;
                        let lastStatus = null;

                        for (const status of solver.solveGenerator(ciphertext, {
                            initMethod: 'frequency',
                            maxIterations: method === 'annealing' ? 20000 : 5000
                        })) {
                            lastStatus = status;
                            const innerProgress = strategyProgress + (status.progress || 0) * 0.15;
                            if (innerProgress > lastYieldProgress + 2) {
                                yield {
                                    stage: 'solving',
                                    message: `${strategy.name}: ${(status.progress || 0).toFixed(0)}% complete`,
                                    method: strategy.name,
                                    plaintext: status.plaintext || ciphertext,
                                    score: status.score,
                                    progress: innerProgress
                                };
                                lastYieldProgress = innerProgress;
                            }
                        }

                        if (!lastStatus || !lastStatus.plaintext) {
                            const directResult = solver.solve(ciphertext, {
                                initMethod: 'frequency',
                                maxIterations: method === 'annealing' ? 20000 : 5000,
                                restarts: 2
                            });
                            const finalPlaintext = directResult.plaintext || ciphertext;
                            const finalScore = directResult.score || -Infinity;
                            const confidence = Math.min(1, Math.max(0, (finalScore + 7) / 4));
                            result = {
                                plaintext: finalPlaintext,
                                method: method === 'annealing' ? 'simulated-annealing' : 'hill-climbing',
                                confidence,
                                score: finalScore,
                                key: directResult.key
                            };
                        } else {
                            const finalPlaintext = lastStatus.plaintext || ciphertext;
                            const finalScore = lastStatus.score || -Infinity;
                            const confidence = Math.min(1, Math.max(0, (finalScore + 7) / 4));
                            result = {
                                plaintext: finalPlaintext,
                                method: method === 'annealing' ? 'simulated-annealing' : 'hill-climbing',
                                confidence,
                                score: finalScore,
                                key: lastStatus.key
                            };
                        }
                    } else {
                        // Estrategias "normales"
                        result = await strategy.execute(ciphertext);
                    }

                    if (result && result.plaintext) {
                        // Re-detección de idioma desde plaintext (mismo helper que autoDecrypt)
                        const redetectInfo = this._redetectLanguageFromPlaintext(
                            result.plaintext,
                            tryLanguage
                        );
                        const detectedLanguageFromPlaintext = redetectInfo.language;

                        const validatedResult = await ResultValidator.validateResult(
                            result,
                            detectedLanguageFromPlaintext
                        );

                        const enriched = {
                            ...validatedResult,
                            cipherType: topCandidate.type,
                            detectionConfidence: topCandidate.confidence,
                            language: detectedLanguageFromPlaintext,
                            originalLanguage: tryLanguage
                        };

                        results.push(enriched);

                        if (validatedResult.combinedScore > bestScoreAcrossLanguages) {
                            bestScoreAcrossLanguages = validatedResult.combinedScore;
                            bestResultAcrossLanguages = enriched;
                        }

                        log(
                            `[Orchestrator] [${tryLanguage}] ${strategy.name} result: ` +
                            `method=${result.method}, confidence=${result.confidence}, ` +
                            `wordCoverage=${((validatedResult.wordCoverage || 0) * 100).toFixed(0)}%`
                        );

                        yield {
                            stage: 'strategy-complete',
                            message: `✓ [${tryLanguage}] ${strategy.name}: ${(result.confidence * 100).toFixed(0)}% confidence, ${((validatedResult.wordCoverage || 0) * 100).toFixed(0)}% words`,
                            method: result.method,
                            language: detectedLanguageFromPlaintext,
                            confidence: result.confidence,
                            score: result.score,
                            wordCoverage: validatedResult.wordCoverage,
                            plaintext: result.plaintext,
                            progress: strategyProgress + 5
                        };

                        // Corte temprano si el resultado es excelente
                        if (ResultValidator.isExcellentResult(validatedResult)) {
                            yield {
                                stage: 'early-stop',
                                message: `✓ Excellent result found for ${tryLanguage}! Stopping early.`,
                                progress: 90
                            };

                            this.language = originalLanguage;

                            if (!bestResultAcrossLanguages) {
                                yield {
                                    stage: 'failed',
                                    message: 'No valid result found',
                                    plaintext: ciphertext,
                                    method: 'none',
                                    confidence: 0,
                                    progress: 100
                                };
                                return;
                            }

                            // Segmentación de palabras
                            const segmentedPlaintext = this._applyWordSegmentation(
                                bestResultAcrossLanguages.plaintext,
                                bestResultAcrossLanguages.language
                            );

                            let finalEarlyResult = {
                                ...bestResultAcrossLanguages,
                                originalPlaintext: bestResultAcrossLanguages.plaintext,
                                plaintext: segmentedPlaintext
                            };

                            // Validación de diccionario
                            finalEarlyResult = await this._finalDictionaryValidation(
                                finalEarlyResult,
                                useDictionary
                            );

                            yield {
                                stage: 'complete',
                                message: `✓ Decryption complete: ${finalEarlyResult.method} (${(finalEarlyResult.confidence * 100).toFixed(0)}% confidence, language: ${finalEarlyResult.language})`,
                                ...finalEarlyResult,
                                progress: 100
                            };
                            return;
                        }
                    }
                } catch (e) {
                    yield {
                        stage: 'strategy-failed',
                        message: `✗ [${tryLanguage}] ${strategy.name} failed: ${e.message}`,
                        method: strategy.name,
                        language: tryLanguage,
                        error: e.message,
                        progress: strategyProgress + 2
                    };
                }

                if (!tryMultiple) {
                    break;
                }
            }

            // Si ya tenemos un resultado "bueno", cortamos otros idiomas
            if (bestResultAcrossLanguages && ResultValidator.isGoodResult(bestResultAcrossLanguages)) {
                yield {
                    stage: 'language-complete',
                    message: `✓ Good result found for ${tryLanguage}, stopping language iteration`,
                    language: tryLanguage,
                    progress: 88
                };
                break;
            }
        }

        // Restaurar idioma original
        this.language = originalLanguage;

        if (!results.length || !bestResultAcrossLanguages) {
            warn('[Orchestrator] No successful decryption found for any language');
            yield {
                stage: 'failed',
                message: 'No successful decryption found for any language',
                plaintext: ciphertext,
                method: 'none',
                confidence: 0,
                progress: 100
            };
            return;
        }

        // Usamos el agregador para determinar mejor resultado global
        const aggregatedResult = ResultAggregator.aggregate(
            results,
            this.language,
            {
                minNgramScore: 0.6,
                ngramWeight: 0.7,
                dictWeight: 0.3
            }
        );

        const bestResult = aggregatedResult || bestResultAcrossLanguages || results[0];

        if (!bestResult) {
            warn('[Orchestrator] No valid result found, returning error result');
            yield {
                stage: 'failed',
                message: 'No valid result found',
                plaintext: ciphertext,
                method: 'none',
                confidence: 0,
                progress: 100
            };
            return;
        }

        log(
            `[Orchestrator] Best result: method=${bestResult.method}, ` +
            `language=${bestResult.language}, ` +
            `confidence=${(bestResult.confidence * 100).toFixed(0)}%, ` +
            `wordCoverage=${((bestResult.wordCoverage || 0) * 100).toFixed(0)}%`
        );

        // Segmentación de palabras
        const segmentedPlaintext = this._applyWordSegmentation(
            bestResult.plaintext,
            bestResult.language
        );

        let finalResult = {
            ...bestResult,
            originalPlaintext: bestResult.plaintext,
            plaintext: segmentedPlaintext
        };

        // Validación de diccionario
        finalResult = await this._finalDictionaryValidation(finalResult, useDictionary);

        yield {
            stage: 'complete',
            message: `✓ Decryption complete: ${finalResult.method} (${(finalResult.confidence * 100).toFixed(0)}% confidence, language: ${finalResult.language})`,
            ...finalResult,
            progress: 100
        };
    }
}
