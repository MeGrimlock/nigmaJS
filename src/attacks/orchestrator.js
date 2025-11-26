import 'regenerator-runtime/runtime';
import { CipherIdentifier } from '../analysis/identifier.js';
import { StrategySelector } from './helpers/strategy-selector.js';
import { LanguageHandler } from './helpers/language-handler.js';
import { ResultValidator } from './helpers/result-validator.js';
import { HillClimb } from '../search/hillclimb.js';
import { SimulatedAnnealing } from '../search/simulated-annealing.js';
import { DictionaryValidator } from '../language/dictionary-validator.js';

/**
 * Orchestrator: Intelligent attack coordinator for classical ciphers.
 * 
 * This is the main coordinator class that orchestrates the decryption process.
 * It delegates specific responsibilities to specialized modules:
 * - LanguageHandler: Language detection and management
 * - StrategySelector: Strategy selection based on cipher type
 * - Individual Strategy classes: Actual decryption work
 * - ResultValidator: Result validation with dictionaries
 * 
 * Workflow:
 * 1. Detect language (if auto-detection enabled)
 * 2. Detect cipher type using CipherIdentifier
 * 3. Select appropriate attack strategies
 * 4. Execute strategies for each language candidate
 * 5. Validate and return best result
 * 
 * References:
 * - "Automated Cryptanalysis of Monoalphabetic Substitution Ciphers" (Jakobsen, 1995)
 * - "A Fast Method for the Cryptanalysis of Substitution Ciphers" (Gaines)
 */
export class Orchestrator {
    /**
     * Creates an orchestrator.
     * @param {string} language - Target language ('english', 'spanish', etc.) or 'auto' for automatic detection
     */
    constructor(language = 'english') {
        this.language = language;
        this.autoDetectLanguage = (language === 'auto' || !language);
    }
    
