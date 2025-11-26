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
import { default as Dictionary } from '../ciphers/dictionary/dictionary.js';

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
        let languageCandidates = [this.language];
        if (this.autoDetectLanguage) {
            console.log('[Orchestrator] Auto-detecting language...');
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
                
                // Store language detection results for use in strategies
                this.languageDetectionResults = langResults;
                
                if (langResults && langResults.length > 0) {
                    // Get top 5 language candidates to try (in order of probability)
                    languageCandidates = langResults
                        .slice(0, 5) // Try top 5 languages
                        .map(r => r.language);
                    
                    const detectedLang = langResults[0].language;
                    console.log(`[Orchestrator] Detected language: ${detectedLang} (confidence: ${langResults[0].score.toFixed(2)})`);
                    console.log(`[Orchestrator] Will try ALL methods for each language in order: ${languageCandidates.join(', ')}`);
                    this.language = detectedLang;
                } else {
                    console.warn('[Orchestrator] Could not detect language, defaulting to english');
                    this.language = 'english';
                    languageCandidates = ['english'];
                }
            } catch (error) {
                console.warn('[Orchestrator] Language detection failed:', error.message);
                this.language = 'english'; // Fallback to english
                languageCandidates = ['english'];
            }
        }
        
        // Step 1: Detect cipher type (use first language candidate for detection)
        const languageForDetection = languageCandidates[0] === 'auto' ? 'english' : languageCandidates[0];
        const detection = await CipherIdentifier.identify(ciphertext, languageForDetection);
        const topCandidate = detection.families[0];
        
        console.log(`[Orchestrator] Detected cipher: ${topCandidate.type} (confidence: ${topCandidate.confidence})`);
        
        // Step 2: Select attack strategy based on detection
        const strategies = this._selectStrategies(topCandidate, detection.stats, ciphertext);
        console.log(`[Orchestrator] Selected ${strategies.length} strategy/strategies`);
        
        // Step 3: Execute strategies for EACH language candidate
        // This ensures we try ALL methods for each language before moving to the next
        const results = [];
        let bestResultAcrossLanguages = null;
        let bestScoreAcrossLanguages = -Infinity;
        const originalLanguage = this.language;
        
        for (const tryLanguage of languageCandidates) {
            console.log(`\n[Orchestrator] ===== Trying ALL methods for language: ${tryLanguage} =====`);
            
            // Temporarily change language for this iteration
            this.language = tryLanguage;
            
            // Try to load dictionary for this language
            try {
                await LanguageAnalysis.loadDictionary(tryLanguage, 'data/');
            } catch (e) {
                try {
                    await LanguageAnalysis.loadDictionary(tryLanguage, '../demo/data/');
                } catch (e2) {
                    // Dictionary not available, continue anyway
                }
            }
            
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
                        let wordCoverage = 0;
                        let dictConfidence = 0;
                        
                        if (useDictionary) {
                            try {
                                const validator = new DictionaryValidator(tryLanguage);
                                const validation = await validator.validate(result.plaintext);
                                wordCoverage = parseFloat(validation.metrics.wordCoverage) / 100;
                                dictConfidence = validation.confidence;
                                
                                // Add dictionary validation info to result
                                result.wordCoverage = wordCoverage;
                                result.dictConfidence = dictConfidence;
                            } catch (e) {
                                // Dictionary validation failed, continue
                            }
                        }
                        
                        // Calculate combined score: confidence + dictionary validation
                        const combinedScore = result.confidence + (wordCoverage * 0.5) + (dictConfidence * 0.3);
                        
                        results.push({
                            ...result,
                            language: tryLanguage,
                            cipherType: topCandidate.type,
                            detectionConfidence: topCandidate.confidence,
                            combinedScore: combinedScore
                        });
                        
                        // Track best result across all languages
                        if (combinedScore > bestScoreAcrossLanguages) {
                            bestScoreAcrossLanguages = combinedScore;
                            bestResultAcrossLanguages = {
                                ...result,
                                language: tryLanguage,
                                cipherType: topCandidate.type,
                                detectionConfidence: topCandidate.confidence
                            };
                        }
                        
                        console.log(`[Orchestrator] [${tryLanguage}] ${strategy.name}: confidence=${(result.confidence * 100).toFixed(0)}%, wordCoverage=${(wordCoverage * 100).toFixed(0)}%, combinedScore=${combinedScore.toFixed(2)}`);
                        
                        // Early termination: If we found a VERY good result (high confidence + good dictionary validation)
                        if (result.confidence > 0.85 && wordCoverage > 0.50) {
                            console.log(`[Orchestrator] ✓ Excellent result found for ${tryLanguage}: confidence=${(result.confidence * 100).toFixed(0)}%, wordCoverage=${(wordCoverage * 100).toFixed(0)}%`);
                            console.log(`[Orchestrator] Stopping early - found good solution`);
                            // Restore original language
                            this.language = originalLanguage;
                            // Return best result with dictionary validation
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
            // But only if it's really good (not just "ok")
            if (bestResultAcrossLanguages && bestResultAcrossLanguages.confidence > 0.80 && 
                bestResultAcrossLanguages.wordCoverage > 0.40) {
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
     * Selects appropriate attack strategies based on cipher detection.
     * @private
     */
    _selectStrategies(topCandidate, stats, ciphertext = '') {
        const strategies = [];
        
        // Check if text contains non-letter ASCII (for ROT47 detection)
        const hasNonLetterASCII = ciphertext && /[!-~]/.test(ciphertext) && /[^A-Za-z\s]/.test(ciphertext);
        
        switch (topCandidate.type) {
            case 'caesar-shift':
                // For Caesar, try Atbash first (it's a special case: Caesar shift 25)
                strategies.push({
                    name: 'Atbash',
                    execute: (text) => this._solveAtbash(text)
                });
                // Try ROT47 if text contains printable ASCII beyond letters
                // ROT47 handles all printable ASCII (33-126), not just letters
                if (hasNonLetterASCII) {
                    // Get language candidates from detection (if available)
                    // This allows trying multiple languages if first one fails
                    strategies.push({
                        name: 'Brute Force (ROT47)',
                        execute: async (text) => {
                            // If we have language detection results, try top candidates
                            let languageCandidates = [this.language];
                            if (this.autoDetectLanguage && this.languageDetectionResults) {
                                languageCandidates = this.languageDetectionResults
                                    .slice(0, 3) // Try top 3 languages
                                    .map(r => r.language);
                                console.log(`[Orchestrator] ROT47 will try languages: ${languageCandidates.join(', ')}`);
                            }
                            return await this._bruteForceROT47(text, languageCandidates);
                        }
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
                // Try Autokey (polyalphabetic variant)
                strategies.push({
                    name: 'Autokey',
                    execute: (text) => this._solveAutokey(text)
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
                // For monoalphabetic, try specific dictionary ciphers FIRST (fast and accurate)
                // Atbash is very common and fast to check
                strategies.push({
                    name: 'Atbash',
                    execute: (text) => this._solveAtbash(text)
                });
                // Try Polybius if text contains number pairs
                if (/\d{2}/.test(text)) {
                    strategies.push({
                        name: 'Polybius Square',
                        execute: (text) => this._solvePolybius(text)
                    });
                }
                // Try Baconian if text contains A/B patterns or binary-like patterns
                if (/[ABab]{5,}/.test(text) || /[01]{5,}/.test(text)) {
                    strategies.push({
                        name: 'Baconian',
                        execute: (text) => this._solveBaconian(text)
                    });
                }
                // Try Caesar/ROT brute force (faster than Hill Climbing)
                strategies.push({
                    name: 'Brute Force (Caesar/ROT13)',
                    execute: (text) => this._bruteForceCaesar(text)
                });
                // Also try ROT47 if text contains non-letter ASCII
                if (hasNonLetterASCII) {
                    strategies.push({
                        name: 'Brute Force (ROT47)',
                        execute: async (text) => {
                            // Get language candidates from detection (if available)
                            let languageCandidates = [this.language];
                            if (this.autoDetectLanguage && this.languageDetectionResults) {
                                languageCandidates = this.languageDetectionResults
                                    .slice(0, 3) // Try top 3 languages
                                    .map(r => r.language);
                                console.log(`[Orchestrator] ROT47 will try languages: ${languageCandidates.join(', ')}`);
                            }
                            return await this._bruteForceROT47(text, languageCandidates);
                        }
                    });
                }
                // Then try Hill Climbing (for complex substitutions)
                strategies.push({
                    name: 'Hill Climbing',
                    execute: (text) => this._solveSubstitution(text, 'hillclimb')
                });
                // Finally try Simulated Annealing (most thorough but slowest)
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
                // Try everything, starting with fast dictionary ciphers
                strategies.push({
                    name: 'Atbash',
                    execute: (text) => this._solveAtbash(text)
                });
                // Try Polybius if text contains number pairs
                if (/\d{2}/.test(text)) {
                    strategies.push({
                        name: 'Polybius Square',
                        execute: (text) => this._solvePolybius(text)
                    });
                }
                // Try Baconian if text contains A/B patterns
                if (/[ABab]{5,}/.test(text) || /[01]{5,}/.test(text)) {
                    strategies.push({
                        name: 'Baconian',
                        execute: (text) => this._solveBaconian(text)
                    });
                }
                strategies.push({
                    name: 'Brute Force (Caesar)',
                    execute: (text) => this._bruteForceCaesar(text)
                });
                strategies.push({
                    name: 'Autokey',
                    execute: (text) => this._solveAutokey(text)
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
     * If no result found with primary language, tries other languages in order of probability
     * ROT shifts all printable ASCII characters, not just letters
     * @private
     */
    async _bruteForceROT47(ciphertext, languageCandidates = null) {
        // If language candidates provided, try each language until we find a good result
        const languagesToTry = languageCandidates || [this.language];
        
        let bestOverallResult = null;
        let bestOverallScore = -Infinity;
        
        for (const tryLanguage of languagesToTry) {
            const scorer = new Scorer(tryLanguage, 4); // Use quadgrams
            const dict = LanguageAnalysis.getDictionary(tryLanguage);
            
            let bestShift = 0;
            let bestScore = -Infinity;
            let bestPlaintext = ciphertext;
            let bestWordCoverage = 0;
            
            // ROT uses ASCII printable range (33-126), so we need to try shifts 1-94
            // Try all shifts sequentially, stopping early if we find high word coverage
            const maxShift = 94; // ASCII printable range is 94 characters (33-126)
            
            console.log(`[Orchestrator] Trying ROT brute force with language: ${tryLanguage}`);
            
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
                        console.log(`[Orchestrator] Early termination: ROT shift ${shift} with language ${tryLanguage} has ${(wordCoverage * 100).toFixed(0)}% valid words`);
                        break; // Stop trying other shifts for this language
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
            
            const result = {
                plaintext: bestPlaintext,
                method: method,
                confidence: confidence,
                score: bestScore,
                key: bestShift,
                wordCoverage: bestWordCoverage,
                language: tryLanguage
            };
            
            // If we found a good result (>50% word coverage), use it and stop trying other languages
            if (bestWordCoverage > 0.50 || confidence > 0.8) {
                console.log(`[Orchestrator] Found good ROT result with language ${tryLanguage}: shift=${bestShift}, wordCoverage=${(bestWordCoverage * 100).toFixed(0)}%, confidence=${(confidence * 100).toFixed(0)}%`);
                return result;
            }
            
            // Keep track of best result across all languages
            if (bestScore > bestOverallScore || (bestWordCoverage > 0 && bestWordCoverage > (bestOverallResult?.wordCoverage || 0))) {
                bestOverallScore = bestScore;
                bestOverallResult = result;
            }
        }
        
        // Return best result found (even if not perfect)
        if (bestOverallResult && bestOverallResult.plaintext && bestOverallResult.plaintext !== ciphertext) {
            console.log(`[Orchestrator] Returning best ROT result across languages: shift=${bestOverallResult.key}, language=${bestOverallResult.language}, wordCoverage=${(bestOverallResult.wordCoverage * 100).toFixed(0)}%`);
            return bestOverallResult;
        }
        
        // Fallback: return result even if not great
        return bestOverallResult || {
            plaintext: ciphertext,
            method: 'rot47',
            confidence: 0,
            score: -Infinity,
            key: 0,
            wordCoverage: 0
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
     * Solve Atbash cipher.
     * Atbash is self-reciprocal: applying it twice returns the original text.
     * Strategy: Simply apply Atbash transformation and validate with dictionary + n-grams.
     * @private
     */
    async _solveAtbash(ciphertext) {
        try {
            // Atbash is self-reciprocal, so we can just decode it
            const atbash = new Dictionary.Atbash(ciphertext, true); // encoded = true
            const plaintext = atbash.decode();
            
            // Score with n-grams
            const scorer = new Scorer(this.language, 4); // Use quadgrams
            const cleanText = TextUtils.onlyLetters(plaintext);
            const score = scorer.score(cleanText);
            
            // Validate with dictionary
            const dict = LanguageAnalysis.getDictionary(this.language);
            let wordCoverage = 0;
            let confidence = 0.5;
            
            if (dict) {
                const words = plaintext.toUpperCase()
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
            }
            
            // Calculate confidence based on dictionary validation and n-gram score
            if (wordCoverage > 0.80) {
                confidence = 0.98;
            } else if (wordCoverage > 0.70) {
                confidence = 0.95;
            } else if (wordCoverage > 0.60) {
                confidence = 0.90;
            } else if (wordCoverage > 0.50) {
                confidence = 0.85;
            } else if (score > -3) {
                // Good quadgram score even without dictionary
                confidence = 0.90;
            } else if (score > -4) {
                confidence = 0.75;
            } else if (score > -5) {
                confidence = 0.60;
            }
            
            return {
                plaintext: TextUtils.matchLayout(ciphertext, plaintext),
                method: 'atbash',
                confidence: confidence,
                score: score,
                key: null, // Atbash has no key
                wordCoverage: wordCoverage
            };
        } catch (error) {
            console.warn('[Orchestrator] Atbash solver error:', error);
            return {
                plaintext: ciphertext,
                method: 'atbash',
                confidence: 0,
                score: -Infinity,
                key: null
            };
        }
    }
    
    /**
     * Solve Autokey cipher.
     * Autokey is a polyalphabetic cipher where the key is generated from the plaintext itself.
     * Strategy: Try common short keys and validate with dictionary + n-grams.
     * @private
     */
    async _solveAutokey(ciphertext) {
        const commonKeys = ['THE', 'AND', 'KEY', 'SECRET', 'MESSAGE', 'A', 'I'];
        const scorer = new Scorer(this.language, 4);
        const dict = LanguageAnalysis.getDictionary(this.language);
        
        let bestResult = {
            plaintext: ciphertext,
            method: 'autokey',
            confidence: 0,
            score: -Infinity,
            key: null
        };
        
        for (const key of commonKeys) {
            try {
                const autokey = new Dictionary.Autokey(ciphertext, key, true); // encoded = true
                const plaintext = autokey.decode();
                const cleanText = TextUtils.onlyLetters(plaintext);
                
                if (cleanText.length < 10) continue;
                
                const score = scorer.score(cleanText);
                
                // Validate with dictionary
                let wordCoverage = 0;
                if (dict) {
                    const words = plaintext.toUpperCase()
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
                }
                
                // Combined score: n-gram + dictionary bonus
                const combinedScore = score + (wordCoverage * 50);
                
                if (combinedScore > bestResult.score) {
                    let confidence = 0.5;
                    if (wordCoverage > 0.80) {
                        confidence = 0.98;
                    } else if (wordCoverage > 0.70) {
                        confidence = 0.95;
                    } else if (wordCoverage > 0.60) {
                        confidence = 0.90;
                    } else if (score > -3) {
                        confidence = 0.85;
                    }
                    
                    bestResult = {
                        plaintext: TextUtils.matchLayout(ciphertext, plaintext),
                        method: 'autokey',
                        confidence: confidence,
                        score: combinedScore,
                        key: key,
                        wordCoverage: wordCoverage
                    };
                    
                    // Early termination if we find a very good match
                    if (wordCoverage > 0.80 && score > -3) {
                        break;
                    }
                }
            } catch (error) {
                // Continue trying other keys
                continue;
            }
        }
        
        return bestResult;
    }
    
    /**
     * Solve Baconian cipher.
     * Baconian encodes letters as 5-bit patterns (A/B or 0/1).
     * Strategy: Try both A/B and 0/1 patterns, validate with dictionary + n-grams.
     * @private
     */
    async _solveBaconian(ciphertext) {
        const scorer = new Scorer(this.language, 4);
        const dict = LanguageAnalysis.getDictionary(this.language);
        
        let bestResult = {
            plaintext: ciphertext,
            method: 'baconian',
            confidence: 0,
            score: -Infinity,
            key: null
        };
        
        // Try A/B pattern first (most common)
        try {
            const baconian = new Dictionary.Baconian(ciphertext, true); // encoded = true
            const plaintext = baconian.decode();
            const cleanText = TextUtils.onlyLetters(plaintext);
            
            if (cleanText.length >= 10) {
                const score = scorer.score(cleanText);
                
                // Validate with dictionary
                let wordCoverage = 0;
                if (dict) {
                    const words = plaintext.toUpperCase()
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
                }
                
                const combinedScore = score + (wordCoverage * 50);
                
                if (combinedScore > bestResult.score) {
                    let confidence = 0.5;
                    if (wordCoverage > 0.80) {
                        confidence = 0.98;
                    } else if (wordCoverage > 0.70) {
                        confidence = 0.95;
                    } else if (wordCoverage > 0.60) {
                        confidence = 0.90;
                    } else if (score > -3) {
                        confidence = 0.85;
                    }
                    
                    bestResult = {
                        plaintext: TextUtils.matchLayout(ciphertext, plaintext),
                        method: 'baconian',
                        confidence: confidence,
                        score: combinedScore,
                        key: null,
                        wordCoverage: wordCoverage
                    };
                }
            }
        } catch (error) {
            // Continue to try other patterns if A/B fails
        }
        
        return bestResult;
    }
    
    /**
     * Solve Polybius Square cipher.
     * Polybius encodes letters as pairs of numbers (11-55).
     * Strategy: Detect number pairs, decode with standard grid, validate with dictionary + n-grams.
     * If keyword is used, try common keywords.
     * @private
     */
    async _solvePolybius(ciphertext) {
        // Check if text contains number pairs (11-55 pattern)
        const numberPairs = ciphertext.match(/\d{2}/g);
        if (!numberPairs || numberPairs.length < 5) {
            // Not likely to be Polybius
            return {
                plaintext: ciphertext,
                method: 'polybius',
                confidence: 0,
                score: -Infinity,
                key: null
            };
        }
        
        const scorer = new Scorer(this.language, 4);
        const dict = LanguageAnalysis.getDictionary(this.language);
        const commonKeywords = ['', 'KEY', 'SECRET', 'CIPHER', 'CODE'];
        
        let bestResult = {
            plaintext: ciphertext,
            method: 'polybius',
            confidence: 0,
            score: -Infinity,
            key: null
        };
        
        for (const keyword of commonKeywords) {
            try {
                const polybius = new Dictionary.Polybius(ciphertext, keyword, true); // encoded = true
                const plaintext = polybius.decode();
                const cleanText = TextUtils.onlyLetters(plaintext);
                
                if (cleanText.length < 10) continue;
                
                const score = scorer.score(cleanText);
                
                // Validate with dictionary
                let wordCoverage = 0;
                if (dict) {
                    const words = plaintext.toUpperCase()
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
                }
                
                const combinedScore = score + (wordCoverage * 50);
                
                if (combinedScore > bestResult.score) {
                    let confidence = 0.5;
                    if (wordCoverage > 0.80) {
                        confidence = 0.98;
                    } else if (wordCoverage > 0.70) {
                        confidence = 0.95;
                    } else if (wordCoverage > 0.60) {
                        confidence = 0.90;
                    } else if (score > -3) {
                        confidence = 0.85;
                    }
                    
                    bestResult = {
                        plaintext: TextUtils.matchLayout(ciphertext, plaintext),
                        method: 'polybius',
                        confidence: confidence,
                        score: combinedScore,
                        key: keyword || null,
                        wordCoverage: wordCoverage
                    };
                    
                    // Early termination if we find a very good match
                    if (wordCoverage > 0.80 && score > -3) {
                        break;
                    }
                }
            } catch (error) {
                // Continue trying other keywords
                continue;
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
            
            try {
                const langResults = await LanguageAnalysis.detectLanguage(ciphertext);
                
                // Store language detection results
                this.languageDetectionResults = langResults;
                
                if (langResults && langResults.length > 0) {
                    // Get top 5 language candidates to try
                    languageCandidates = langResults
                        .slice(0, 5)
                        .map(r => r.language);
                    
                    const detectedLang = langResults[0].language;
                    this.language = detectedLang;
                    yield {
                        stage: 'language-detected',
                        message: `Language detected: ${detectedLang}. Will try ALL methods for each language: ${languageCandidates.join(', ')}`,
                        language: detectedLang,
                        languageCandidates: languageCandidates,
                        progress: 8
                    };
                } else {
                    this.language = 'english';
                    languageCandidates = ['english'];
                    yield {
                        stage: 'language-detected',
                        message: 'Language detection failed, defaulting to English',
                        language: 'english',
                        progress: 8
                    };
                }
            } catch (error) {
                this.language = 'english';
                languageCandidates = ['english'];
                yield {
                    stage: 'language-detected',
                    message: 'Language detection failed, defaulting to English',
                    language: 'english',
                    progress: 8
                };
            }
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
        const strategies = this._selectStrategies(topCandidate, detection.stats, ciphertext);
        
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
            try {
                await LanguageAnalysis.loadDictionary(tryLanguage, 'data/');
            } catch (e) {
                try {
                    await LanguageAnalysis.loadDictionary(tryLanguage, '../demo/data/');
                } catch (e2) {}
            }
            
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
                        ? new SimulatedAnnealing(this.language)
                        : new HillClimb(this.language);
                    
                    let lastYieldProgress = strategyProgress;
                    let lastStatus = null;
                    for (const status of solver.solveGenerator(ciphertext, {
                        initMethod: 'frequency',
                        maxIterations: method === 'annealing' ? 20000 : 5000
                    })) {
                        lastStatus = status; // Keep track of last status
                        const innerProgress = strategyProgress + (status.progress || 0) * 0.15; // Within strategy range
                        if (innerProgress > lastYieldProgress + 2) { // Yield every 2%
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
                    
                    // Final result from solver - use lastStatus if available, otherwise call solve() directly
                    if (!lastStatus || !lastStatus.plaintext) {
                        // Fallback: call solve() directly if generator didn't produce valid result
                        const directResult = solver.solve(ciphertext, {
                            initMethod: 'frequency',
                            maxIterations: method === 'annealing' ? 20000 : 5000,
                            restarts: 2
                        });
                        lastStatus = {
                            plaintext: directResult.plaintext || ciphertext,
                            score: directResult.score || -Infinity,
                            key: directResult.key
                        };
                    }
                    
                    // Ensure plaintext exists
                    const finalPlaintext = lastStatus.plaintext || ciphertext;
                    const finalScore = lastStatus.score || -Infinity;
                    
                    // Calculate confidence based on score (handle NaN)
                    let confidence = 0.5;
                    if (!isNaN(finalScore) && isFinite(finalScore)) {
                        confidence = Math.min(1, Math.max(0, (finalScore + 7) / 4));
                    }
                    
                    result = {
                        plaintext: finalPlaintext,
                        method: method === 'annealing' ? 'simulated-annealing' : 'hill-climbing',
                        confidence: confidence,
                        score: finalScore,
                        key: lastStatus.key
                    };
                } else {
                    // For brute force or Vigenère, execute directly
                    result = await strategy.execute(ciphertext);
                }
                
                if (result && result.plaintext) {
                    // Validate with dictionary for this language
                    let wordCoverage = 0;
                    let dictConfidence = 0;
                    
                    if (useDictionary) {
                        try {
                            const validator = new DictionaryValidator(tryLanguage);
                            const validation = await validator.validate(result.plaintext);
                            wordCoverage = parseFloat(validation.metrics.wordCoverage) / 100;
                            dictConfidence = validation.confidence;
                            result.wordCoverage = wordCoverage;
                            result.dictConfidence = dictConfidence;
                        } catch (e) {
                            // Dictionary validation failed
                        }
                    }
                    
                    // Calculate combined score
                    const combinedScore = result.confidence + (wordCoverage * 0.5) + (dictConfidence * 0.3);
                    
                    result.cipherType = topCandidate.type;
                    result.detectionConfidence = topCandidate.confidence;
                    result.language = tryLanguage;
                    result.combinedScore = combinedScore;
                    results.push(result);
                    
                    // Track best result across all languages
                    if (combinedScore > bestScoreAcrossLanguages) {
                        bestScoreAcrossLanguages = combinedScore;
                        bestResultAcrossLanguages = {
                            ...result,
                            language: tryLanguage,
                            cipherType: topCandidate.type,
                            detectionConfidence: topCandidate.confidence
                        };
                    }
                    
                    console.log(`[Orchestrator] [${tryLanguage}] ${strategy.name} result: method=${result.method}, confidence=${result.confidence}, wordCoverage=${(wordCoverage * 100).toFixed(0)}%`);
                    
                    yield {
                        stage: 'strategy-complete',
                        message: `✓ [${tryLanguage}] ${strategy.name}: ${(result.confidence * 100).toFixed(0)}% confidence, ${(wordCoverage * 100).toFixed(0)}% words`,
                        method: result.method,
                        language: tryLanguage,
                        confidence: result.confidence,
                        score: result.score,
                        wordCoverage: wordCoverage,
                        plaintext: result.plaintext,
                        progress: strategyProgress + 5
                    };
                    
                    // Early termination: If we found a VERY good result
                    if (result.confidence > 0.85 && wordCoverage > 0.50) {
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
                
                if (!tryMultiple) break;
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
            }
            
            // If we found a good result for this language, we can stop trying other languages
            if (bestResultAcrossLanguages && bestResultAcrossLanguages.confidence > 0.80 && 
                bestResultAcrossLanguages.wordCoverage > 0.40) {
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


