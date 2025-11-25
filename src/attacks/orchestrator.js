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
                // BUT: Only stop if dictionary validation passes (if enabled)
                // This prevents stopping on false positives like Quagmire decrypting Vigenère
                if (result && result.confidence > 0.9) {
                    // If dictionary validation is enabled, check word coverage before stopping
                    if (useDictionary && result.plaintext) {
                        try {
                            const validator = new DictionaryValidator(this.language);
                            const quickValidation = await validator.validate(result.plaintext);
                            const wordCoverage = parseFloat(quickValidation.metrics.wordCoverage) / 100;
                            
                            // Only stop early if word coverage is good (>30%)
                            if (wordCoverage >= 0.30 || quickValidation.confidence >= 0.40) {
                                console.log(`[Orchestrator] High confidence result with good dictionary validation, stopping early`);
                                break;
                            } else {
                                console.log(`[Orchestrator] High confidence but low dictionary validation (${(wordCoverage * 100).toFixed(0)}%), continuing...`);
                            }
                        } catch (e) {
                            // Dictionary validation failed, use confidence only
                            console.log(`[Orchestrator] High confidence result found, stopping early (dictionary validation skipped)`);
                            break;
                        }
                    } else {
                        console.log(`[Orchestrator] High confidence result found, stopping early`);
                        break;
                    }
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
        
        switch (topCandidate.type) {
            case 'caesar-shift':
                // For Caesar, try ROT47 first (if text contains printable ASCII beyond letters)
                // ROT47 handles all printable ASCII (33-126), not just letters
                const hasNonLetterASCII = /[!-~]/.test(text) && /[^A-Za-z\s]/.test(text);
                if (hasNonLetterASCII) {
                    strategies.push({
                        name: 'Brute Force (ROT47)',
                        execute: (text) => this._bruteForceROT47(text)
                    });
                }
                // Then try standard Caesar brute force (letters only)
                strategies.push({
                    name: 'Brute Force (Caesar/ROT13)',
                    execute: (text) => this._bruteForceCaesar(text)
                });
                break;
                
            case 'vigenere-like':
                // For Vigenère, try Vigenère-specific methods FIRST
                // IMPORTANT: Try standard Vigenère FIRST (most common polyalphabetic)
                // This ensures we try the correct cipher type before trying alternatives
                strategies.push({
                    name: 'Vigenère Solver (Friedman)',
                    execute: (text) => this._solveVigenere(text, topCandidate.suggestedKeyLength)
                });
                // Then try advanced polyalphabetic (Porta, Beaufort, Gronsfeld, Quagmire)
                // These are alternatives if Vigenère doesn't work
                strategies.push({
                    name: 'Advanced Polyalphabetic (Porta/Beaufort/Gronsfeld/Quagmire)',
                    execute: (text) => this._solveAdvancedPolyalphabetic(text)
                });
                // Fallback to substitution if all polyalphabetic methods fail
                strategies.push({
                    name: 'Hill Climbing (Fallback)',
                    execute: (text) => this._solveSubstitution(text, 'hillclimb')
                });
                // Only try Caesar as last resort for Vigenère (unlikely to work)
                strategies.push({
                    name: 'Brute Force (Caesar/ROT13) - Fallback',
                    execute: (text) => this._bruteForceCaesar(text)
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
     * Tries all 26 shifts and validates with dictionary for early termination.
     * @private
     */
    async _bruteForceCaesar(ciphertext) {
        const cleaned = TextUtils.onlyLetters(ciphertext);
        const scorer = new Scorer(this.language, 4); // Use quadgrams
        
        let bestShift = 0;
        let bestScore = -Infinity;
        let bestPlaintext = '';
        let bestWordCoverage = 0;
        
        // Get dictionary for validation
        const dict = LanguageAnalysis.getDictionary(this.language);
        const hasDictionary = dict !== null;
        
        // Try all 26 shifts (1-26, where shift 0 = no shift)
        for (let shift = 1; shift <= 26; shift++) {
            let decrypted = '';
            for (const char of cleaned) {
                const charCode = char.charCodeAt(0);
                const shifted = ((charCode - 65 - shift + 26) % 26) + 65;
                decrypted += String.fromCharCode(shifted);
            }
            
            // Calculate N-gram score
            const score = scorer.score(decrypted);
            
            // Validate with dictionary if available
            let wordCoverage = 0;
            if (hasDictionary && dict) {
                try {
                    // Extract words from decrypted text
                    const fullDecrypted = TextUtils.matchLayout(ciphertext, decrypted);
                    const words = fullDecrypted.toUpperCase()
                        .split(/\s+/)
                        .map(w => TextUtils.onlyLetters(w))
                        .filter(w => w.length >= 3); // Only consider words >= 3 chars
                    
                    if (words.length > 0) {
                        let validWords = 0;
                        for (const word of words) {
                            if (dict.has && dict.has(word)) {
                                validWords++;
                            }
                        }
                        wordCoverage = validWords / words.length; // 0-1, percentage of valid words
                    }
                } catch (error) {
                    // Dictionary access failed, continue without dictionary validation
                    console.warn('[Orchestrator] Dictionary validation error:', error);
                }
            }
            
            // Combined score: N-gram score + dictionary bonus
            // If dictionary coverage is high, add significant bonus
            const dictBonus = wordCoverage * 50; // Up to 50 points bonus
            const combinedScore = score + dictBonus;
            
            // Update best if this is better
            if (combinedScore > bestScore || (wordCoverage > bestWordCoverage && wordCoverage > 0.7)) {
                bestScore = combinedScore;
                bestShift = shift;
                bestPlaintext = decrypted;
                bestWordCoverage = wordCoverage;
                
                // Early termination: if we found a shift with >70% valid words, stop
                // This means we've likely found the correct shift
                if (wordCoverage > 0.70) {
                    console.log(`[Orchestrator] Early termination: Shift ${shift} has ${(wordCoverage * 100).toFixed(0)}% valid words`);
                    break;
                }
            }
        }
        
        // Calculate confidence based on score and dictionary validation
        let confidence = 0.5;
        
        // High dictionary coverage = high confidence
        if (bestWordCoverage > 0.80) {
            confidence = 0.98;
        } else if (bestWordCoverage > 0.70) {
            confidence = 0.95;
        } else if (bestWordCoverage > 0.60) {
            confidence = 0.90;
        } else if (bestWordCoverage > 0.50) {
            confidence = 0.85;
        } else {
            // Fall back to N-gram score if dictionary validation is low
            // Good quadgram scores are typically > -3 for English
            if (bestScore > -3) {
                confidence = 0.95;
            } else if (bestScore > -4) {
                confidence = 0.8;
            } else if (bestScore > -5) {
                confidence = 0.6;
            }
        }
        
        return {
            plaintext: TextUtils.matchLayout(ciphertext, bestPlaintext),
            method: bestShift === 13 ? 'rot13' : 'caesar-shift',
            confidence: confidence,
            score: bestScore,
            key: bestShift,
            wordCoverage: bestWordCoverage // Include for debugging
        };
    }
    
    /**
     * Brute force ROT (ASCII printable characters 33-126)
     * Tries all possible shifts (1-94) and stops early if high word coverage is found
     * ROT shifts all printable ASCII characters, not just letters
     * @private
     */
    async _bruteForceROT47(ciphertext) {
        const scorer = new Scorer(this.language, 4); // Use quadgrams
        const dict = LanguageAnalysis.getDictionary(this.language);
        
        let bestShift = 0;
        let bestScore = -Infinity;
        let bestPlaintext = ciphertext;
        let bestWordCoverage = 0;
        
        // ROT uses ASCII printable range (33-126), so we need to try shifts 1-94
        // Try all shifts sequentially, stopping early if we find high word coverage
        const maxShift = 94; // ASCII printable range is 94 characters (33-126)
        
        for (let shift = 1; shift <= maxShift; shift++) {
            // Decrypt using ROT logic (ASCII 33-126)
            let decrypted = '';
            for (let i = 0; i < ciphertext.length; i++) {
                const char = ciphertext[i];
                const code = char.charCodeAt(0);
                
                // Only shift printable ASCII (33-126)
                if (code >= 33 && code <= 126) {
                    // ROT: shift backwards by shift amount, wrapping at 94 characters
                    let newCode = code - shift;
                    while (newCode < 33) newCode += 94;
                    while (newCode > 126) newCode -= 94;
                    decrypted += String.fromCharCode(newCode);
                } else {
                    decrypted += char; // Keep non-printable as-is
                }
            }
            
            // Score the decrypted text
            const cleanText = TextUtils.onlyLetters(decrypted);
            if (cleanText.length < 10) continue; // Skip if too short
            
            const score = scorer.score(cleanText);
            
            // Dictionary validation - this is the key for early termination
            let wordCoverage = 0;
            if (dict) {
                try {
                    const words = decrypted.toUpperCase()
                        .split(/\s+/)
                        .map(w => TextUtils.onlyLetters(w))
                        .filter(w => w.length >= 3);
                    
                    if (words.length > 0) {
                        let validWords = 0;
                        for (const word of words) {
                            if (dict.has(word)) {
                                validWords++;
                            }
                        }
                        wordCoverage = validWords / words.length;
                    }
                } catch (error) {
                    // Dictionary access failed, continue without dictionary validation
                }
            }
            
            // Combined score: N-gram + dictionary bonus
            const dictBonus = wordCoverage * 50;
            const combinedScore = score + dictBonus;
            
            // Update best if this is better
            if (combinedScore > bestScore || (wordCoverage > bestWordCoverage && wordCoverage > 0.7)) {
                bestScore = combinedScore;
                bestShift = shift;
                bestPlaintext = decrypted;
                bestWordCoverage = wordCoverage;
                
                // Early termination: if we found >70% valid words, we're done!
                // This assumes we detected the language correctly
                if (wordCoverage > 0.70) {
                    console.log(`[Orchestrator] Early termination: ROT shift ${shift} has ${(wordCoverage * 100).toFixed(0)}% valid words`);
                    break; // Stop trying other shifts
                }
            }
        }
        
        // Calculate confidence
        let confidence = 0.5;
        if (bestWordCoverage > 0.80) {
            confidence = 0.98;
        } else if (bestWordCoverage > 0.70) {
            confidence = 0.95;
        } else if (bestWordCoverage > 0.60) {
            confidence = 0.90;
        } else if (bestWordCoverage > 0.50) {
            confidence = 0.85;
        } else if (bestScore > -3) {
            confidence = 0.95;
        } else if (bestScore > -4) {
            confidence = 0.8;
        } else if (bestScore > -5) {
            confidence = 0.6;
        }
        
        // Determine method name based on shift
        let method = 'rot47';
        if (bestShift === 13) {
            method = 'rot13';
        } else if (bestShift >= 1 && bestShift <= 25) {
            method = `rot${bestShift}`;
        } else if (bestShift === 47) {
            method = 'rot47';
        } else {
            method = 'rot47'; // Generic ROT for other shifts
        }
        
        return {
            plaintext: bestPlaintext,
            method: method,
            confidence: confidence,
            score: bestScore,
            key: bestShift,
            wordCoverage: bestWordCoverage
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
        if (this.autoDetectLanguage) {
            yield {
                stage: 'language-detection',
                message: 'Detecting language...',
                progress: 5
            };
            
            try {
                const langResults = await LanguageAnalysis.detectLanguage(ciphertext);
                if (langResults && langResults.length > 0) {
                    const detectedLang = langResults[0].language;
                    this.language = detectedLang;
                    yield {
                        stage: 'language-detected',
                        message: `Language detected: ${detectedLang}`,
                        language: detectedLang,
                        progress: 8
                    };
                } else {
                    this.language = 'english';
                    yield {
                        stage: 'language-detected',
                        message: 'Language detection failed, defaulting to English',
                        language: 'english',
                        progress: 8
                    };
                }
            } catch (error) {
                this.language = 'english';
                yield {
                    stage: 'language-detected',
                    message: 'Language detection failed, defaulting to English',
                    language: 'english',
                    progress: 8
                };
            }
        }
        
        // Step 1: Detect cipher type
        const languageForDetection = this.language === 'auto' ? 'english' : this.language;
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
        const strategies = this._selectStrategies(topCandidate, detection.stats);
        
        yield {
            stage: 'strategies-selected',
            message: `Selected ${strategies.length} strategy/strategies`,
            strategies: strategies.map(s => s.name),
            progress: 18
        };
        
        // Step 3: Execute strategies
        const results = [];
        let strategyIndex = 0;
        
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
            
            strategyIndex++;
            const strategyProgress = 18 + (strategyIndex / strategies.length) * 70; // 18-88%
            
            yield {
                stage: 'trying-strategy',
                message: `Trying: ${strategy.name} (${strategyIndex}/${strategies.length})`,
                method: strategy.name,
                strategyIndex: strategyIndex,
                totalStrategies: strategies.length,
                progress: strategyProgress
            };
            
            try {
                let result = null;
                
                // Execute with progress for iterative methods
                if (strategy.name.includes('Hill Climbing') || strategy.name.includes('Simulated Annealing')) {
                    const method = strategy.name.includes('Annealing') ? 'annealing' : 'hillclimb';
                    const solver = method === 'annealing' 
                        ? new SimulatedAnnealing(this.language)
                        : new HillClimb(this.language);
                    
                    let lastYieldProgress = strategyProgress;
                    for (const status of solver.solveGenerator(ciphertext, {
                        initMethod: 'frequency',
                        maxIterations: method === 'annealing' ? 20000 : 5000
                    })) {
                        const innerProgress = strategyProgress + (status.progress || 0) * 0.15; // Within strategy range
                        if (innerProgress > lastYieldProgress + 2) { // Yield every 2%
                            yield {
                                stage: 'solving',
                                message: `${strategy.name}: ${(status.progress || 0).toFixed(0)}% complete`,
                                method: strategy.name,
                                plaintext: status.plaintext,
                                score: status.score,
                                progress: innerProgress
                            };
                            lastYieldProgress = innerProgress;
                        }
                    }
                    
                    // Final result from solver
                    const confidence = Math.min(1, Math.max(0, (status.score + 7) / 4));
                    result = {
                        plaintext: status.plaintext,
                        method: method === 'annealing' ? 'simulated-annealing' : 'hill-climbing',
                        confidence: confidence,
                        score: status.score,
                        key: status.key
                    };
                } else {
                    // For brute force or Vigenère, execute directly
                    result = await strategy.execute(ciphertext);
                }
                
                if (result) {
                    result.cipherType = topCandidate.type;
                    result.detectionConfidence = topCandidate.confidence;
                    results.push(result);
                    
                    console.log(`[Orchestrator] Strategy ${strategy.name} result: method=${result.method}, confidence=${result.confidence}, plaintext length=${result.plaintext?.length || 0}`);
                    
                    yield {
                        stage: 'strategy-complete',
                        message: `✓ ${strategy.name}: ${(result.confidence * 100).toFixed(0)}% confidence`,
                        method: result.method,
                        confidence: result.confidence,
                        score: result.score,
                        plaintext: result.plaintext, // Include plaintext in yield
                        progress: strategyProgress + 10
                    };
                    
                    // If we found a very good result, check dictionary before stopping early
                    if (result.confidence > 0.9) {
                        // Quick dictionary validation before stopping
                        if (useDictionary && result.plaintext) {
                            try {
                                const validator = new DictionaryValidator(this.language);
                                const quickValidation = await validator.validate(result.plaintext);
                                const wordCoverage = parseFloat(quickValidation.metrics.wordCoverage) / 100;
                                
                                // Only stop early if word coverage is good (>30%)
                                if (wordCoverage >= 0.30 || quickValidation.confidence >= 0.40) {
                                    yield {
                                        stage: 'early-stop',
                                        message: 'High confidence result found, stopping early',
                                        progress: 90
                                    };
                                    // Continue to dictionary validation step
                                    break;
                                } else {
                                    yield {
                                        stage: 'early-stop',
                                        message: `High confidence but low dictionary validation (${(wordCoverage * 100).toFixed(0)}%), continuing...`,
                                        progress: 90
                                    };
                                    // Don't break, continue to next strategy
                                }
                            } catch (e) {
                                // Dictionary validation failed, stop early anyway
                                yield {
                                    stage: 'early-stop',
                                    message: 'High confidence result found, stopping early',
                                    progress: 90
                                };
                                break;
                            }
                        } else {
                            yield {
                                stage: 'early-stop',
                                message: 'High confidence result found, stopping early',
                                progress: 90
                            };
                            break;
                        }
                    }
                }
                
                if (!tryMultiple) break;
            } catch (e) {
                yield {
                    stage: 'strategy-failed',
                    message: `✗ ${strategy.name} failed: ${e.message}`,
                    method: strategy.name,
                    error: e.message,
                    progress: strategyProgress + 5
                };
            }
        }
        
        // Step 4: Dictionary validation
        if (useDictionary && results.length > 0) {
            yield {
                stage: 'validating',
                message: 'Validating results with dictionary...',
                progress: 90
            };
            
            try {
                const validator = new DictionaryValidator(this.language);
                const validatedResults = await validator.validateMultiple(results);
                const bestResult = validatedResults[0];
                const dictConfidence = bestResult.validation.confidence;
                const wordCoverage = parseFloat(bestResult.validation.metrics.wordCoverage) / 100;
                
                console.log(`[Orchestrator] Dictionary validation: method=${bestResult.method}, confidence=${bestResult.confidence}, dictConfidence=${dictConfidence}, wordCoverage=${wordCoverage}, plaintext length=${bestResult.plaintext?.length || 0}`);
                
                yield {
                    stage: 'validation-complete',
                    message: `Dictionary validation: ${(dictConfidence * 100).toFixed(0)}% confidence`,
                    validation: bestResult.validation,
                    progress: 95
                };
                
                // REJECT if dictionary validation is too low (< 30% word coverage)
                if (wordCoverage < 0.30 && dictConfidence < 0.40) {
                    console.warn(`[Orchestrator] Best result rejected: word coverage too low (${(wordCoverage * 100).toFixed(0)}%)`);
                    
                    // Try to find a better result
                    for (let i = 1; i < validatedResults.length; i++) {
                        const altResult = validatedResults[i];
                        const altCoverage = parseFloat(altResult.validation.metrics.wordCoverage) / 100;
                        if (altCoverage >= 0.30 || altResult.validation.confidence >= 0.40) {
                            console.log(`[Orchestrator] Using alternative result: ${altResult.method} with ${(altCoverage * 100).toFixed(0)}% coverage`);
                            const finalResult = {
                                stage: 'complete',
                                ...altResult,
                                dictionaryValidation: altResult.validation,
                                progress: 100
                            };
                            console.log(`[Orchestrator] Returning final result: method=${finalResult.method}, confidence=${finalResult.confidence}, plaintext length=${finalResult.plaintext?.length || 0}`);
                            return finalResult;
                        }
                    }
                    
                    // No good result found - return best with warning
                    console.warn('[Orchestrator] No result passed dictionary validation threshold, returning best anyway');
                }
                
                const finalResult = {
                    stage: 'complete',
                    ...bestResult,
                    dictionaryValidation: bestResult.validation,
                    progress: 100
                };
                console.log(`[Orchestrator] Returning final result: method=${finalResult.method}, confidence=${finalResult.confidence}, plaintext length=${finalResult.plaintext?.length || 0}`);
                return finalResult;
            } catch (error) {
                console.error('[Orchestrator] Dictionary validation error:', error);
                yield {
                    stage: 'validation-failed',
                    message: 'Dictionary validation failed, using best result',
                    progress: 95
                };
            }
        }
        
        // Step 5: Return best result
        if (results.length === 0) {
            yield {
                stage: 'failed',
                message: 'No successful decryption',
                plaintext: ciphertext,
                method: 'none',
                confidence: 0,
                progress: 100
            };
        } else {
            // Sort by confidence and return best
            results.sort((a, b) => b.confidence - a.confidence);
            const bestResult = results[0];
            
            yield {
                stage: 'complete',
                message: `✓ Decryption complete: ${bestResult.method} (${(bestResult.confidence * 100).toFixed(0)}% confidence)`,
                ...bestResult,
                progress: 100
            };
        }
    }
}