    /**
     * Automatically detects and decrypts a ciphertext.
     * 
     * @param {string} ciphertext - The ciphertext to decrypt.
     * @param {Object} options - Orchestrator options.
     * @param {boolean} options.tryMultiple - Try multiple strategies and return best (default: true).
     * @param {number} options.maxTime - Maximum time in ms (default: 60000 = 1 minute).
     * @param {boolean} options.useDictionary - Use dictionary validation (default: true).
     * @returns {Object} Result with { plaintext, method, confidence, cipherType, score, dictionaryValidation }.
     */
    async autoDecrypt(ciphertext, options = {}) {
        const {
            tryMultiple = true,
            maxTime = 60000,
            useDictionary = true
        } = options;
        
        const startTime = Date.now();
        
        // Step 0: Auto-detect language if needed
        const langInfo = await LanguageHandler.detectLanguage(
            ciphertext, 
            this.autoDetectLanguage, 
            this.language
        );
        this.language = langInfo.language;
        this.languageDetectionResults = langInfo.languageDetectionResults;
        const languageCandidates = langInfo.languageCandidates;
        
        // Step 1: Detect cipher type (use first language candidate for detection)
        const languageForDetection = languageCandidates[0] === 'auto' ? 'english' : languageCandidates[0];
        const detection = await CipherIdentifier.identify(ciphertext, languageForDetection);
        const topCandidate = detection.families[0];
        
        console.log(`[Orchestrator] Detected cipher: ${topCandidate.type} (confidence: ${topCandidate.confidence})`);
        
        // Step 2: Select attack strategy based on detection
        const strategies = StrategySelector.selectStrategies(
            topCandidate, 
            detection.stats, 
            ciphertext,
            this.language,
            this.languageDetectionResults,
            this.autoDetectLanguage
        );
        console.log(`[Orchestrator] Selected ${strategies.length} strategy/strategies`);
        
        // Step 3: Execute strategies for EACH language candidate
        const results = [];
        let bestResultAcrossLanguages = null;
        let bestScoreAcrossLanguages = -Infinity;
        const originalLanguage = this.language;
        
        for (const tryLanguage of languageCandidates) {
            console.log(`\n[Orchestrator] ===== Trying ALL methods for language: ${tryLanguage} =====`);
            
            // Temporarily change language for this iteration
            this.language = tryLanguage;
            
            // Try to load dictionary for this language
            await LanguageHandler.loadDictionary(tryLanguage);
            
            // Execute ALL strategies for this language
            for (let i = 0; i < strategies.length; i++) {
                const strategy = strategies[i];
                const elapsed = Date.now() - startTime;
                if (elapsed > maxTime) {
                    console.log(`[Orchestrator] Timeout reached (${maxTime}ms)`);
                    break;
                }
                
                try {
                    console.log(`[Orchestrator] [${tryLanguage}] Trying strategy ${i + 1}/${strategies.length}: ${strategy.name}`);
                    const result = await strategy.execute(ciphertext);
                    
                    if (result && result.plaintext) {
                        // Validate result with dictionary for this language
                        const validatedResult = await ResultValidator.validateResult(result, tryLanguage);
                        results.push({
                            ...validatedResult,
                            language: tryLanguage,
                            cipherType: topCandidate.type,
                            detectionConfidence: topCandidate.confidence
                        });
                        
                        // Track best result across all languages
                        if (validatedResult.combinedScore > bestScoreAcrossLanguages) {
                            bestScoreAcrossLanguages = validatedResult.combinedScore;
                            bestResultAcrossLanguages = {
                                ...validatedResult,
                                language: tryLanguage,
                                cipherType: topCandidate.type,
                                detectionConfidence: topCandidate.confidence
                            };
                        }
                        
                        console.log(`[Orchestrator] [${tryLanguage}] ${strategy.name}: confidence=${(validatedResult.confidence * 100).toFixed(0)}%, wordCoverage=${((validatedResult.wordCoverage || 0) * 100).toFixed(0)}%, combinedScore=${validatedResult.combinedScore.toFixed(2)}`);
                        
                        // Early termination: If we found a VERY good result
                        if (ResultValidator.isExcellentResult(validatedResult)) {
                            console.log(`[Orchestrator] ✓ Excellent result found for ${tryLanguage}! Stopping early.`);
                            // Restore original language
                            this.language = originalLanguage;
                            // Return best result
                            if (useDictionary && bestResultAcrossLanguages) {
                                try {
                                    const validator = new DictionaryValidator(bestResultAcrossLanguages.language);
                                    const validation = await validator.validate(bestResultAcrossLanguages.plaintext);
                                    return {
                                        ...bestResultAcrossLanguages,
                                        dictionaryValidation: validation
                                    };
                                } catch (e) {
                                    return bestResultAcrossLanguages;
                                }
                            }
                            return bestResultAcrossLanguages;
                        }
                    }
                } catch (e) {
                    console.warn(`[Orchestrator] Strategy ${strategy.name} failed for ${tryLanguage}:`, e.message);
                }
            }
            
            // If we found a good result for this language, we can stop trying other languages
            if (bestResultAcrossLanguages && ResultValidator.isGoodResult(bestResultAcrossLanguages)) {
                console.log(`[Orchestrator] ✓ Good result found for ${tryLanguage}, stopping language iteration`);
                break;
            }
        }
        
        // Restore original language
        this.language = originalLanguage;
        
        // Step 4: Return best result across all languages
        if (results.length === 0) {
            console.warn('[Orchestrator] No successful decryption found for any language');
            return {
                plaintext: ciphertext,
                method: 'none',
                confidence: 0,
                cipherType: topCandidate.type,
                score: -Infinity,
                error: 'No successful decryption'
            };
        }
        
        // Sort by combined score (higher is better)
        results.sort((a, b) => (b.combinedScore || -Infinity) - (a.combinedScore || -Infinity));
        
        // Use best result across all languages
        const bestResult = bestResultAcrossLanguages || results[0];
        
        console.log(`[Orchestrator] Best result: method=${bestResult.method}, language=${bestResult.language}, confidence=${(bestResult.confidence * 100).toFixed(0)}%, wordCoverage=${((bestResult.wordCoverage || 0) * 100).toFixed(0)}%`);
        
        // Final dictionary validation if enabled
        if (useDictionary && bestResult.plaintext) {
            try {
                const validator = new DictionaryValidator(bestResult.language || this.language);
                const validation = await validator.validate(bestResult.plaintext);
                return {
                    ...bestResult,
                    dictionaryValidation: validation
                };
            } catch (error) {
                console.warn('[Orchestrator] Final dictionary validation failed:', error);
                return bestResult;
            }
        }
        
        return bestResult;
    }
    
