import 'regenerator-runtime/runtime';
import { CipherIdentifier } from '../analysis/identifier.js';
import { LanguageAnalysis } from '../analysis/analysis.js';
import { HMMSolver } from './hmm-solver.js';
import { VigenereSolver } from './vigenere-solver.js';
import { PolyalphabeticSolver } from './polyalphabetic-solver.js';
import { HillClimb } from '../search/hillclimb.js';
import { SimulatedAnnealing } from '../search/simulated-annealing.js';
import { Scorer } from '../search/scorer.js';
import { TextUtils } from '../core/text-utils.js';
import { DictionaryValidator } from '../language/dictionary-validator.js';

/**
 * Orchestrator: Intelligent attack coordinator for classical ciphers.
 * 
 * Workflow:
 * 1. Detect cipher type using CipherIdentifier (Phase 3)
 * 2. Select appropriate attack strategy:
 *    - Caesar/Simple Shift → Brute Force (26 rotations)
 *    - Vigenère-like → Friedman Test + Column solving
 *    - Monoalphabetic Substitution → Hill Climbing / Simulated Annealing
 *    - Transposition → (Future: anagramming, column permutation)
 * 3. Execute attack(s) with multiple strategies
 * 4. Return best result based on scoring
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
        
        // Step 0: Auto-detect language if needed (BEFORE cipher detection for better accuracy)
        if (this.autoDetectLanguage) {
            console.log('[Orchestrator] Auto-detecting language...');
            try {
                // Try to load dictionaries for better detection (non-blocking)
                const candidateLanguages = ['english', 'spanish', 'french', 'german', 'italian', 'portuguese'];
                for (const lang of candidateLanguages) {
                    // Try to load dictionary, but don't wait if it fails
                    LanguageAnalysis.loadDictionary(lang, 'data/').catch(() => {});
                    LanguageAnalysis.loadDictionary(lang, '../demo/data/').catch(() => {});
                }
                
                // Detect language using statistical analysis + dictionary validation
                const langResults = LanguageAnalysis.detectLanguage(ciphertext);
                
                if (langResults && langResults.length > 0) {
                    const detectedLang = langResults[0].language;
                    console.log(`[Orchestrator] Detected language: ${detectedLang} (confidence: ${langResults[0].score.toFixed(2)})`);
                    this.language = detectedLang;
                } else {
                    console.warn('[Orchestrator] Could not detect language, defaulting to english');
                    this.language = 'english';
                }
            } catch (error) {
                console.warn('[Orchestrator] Language detection failed:', error.message);
                this.language = 'english'; // Fallback to english
            }
        }
        
        // Step 1: Detect cipher type
        // Use this.language (already set to detected language or original value)
        const languageForDetection = this.language === 'auto' ? 'english' : this.language;
        const detection = await CipherIdentifier.identify(ciphertext, languageForDetection);
        const topCandidate = detection.families[0];
        
        console.log(`[Orchestrator] Detected: ${topCandidate.type} (confidence: ${topCandidate.confidence})`);
        
        // Step 2: Select attack strategy based on detection
        const strategies = this._selectStrategies(topCandidate, detection.stats);
        
        // Step 3: Execute strategies
        const results = [];
        
        for (const strategy of strategies) {
            const elapsed = Date.now() - startTime;
            if (elapsed > maxTime) {
                console.log(`[Orchestrator] Timeout reached (${maxTime}ms)`);
                break;
            }
            
            try {
                console.log(`[Orchestrator] Trying strategy: ${strategy.name}`);
                const result = await strategy.execute(ciphertext);
                
                if (result) {
                    results.push({
                        ...result,
                        cipherType: topCandidate.type,
                        detectionConfidence: topCandidate.confidence
                    });
                }
                
                // If we found a very good result, stop early
                if (result && result.confidence > 0.9) {
                    console.log(`[Orchestrator] High confidence result found, stopping early`);
                    break;
                }
                
                if (!tryMultiple) break; // Only try first strategy
            } catch (e) {
                console.error(`[Orchestrator] Strategy ${strategy.name} failed:`, e.message);
            }
        }
        
        // Step 4: Validate with dictionary (if enabled and results exist)
        if (useDictionary && results.length > 0) {
            console.log('[Orchestrator] Validating results with dictionary...');
            const validator = new DictionaryValidator(this.language);
            
            try {
                const validatedResults = await validator.validateMultiple(results);
                // validatedResults are already sorted by updated confidence
                
                // Add dictionary validation info to top result
                const bestResult = validatedResults[0];
                const dictConfidence = bestResult.validation.confidence;
                const wordCoverage = parseFloat(bestResult.validation.metrics.wordCoverage) / 100;
                
                console.log(`[Orchestrator] Best result after dictionary validation: confidence=${bestResult.confidence.toFixed(2)}, validWords=${bestResult.validation.metrics.validWords}, wordCoverage=${wordCoverage.toFixed(2)}`);

                // REJECT if dictionary validation is too low (< 30% word coverage)
                // This prevents false positives like Vigenère decrypting Porta as gibberish
                if (wordCoverage < 0.30 && dictConfidence < 0.40) {
                    console.warn(`[Orchestrator] Best result rejected: word coverage too low (${(wordCoverage * 100).toFixed(0)}%). Trying next strategy...`);
                    
                    // Try to find a better result
                    for (let i = 1; i < validatedResults.length; i++) {
                        const altResult = validatedResults[i];
                        const altCoverage = parseFloat(altResult.validation.metrics.wordCoverage) / 100;
                        if (altCoverage >= 0.30 || altResult.validation.confidence >= 0.40) {
                            console.log(`[Orchestrator] Using alternative result: ${altResult.method} with ${(altCoverage * 100).toFixed(0)}% coverage`);
                            return {
                                ...altResult,
                                dictionaryValidation: altResult.validation
                            };
                        }
                    }
                    
                    // No good result found - return best with warning
                    console.warn('[Orchestrator] No result passed dictionary validation threshold');
                }
                
                return {
                    ...bestResult,
                    dictionaryValidation: bestResult.validation
                };
            } catch (error) {
                console.warn('[Orchestrator] Dictionary validation failed:', error);
                // Fall back to non-validated results
            }
        }
        
        // Step 5: Return best result (without dictionary validation)
        if (results.length === 0) {
            return {
                plaintext: ciphertext,
                method: 'none',
                confidence: 0,
                cipherType: topCandidate.type,
                score: -Infinity,
                error: 'No successful decryption'
            };
        }
        
        // Sort by score (higher is better)
        results.sort((a, b) => (b.score || -Infinity) - (a.score || -Infinity));
        
        return results[0];
    }
    
    /**
     * Selects appropriate attack strategies based on cipher detection.
     * @private
     */
    _selectStrategies(topCandidate, stats) {
        const strategies = [];
        
        // ALWAYS try Caesar first - it's fast and catches ROT13/simple shifts
        strategies.push({
            name: 'Brute Force (Caesar/ROT13)',
            execute: (text) => this._bruteForceCaesar(text)
        });
        
        switch (topCandidate.type) {
            case 'caesar-shift':
                // Already added Caesar above
                break;
                
            case 'vigenere-like':
                // IMPORTANT: Try advanced polyalphabetic FIRST (Porta, Beaufort, Gronsfeld)
                // These are more specific and should be tested before generic Vigenère
                strategies.push({
                    name: 'Advanced Polyalphabetic (Porta/Beaufort/Gronsfeld/Quagmire)',
                    execute: (text) => this._solveAdvancedPolyalphabetic(text)
                });
                // Then try standard Vigenère (most common polyalphabetic)
                strategies.push({
                    name: 'Vigenère Solver (Friedman)',
                    execute: (text) => this._solveVigenere(text, topCandidate.suggestedKeyLength)
                });
                // Fallback to substitution if all polyalphabetic methods fail
                strategies.push({
                    name: 'Hill Climbing (Fallback)',
                    execute: (text) => this._solveSubstitution(text, 'hillclimb')
                });
                break;
                
            case 'monoalphabetic-substitution':
                // Try Hill Climbing first (faster)
                strategies.push({
                    name: 'Hill Climbing',
                    execute: (text) => this._solveSubstitution(text, 'hillclimb')
                });
                // Then Simulated Annealing (more thorough)
                strategies.push({
                    name: 'Simulated Annealing',
                    execute: (text) => this._solveSubstitution(text, 'annealing')
                });
                break;
                
            case 'transposition':
                // For now, try substitution as fallback
                strategies.push({
                    name: 'Hill Climbing (Transposition Fallback)',
                    execute: (text) => this._solveSubstitution(text, 'hillclimb')
                });
                break;
                
            case 'random-unknown':
            default:
                // Try everything
                strategies.push({
                    name: 'Brute Force (Caesar)',
                    execute: (text) => this._bruteForceCaesar(text)
                });
                strategies.push({
                    name: 'Hill Climbing',
                    execute: (text) => this._solveSubstitution(text, 'hillclimb')
                });
                break;
        }
        
        return strategies;
    }
    
    /**
     * Brute force attack for Caesar shift (including ROT13).
     * @private
     */
    async _bruteForceCaesar(ciphertext) {
        const cleaned = TextUtils.onlyLetters(ciphertext);
        const scorer = new Scorer(this.language, 4); // Use quadgrams
        
        let bestShift = 0;
        let bestScore = -Infinity;
        let bestPlaintext = '';
        
        // Try all 26 shifts
        for (let shift = 0; shift < 26; shift++) {
            let decrypted = '';
            for (const char of cleaned) {
                const charCode = char.charCodeAt(0);
                const shifted = ((charCode - 65 - shift + 26) % 26) + 65;
                decrypted += String.fromCharCode(shifted);
            }
            
            const score = scorer.score(decrypted);
            
            if (score > bestScore) {
                bestScore = score;
                bestShift = shift;
                bestPlaintext = decrypted;
            }
        }
        
        // Calculate confidence based on score
        // Good quadgram scores are typically > -3 for English
        let confidence = 0.5;
        if (bestScore > -3) {
            confidence = 0.95;
        } else if (bestScore > -4) {
            confidence = 0.8;
        } else if (bestScore > -5) {
            confidence = 0.6;
        }
        
        return {
            plaintext: TextUtils.matchLayout(ciphertext, bestPlaintext),
            method: bestShift === 13 ? 'rot13' : 'caesar-shift',
            confidence: confidence,
            score: bestScore,
            key: bestShift
        };
    }
    
    /**
     * Vigenère solver using Friedman test.
     * @private
     */
    async _solveVigenere(ciphertext, suggestedKeyLength) {
        const solver = new VigenereSolver(this.language);
        const result = await solver.solve(ciphertext);
        
        // VigenereSolver may return confidence 0 if it fails
        // Use IoC as a proxy for confidence
        const confidence = result.confidence || (result.analysis?.avgIoC > 1.3 ? 0.7 : 0.3);
        
        return {
            plaintext: result.plaintext,
            method: 'vigenere-friedman',
            confidence: confidence,
            score: result.analysis?.avgIoC || result.analysis?.ioc || 0,
            key: result.key
        };
    }
    
    /**
     * Substitution solver using heuristic search.
     * @private
     */
    async _solveSubstitution(ciphertext, method = 'hillclimb') {
        const solver = method === 'annealing' 
            ? new SimulatedAnnealing(this.language)
            : new HillClimb(this.language);
        
        const result = solver.solve(ciphertext, {
            initMethod: 'frequency',
            maxIterations: method === 'annealing' ? 20000 : 5000,
            restarts: 2
        });
        
        // Calculate confidence based on score
        // Good English quadgram scores are typically > -3
        const confidence = Math.min(1, Math.max(0, (result.score + 7) / 4));
        
        return {
            plaintext: result.plaintext,
            method: method === 'annealing' ? 'simulated-annealing' : 'hill-climbing',
            confidence: confidence,
            score: result.score,
            key: result.key
        };
    }
    
    /**
     * Solve advanced polyalphabetic ciphers (Beaufort, Porta, Gronsfeld, Quagmire).
     * @private
     */
    async _solveAdvancedPolyalphabetic(ciphertext) {
        const polyalphabeticSolver = new PolyalphabeticSolver(this.language);
        const result = polyalphabeticSolver.solve(ciphertext);
        
        return {
            plaintext: result.plaintext,
            method: result.method || 'polyalphabetic',
            confidence: result.confidence || 0.5,
            score: result.score,
            key: result.key
        };
    }
    
    /**
     * Solves with a generator for progress tracking.
     * 
     * @param {string} ciphertext - The ciphertext to decrypt.
     * @param {Object} options - Options.
     * @yields {Object} Progress updates.
     */
    async *autoDecryptGenerator(ciphertext, options = {}) {
        const {
            tryMultiple = false // For generator, usually stick to one strategy
        } = options;
        
        // Detect cipher type
        const detection = await CipherIdentifier.identify(ciphertext, this.language === 'auto' ? 'english' : this.language);
        const topCandidate = detection.families[0];
        
        yield {
            stage: 'detection',
            cipherType: topCandidate.type,
            confidence: topCandidate.confidence,
            progress: 10
        };
        
        // Select strategy
        const strategies = this._selectStrategies(topCandidate, detection.stats);
        const strategy = strategies[0]; // Use first strategy for generator
        
        yield {
            stage: 'strategy-selection',
            strategy: strategy.name,
            progress: 20
        };
        
        // Execute with progress
        if (strategy.name.includes('Hill Climbing') || strategy.name.includes('Simulated Annealing')) {
            const method = strategy.name.includes('Annealing') ? 'annealing' : 'hillclimb';
            const solver = method === 'annealing' 
                ? new SimulatedAnnealing(this.language)
                : new HillClimb(this.language);
            
            let lastProgress = 20;
            for (const status of solver.solveGenerator(ciphertext, {
                initMethod: 'frequency',
                maxIterations: method === 'annealing' ? 20000 : 5000
            })) {
                const progress = 20 + (status.progress || 0) * 0.7; // 20-90%
                if (progress > lastProgress + 5) { // Only yield every 5%
                    yield {
                        stage: 'solving',
                        method: strategy.name,
                        plaintext: status.plaintext,
                        score: status.score,
                        progress: progress
                    };
                    lastProgress = progress;
                }
            }
            
            // Final result
            const confidence = Math.min(1, Math.max(0, (status.score + 7) / 4));
            yield {
                stage: 'complete',
                plaintext: status.plaintext,
                method: method === 'annealing' ? 'simulated-annealing' : 'hill-climbing',
                confidence: confidence,
                score: status.score,
                progress: 100
            };
        } else {
            // For brute force or Vigenère, execute directly
            const result = await strategy.execute(ciphertext);
            yield {
                stage: 'complete',
                ...result,
                progress: 100
            };
        }
    }
}