    /**
     * Solves with a generator for progress tracking.
     * 
     * @param {string} ciphertext - The ciphertext to decrypt.
     * @param {Object} options - Options.
     * @param {boolean} options.tryMultiple - Try multiple strategies (default: true).
     * @param {number} options.maxTime - Maximum time in ms (default: 60000).
     * @param {boolean} options.useDictionary - Use dictionary validation (default: true).
     * @yields {Object} Progress updates with stage, method, progress, message, etc.
     */
    async *autoDecryptGenerator(ciphertext, options = {}) {
        const {
            tryMultiple = true,
            maxTime = 60000,
            useDictionary = true
        } = options;
        
        const startTime = Date.now();
        
        // Step 0: Auto-detect language
        let languageCandidates = [this.language];
        if (this.autoDetectLanguage) {
            yield {
                stage: 'language-detection',
                message: 'Detecting language...',
                progress: 5
            };
            
            const langInfo = await LanguageHandler.detectLanguage(ciphertext, true, this.language);
            this.language = langInfo.language;
            this.languageDetectionResults = langInfo.languageDetectionResults;
            languageCandidates = langInfo.languageCandidates;
            
            yield {
                stage: 'language-detected',
                message: `Language detected: ${langInfo.language}. Will try ALL methods for each language: ${languageCandidates.join(', ')}`,
                language: langInfo.language,
                languageCandidates: languageCandidates,
                progress: 8
            };
        }
        
        // Step 1: Detect cipher type (use first language candidate)
        const languageForDetection = languageCandidates[0] === 'auto' ? 'english' : languageCandidates[0];
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
        
        // Step 2: Select strategies
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
        
        // Step 3: Execute strategies for EACH language candidate
        const results = [];
        let bestResultAcrossLanguages = null;
        let bestScoreAcrossLanguages = -Infinity;
        const originalLanguage = this.language;
        let totalStrategies = strategies.length * languageCandidates.length;
        let currentStrategyIndex = 0;
        
        for (const tryLanguage of languageCandidates) {
            yield {
                stage: 'trying-language',
                message: `===== Trying ALL methods for language: ${tryLanguage} =====`,
                language: tryLanguage,
                progress: 18 + (languageCandidates.indexOf(tryLanguage) / languageCandidates.length) * 10
            };
            
            // Temporarily change language
            this.language = tryLanguage;
            
            // Try to load dictionary
            await LanguageHandler.loadDictionary(tryLanguage);
            
            // Execute ALL strategies for this language
            for (const strategy of strategies) {
                const elapsed = Date.now() - startTime;
                if (elapsed > maxTime) {
                    yield {
                        stage: 'timeout',
                        message: `Timeout reached (${maxTime}ms)`,
                        progress: 100
                    };
                    break;
                }
                
                currentStrategyIndex++;
                const strategyProgress = 18 + (currentStrategyIndex / totalStrategies) * 70; // 18-88%
                
                yield {
                    stage: 'trying-strategy',
                    message: `[${tryLanguage}] Trying: ${strategy.name} (${currentStrategyIndex}/${totalStrategies})`,
                    method: strategy.name,
                    language: tryLanguage,
                    strategyIndex: currentStrategyIndex,
                    totalStrategies: totalStrategies,
                    progress: strategyProgress
                };
                
                try {
                    let result = null;
                    
                    // Execute with progress for iterative methods
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
                                confidence: confidence,
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
                                confidence: confidence,
                                score: finalScore,
                                key: lastStatus.key
                            };
                        }
                    } else {
                        // For brute force or other methods, execute directly
                        result = await strategy.execute(ciphertext);
                    }
                    
                    if (result && result.plaintext) {
                        // Validate result with dictionary for this language
                        const validatedResult = await ResultValidator.validateResult(result, tryLanguage);
                        
                        result.cipherType = topCandidate.type;
                        result.detectionConfidence = topCandidate.confidence;
                        result.language = tryLanguage;
                        results.push(validatedResult);
                        
                        // Track best result across all languages
                        if (validatedResult.combinedScore > bestScoreAcrossLanguages) {
                            bestScoreAcrossLanguages = validatedResult.combinedScore;
                            bestResultAcrossLanguages = {
                                ...validatedResult,
                                language: tryLanguage,
                                cipherType: topCandidate.type,
                                detectionConfidence: topCandidate.confidence
                            };
                        }
                        
                        console.log(`[Orchestrator] [${tryLanguage}] ${strategy.name} result: method=${result.method}, confidence=${result.confidence}, wordCoverage=${((validatedResult.wordCoverage || 0) * 100).toFixed(0)}%`);
                        
                        yield {
                            stage: 'strategy-complete',
                            message: `✓ [${tryLanguage}] ${strategy.name}: ${(result.confidence * 100).toFixed(0)}% confidence, ${((validatedResult.wordCoverage || 0) * 100).toFixed(0)}% words`,
                            method: result.method,
                            language: tryLanguage,
                            confidence: result.confidence,
                            score: result.score,
                            wordCoverage: validatedResult.wordCoverage,
                            plaintext: result.plaintext,
                            progress: strategyProgress + 5
                        };
                        
                        // Early termination: If we found a VERY good result
                        if (ResultValidator.isExcellentResult(validatedResult)) {
                            yield {
                                stage: 'early-stop',
                                message: `✓ Excellent result found for ${tryLanguage}! Stopping early.`,
                                progress: 90
                            };
                            // Restore original language
                            this.language = originalLanguage;
                            // Return best result
                            if (useDictionary && bestResultAcrossLanguages) {
                                try {
                                    const validator = new DictionaryValidator(bestResultAcrossLanguages.language);
                                    const validation = await validator.validate(bestResultAcrossLanguages.plaintext);
                                    yield {
                                        stage: 'complete',
                                        ...bestResultAcrossLanguages,
                                        dictionaryValidation: validation,
                                        progress: 100
                                    };
                                    return;
                                } catch (e) {
                                    yield {
                                        stage: 'complete',
                                        ...bestResultAcrossLanguages,
                                        progress: 100
                                    };
                                    return;
                                }
                            }
                            yield {
                                stage: 'complete',
                                ...bestResultAcrossLanguages,
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
                
                if (!tryMultiple) break;
            }
            
            // If we found a good result for this language, we can stop trying other languages
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
        
        // Restore original language
        this.language = originalLanguage;
        
        // Step 4: Return best result across all languages
        if (results.length === 0) {
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
        
        // Sort by combined score (higher is better)
        results.sort((a, b) => (b.combinedScore || -Infinity) - (a.combinedScore || -Infinity));
        
        const bestResult = bestResultAcrossLanguages || results[0];
        
        console.log(`[Orchestrator] Best result: method=${bestResult.method}, language=${bestResult.language}, confidence=${(bestResult.confidence * 100).toFixed(0)}%, wordCoverage=${((bestResult.wordCoverage || 0) * 100).toFixed(0)}%`);
        
        // Final dictionary validation if enabled
        if (useDictionary && bestResult.plaintext) {
            try {
                const validator = new DictionaryValidator(bestResult.language || this.language);
                const validation = await validator.validate(bestResult.plaintext);
                const finalResult = {
                    stage: 'complete',
                    message: `✓ Decryption complete: ${bestResult.method} (${(bestResult.confidence * 100).toFixed(0)}% confidence, language: ${bestResult.language})`,
                    ...bestResult,
                    dictionaryValidation: validation,
                    progress: 100
                };
                console.log(`[Orchestrator] Returning final result: method=${finalResult.method}, confidence=${finalResult.confidence}, plaintext length=${finalResult.plaintext?.length || 0}`);
                return finalResult;
            } catch (error) {
                console.warn('[Orchestrator] Final dictionary validation failed:', error);
            }
        }
        
        const finalResult = {
            stage: 'complete',
            message: `✓ Decryption complete: ${bestResult.method} (${(bestResult.confidence * 100).toFixed(0)}% confidence, language: ${bestResult.language})`,
            ...bestResult,
            progress: 100
        };
        console.log(`[Orchestrator] Returning final result: method=${finalResult.method}, confidence=${finalResult.confidence}, plaintext length=${finalResult.plaintext?.length || 0}`);
        return finalResult;
    }
}
