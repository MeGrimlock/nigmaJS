import { Stats } from './stats.js';
import { Kasiski } from './kasiski.js';
import { PeriodicAnalysis } from './periodic-analysis.js';
import { TranspositionDetector } from './transposition-detector.js';
import { TextUtils } from '../core/text-utils.js';
import { LanguageAnalysis } from './analysis-core.js';
import configLoader from '../config/config-loader.js';

/**
 * Cipher Identifier: Analyzes ciphertext to suggest the type of cipher used.
 * Combines Index of Coincidence, Kasiski examination, entropy, and heuristics.
 */
export class CipherIdentifier {
    /**
     * Identifies the probable cipher type(s) for a given ciphertext.
     * @param {string} text - The ciphertext to analyze.
     * @param {string} language - Target language for dictionary validation (default: 'english').
     * @returns {Promise<Object>} An object containing cipher families with confidence scores.
     */
    static async identify(text, language = 'english') {
        // Normalizar entrada para evitar crashear con undefined/null/números, etc.
        if (typeof text !== 'string') {
            if (text == null) {
                text = '';
            } else {
                text = String(text);
            }
        }
    
        // --- Early Detection: Check for special ciphers before main analysis ---
        // Polybius Square: Contains number pairs (11-55)
        // This must be checked BEFORE IC calculation because Polybius uses numbers, not letters
        const numberPairs = text.match(/\d{2}/g);
        let isPolybius = false;
        if (numberPairs && numberPairs.length >= 5) {
            const validPairs = numberPairs.filter(p => {
                const num = parseInt(p, 10);
                return num >= 11 && num <= 55;
            });
            if (validPairs.length >= numberPairs.length * 0.8) {
                isPolybius = true;
            }
        }
    
        const cleaned = TextUtils.onlyLetters(text);
        const length = cleaned.length;

        // Edge case: Polybius-like but no letters at all → skip stats, return early
        if (isPolybius && length === 0) {
            return {
                families: [
                    {
                        type: 'monoalphabetic-substitution',
                        confidence: 1.0,
                        reason: 'Polybius-like numeric digrams detected (11–55)'
                    }
                ],
                stats: {
                    length: 0,
                    ic: 0,
                    entropy: 0,
                    isPolybius: true
                }
            };
        }

        // If text is too short AND not Polybius, classification is unreliable
        if (length < 20 && !isPolybius) {
            return {
                families: [
                    {
                        type: 'unknown',
                        confidence: 1.0,
                        reason: 'Text too short for reliable analysis'
                    }
                ],
                stats: {
                    length,
                    ic: 0,
                    entropy: 0
                }
            };
        }

        // Try to ensure dictionary is loaded for this language (if available)
        try {
            if (!LanguageAnalysis.isDictionaryLoaded(language)) {
                await LanguageAnalysis.loadDictionary(language);
            }
        } catch (err) {
            // Non-fatal: if dictionary fails, we continue without it
            console.warn('[CipherIdentifier] Failed to load dictionary for language:', language, err);
        }

        // Calculate basic statistics on CLEANED text
        const ic = length > 0 ? Stats.indexOfCoincidence(cleaned) : 0; // normalized (×26)
        const entropy = length > 0 ? Stats.entropy(cleaned) : 0;       // bits (log2)
        const kasiski = Kasiski.examine(cleaned);

        // Normalize suggestedKeyLengths to always be an array
        const suggestedKeyLengths = Array.isArray(kasiski.suggestedKeyLengths)
            ? kasiski.suggestedKeyLengths
            : [];

        const getTopKeyLength = () => (suggestedKeyLengths.length > 0 ? suggestedKeyLengths[0] : null);
        const getKeyLengthValue = (entry) =>
            entry
                ? (entry.keyLength ?? entry.length ?? entry.len ?? null)
                : null;

        // Calculate periodic analysis (IC periodic + auto-correlation)
        // This helps distinguish monoalphabetic vs polyalphabetic ciphers
        let periodicAnalysis = null;
        if (length >= 20) {
            try {
                periodicAnalysis = PeriodicAnalysis.analyze(cleaned, {
                    maxPeriod: Math.min(20, Math.floor(length / 4)),
                    maxShift: Math.min(20, length - 1)
                });
            } catch (error) {
                console.warn('[CipherIdentifier] Periodic analysis failed:', error);
            }
        }

        // Calculate transposition detection (based on ciphertext linguisticity)
        // This helps distinguish transposition from substitution ciphers
        let transpositionAnalysis = null;
        if (length >= 20) {
            try {
                transpositionAnalysis = TranspositionDetector.analyze(cleaned, language);
            } catch (error) {
                console.warn('[CipherIdentifier] Transposition analysis failed:', error);
            }
        }

        // Dictionary validation: check if text contains valid words
        // This helps distinguish between ciphertext and plaintext/weakly encrypted text
        let dictionaryScore = 0;
        try {
            const dict = LanguageAnalysis.getDictionary(language);
            if (dict) {
                const words = text
                    .toUpperCase()
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
                    dictionaryScore = validWords / words.length; // 0-1, higher = more valid words
                }
            }
        } catch (error) {
            console.warn('[CipherIdentifier] Dictionary validation failed:', error);
        }

        // Initialize confidence scores for each cipher family
        const scores = {
            'monoalphabetic-substitution': 0,
            'caesar-shift': 0,
            'vigenere-like': 0,
            'transposition': 0,
            'random-unknown': 0
        };

        // Text length categories (used by several heuristics)
        const isShortText = length < configLoader.get('cipher_identifier.text_categories.short_threshold', 50);
        const isMediumText = length >= 50 && length < 150;
        const isLongText = length >= 150;

        // ========================================================================
        // PRIORITY: Execute Caesar Test FIRST (before other heuristics)
        // Includes shift=0 baseline to avoid misclassifying plaintext as Caesar.
        // ========================================================================
        let caesarTestScore = 0;
        let caesarTestSucceeded = false;

        if (length >= 10) {
            // Always include shift=0 as baseline
            let testShifts;
            if (length < 30) {
                testShifts = [0, 1, 13, 25];
            } else if (length < 100) {
                testShifts = [0, 1, 2, 3, 13, 25];
            } else {
                testShifts = [];
                for (let s = 0; s < 26; s++) testShifts.push(s);
            }

            const langData =
                LanguageAnalysis.languages[language] || LanguageAnalysis.languages.english;
            const expectedFreqs = langData ? langData.monograms : null;

            let bestShiftScore = 0;
            let bestShift = 0;
            let baselineScore = 0; // score for shift=0

            for (const shift of testShifts) {
                let decrypted = '';
                for (const char of cleaned) {
                    const code = char.charCodeAt(0);
                    if (code >= 65 && code <= 90) {
                        const decryptedCode = ((code - 65 - shift + 26) % 26) + 65;
                        decrypted += String.fromCharCode(decryptedCode);
                    }
                }

                let shiftScore = 0;

                if (expectedFreqs && decrypted.length > 0) {
                    const N = decrypted.length;
                    const freqData = Stats.frequency(decrypted);
                    const observedCounts = freqData.counts || {};

                    let chiSquared = 0;
                    for (let i = 0; i < 26; i++) {
                        const letter = String.fromCharCode(65 + i);
                        const p = (expectedFreqs[letter] || 0) / 100;
                        const O = observedCounts[letter] || 0;
                        const E = p * N;

                        if (E > 0) {
                            chiSquared += Math.pow(O - E, 2) / E;
                        } else if (O > 0) {
                            chiSquared += O * 10;
                        }
                    }

                    const normalizationFactor =
                        length < 50 ? 100 :
                        (length < 200 ? 60 : 40);

                    shiftScore = 1 / (1 + chiSquared / normalizationFactor);
                }

                if (shift === 0) {
                    baselineScore = shiftScore;
                }

                if (shiftScore > bestShiftScore) {
                    bestShiftScore = shiftScore;
                    bestShift = shift;
                }
            }

            const improvement = bestShiftScore - baselineScore;

            if (bestShift !== 0 && ((bestShiftScore > configLoader.get('cipher_identifier.caesar_test.primary_threshold.score', 0.6) && improvement > configLoader.get('cipher_identifier.caesar_test.primary_threshold.improvement', 0.15)) ||
                                   (bestShiftScore > configLoader.get('cipher_identifier.caesar_test.secondary_threshold.score', 0.4) && improvement > configLoader.get('cipher_identifier.caesar_test.secondary_threshold.improvement', 0.08)))) {
                caesarTestSucceeded = true;
                caesarTestScore = bestShiftScore * configLoader.get('cipher_identifier.caesar_test.primary_multiplier', 2.2);

                scores['caesar-shift'] += caesarTestScore;
                scores['monoalphabetic-substitution'] += caesarTestScore * configLoader.get('cipher_identifier.caesar_test.monoalphabetic_boost', 1.3);

                scores['vigenere-like'] -= caesarTestScore * configLoader.get('cipher_identifier.caesar_test.vigenere_penalty', 1.8);
                scores['transposition'] -= caesarTestScore * configLoader.get('cipher_identifier.caesar_test.transposition_penalty', 1.8);
            } else if (bestShift !== 0 && bestShiftScore > configLoader.get('cipher_identifier.caesar_test.minimum_threshold.score', 0.3) && improvement > configLoader.get('cipher_identifier.caesar_test.minimum_threshold.improvement', 0.05)) {
                caesarTestSucceeded = true;
                caesarTestScore = bestShiftScore * 1.5;

                scores['monoalphabetic-substitution'] += caesarTestScore * 1.2;
                scores['caesar-shift'] += caesarTestScore;

                scores['vigenere-like'] -= caesarTestScore * 1.2;
                scores['transposition'] -= caesarTestScore * 1.2;
            } else {
                caesarTestSucceeded = false;
            }
        }

        // --- Early Classification: Polybius Square ---
        if (isPolybius) {
            // Polybius is monoalphabetic but numeric; we classify within monoalphabetic family
            scores['monoalphabetic-substitution'] += 2.0; // Strong signal for Polybius-like
            scores['caesar-shift'] += 0.1; // Slight hint it's monoalphabetic (but not Caesar)
        } else {
            // --- Heuristic 1: Index of Coincidence ---
            let highICThreshold, mediumICThreshold;
            if (isShortText) {
                highICThreshold = 1.2;
                mediumICThreshold = 0.8;
            } else if (isMediumText) {
                highICThreshold = 1.4;
                mediumICThreshold = 1.1;
            } else if (isLongText) {
                highICThreshold = 1.5;
                mediumICThreshold = 1.2;
            } else {
                highICThreshold = 1.5;
                mediumICThreshold = 1.2;
            }

            if (caesarTestSucceeded) {
                // Caesar test already boosted monoalphabetic; don't double-count
            } else if (ic >= highICThreshold) {
                scores['monoalphabetic-substitution'] += 0.8;
                scores['caesar-shift'] += 0.6;
                scores['transposition'] += 0.7;
            } else if (ic >= mediumICThreshold && ic < highICThreshold) {
                const topKeyLengthEntry = getTopKeyLength();
                const topKeyLengthValue = getKeyLengthValue(topKeyLengthEntry);

                // CRITICAL: For Gronsfeld/Autokey short, we need to be more lenient with Kasiski
                // Lower threshold for short texts to catch weak periodic patterns (keyLength 2-3)
                // CRITICAL: keyLength = 1 is NOT polyalphabetic (it's Caesar/monoalphabetic)
                const reliableKasiski =
                    kasiski.hasRepetitions &&
                    topKeyLengthEntry &&
                    topKeyLengthEntry.score > (isShortText ? 0.1 : 0.3) &&
                    topKeyLengthValue > 1;

                // Weak periodicity (for Autokey/Gronsfeld short), still requiring keyLength > 1
                const hasWeakPeriodicity =
                    topKeyLengthEntry &&
                    topKeyLengthEntry.score > 0.05 &&
                    topKeyLengthValue > 1;

                if (isShortText) {
                    if (reliableKasiski) {
                        // Strong Kasiski evidence → vigenere-like
                        scores['vigenere-like'] += 1.2; // Increased from 1.0
                        scores['monoalphabetic-substitution'] += 0.1;
                        scores['caesar-shift'] += 0.1;
                    } else if (hasWeakPeriodicity) {
                        // Weak but real periodicity → likely vigenere-like (Autokey, Gronsfeld)
                        scores['vigenere-like'] += 0.8; // Boost for weak periodicity
                        scores['monoalphabetic-substitution'] += 0.3;
                        scores['caesar-shift'] += 0.2;
                    } else {
                        // No periodicity → monoalphabetic
                        scores['monoalphabetic-substitution'] += 0.6;
                        scores['caesar-shift'] += 0.4;
                        scores['vigenere-like'] += 0.2;
                    }
                } else {
                    if (reliableKasiski) {
                        scores['vigenere-like'] += 1.0;
                        scores['monoalphabetic-substitution'] += 0.1;
                    } else {
                        scores['monoalphabetic-substitution'] += 0.6;
                        scores['vigenere-like'] += 0.2;
                    }
                }
            } else if (ic < mediumICThreshold) {
                if (caesarTestSucceeded) {
                    // Nothing extra
                } else if (isShortText) {
                    // For short texts, bias towards simple monoalphabetic
                    scores['monoalphabetic-substitution'] += 0.7; // Increased from 0.5
                    scores['caesar-shift'] += 0.5;               // Increased from 0.4
                    scores['vigenere-like'] += 0.3;              // Reduced from 0.6
                } else {
                    scores['vigenere-like'] += 0.7;
                    scores['random-unknown'] += 0.8;
                }
            }
        }

        // --- Heuristic 2: Kasiski Examination + Periodic Analysis ---
        const minLengthForKasiski = isShortText ? 30 : 100;
        const reliableKasiskiGlobal =
            length >= minLengthForKasiski &&
            kasiski.hasRepetitions &&
            suggestedKeyLengths.length > 0;

        const highIC = ic >= (isShortText ? 1.3 : 1.6);

        // Use periodic analysis to strengthen/weaken Kasiski evidence
        let periodicBoost = 0;
        if (periodicAnalysis && periodicAnalysis.recommendation !== 'insufficient_data') {
            if (periodicAnalysis.recommendation === 'likely_polyalphabetic') {
                periodicBoost = 0.4; // Strong evidence for polyalphabetic
            } else if (periodicAnalysis.recommendation === 'likely_monoalphabetic') {
                periodicBoost = -0.3; // Evidence against polyalphabetic
            }
        }

        if (!caesarTestSucceeded && reliableKasiskiGlobal && !highIC) {
            const topKeyLengthEntry = getTopKeyLength();
            const topKeyLengthValue = getKeyLengthValue(topKeyLengthEntry);

            // CRITICAL: Never accept keyLength=1 as evidence for vigenere-like
            if (topKeyLengthEntry && topKeyLengthValue > 1) {
                if (topKeyLengthEntry.score > 0.3) {
                    scores['vigenere-like'] += 1.2 + periodicBoost;
                    scores['monoalphabetic-substitution'] -= 0.5;
                    scores['caesar-shift'] -= 0.5;
                } else if (topKeyLengthEntry.score > 0.1) {
                    scores['vigenere-like'] += 0.6 + periodicBoost;
                }
            } else if (topKeyLengthEntry && topKeyLengthValue === 1) {
                // keyLength=1 detected → this is NOT polyalphabetic, it's monoalphabetic
                scores['monoalphabetic-substitution'] += 0.5;
                scores['caesar-shift'] += 0.4;
                scores['vigenere-like'] -= 0.3; // Penalty for false polyalphabetic signal
            }
        } else {
            if (caesarTestSucceeded) {
                // Caesar already dominates
            } else {
                const topKeyLengthEntry = getTopKeyLength();
                const hasWeakPeriodicity =
                    topKeyLengthEntry && topKeyLengthEntry.score > 0.05;

                // Use periodic analysis when Kasiski is weak or unavailable
                if (periodicAnalysis && periodicAnalysis.polyalphabeticScore > 0.6) {
                    // Periodic analysis strongly suggests polyalphabetic
                    scores['vigenere-like'] += 0.5 + periodicBoost;
                    scores['monoalphabetic-substitution'] += 0.2;
                } else if (
                    periodicAnalysis &&
                    periodicAnalysis.polyalphabeticScore < 0.4
                ) {
                    // Periodic analysis suggests monoalphabetic
                    scores['monoalphabetic-substitution'] += 0.4;
                    scores['caesar-shift'] += 0.3;
                    scores['vigenere-like'] += 0.1;
                } else {
                    // Fall back to original logic
                    if (isShortText) {
                        if (hasWeakPeriodicity) {
                            scores['vigenere-like'] += 0.4;
                            scores['caesar-shift'] += 0.3;
                            scores['monoalphabetic-substitution'] += 0.3;
                        } else {
                            scores['caesar-shift'] += 0.6;
                            scores['monoalphabetic-substitution'] += 0.5;
                        }
                    } else {
                        scores['monoalphabetic-substitution'] += 0.5;
                        scores['caesar-shift'] += 0.4;
                    }
                }
            }
        }

        // --- Heuristic 3: Entropy ---
        if (caesarTestSucceeded) {
            // Skip extra boosts
        } else if (entropy >= 4.3) {
            scores['random-unknown'] += 0.5;
            scores['vigenere-like'] += 0.2;
        } else if (entropy >= 3.8 && entropy < 4.3) {
            // CRITICAL: High IC + medium entropy could be transposition OR monoalphabetic
            // Use dictionary score to distinguish: if substitution improves dictionary score, it's monoalphabetic
            if (ic >= 1.5) {
                if (dictionaryScore > 0.2) {
                    // Substitution improves dictionary → monoalphabetic
                    scores['monoalphabetic-substitution'] += 0.7; // Increased
                    scores['transposition'] += 0.3; // Reduced
                } else {
                    // Substitution doesn't help → transposition
                    scores['transposition'] += 0.7;
                    scores['monoalphabetic-substitution'] += 0.3;
                }
            } else {
                scores['transposition'] += 0.5;
                scores['vigenere-like'] += 0.3;
            }
        } else if (entropy < 3.8) {
            scores['monoalphabetic-substitution'] += 0.3;
            scores['caesar-shift'] += 0.3;
        }

        // --- Heuristic 3b: Transposition Detection (improved with linguisticity analysis) ---
        // Only favor transposition if:
        // 1. Caesar test FAILED
        // 2. High IC
        // 3. Medium entropy
        // 4. NO reliable Kasiski evidence
        // 5. Dictionary score is LOW
        // 6. TranspositionDetector confirms (or at least doesn't contradict)
        if (!isPolybius && !caesarTestSucceeded && length > 0) {
            const uniqueChars = new Set(cleaned);
            const isOnlyLetters = Array.from(uniqueChars).every(c => /[A-Za-z]/.test(c));

            const topKeyLengthEntry = getTopKeyLength();
            const topKeyLengthValue = getKeyLengthValue(topKeyLengthEntry);
            const hasKasiskiEvidence =
                kasiski.hasRepetitions &&
                topKeyLengthEntry &&
                topKeyLengthEntry.score > 0.1 &&
                topKeyLengthValue > 1;

            let transpositionBoost = 0;
            if (transpositionAnalysis && transpositionAnalysis.recommendation !== 'insufficient_data') {
                if (transpositionAnalysis.recommendation === 'likely_transposition') {
                    transpositionBoost = 0.5;
                } else if (transpositionAnalysis.recommendation === 'likely_substitution') {
                    transpositionBoost = -0.4;
                }
            }

            if (isOnlyLetters && !hasKasiskiEvidence) {
                if (ic >= 1.5 && entropy >= 3.8 && entropy < 4.3 && length >= 40) {
                    if (dictionaryScore < 0.3) {
                        if (transpositionBoost > 0) {
                            // Detector confirms transposition
                            scores['transposition'] += 1.5 + transpositionBoost;
                            scores['monoalphabetic-substitution'] -= 0.4;
                            scores['vigenere-like'] -= 0.4;
                        } else if (transpositionBoost < 0) {
                            // Detector suggests substitution instead
                            scores['monoalphabetic-substitution'] += 0.7;
                            scores['transposition'] += 0.3;
                        } else {
                            // Detector is neutral
                            scores['transposition'] += 1.5;
                            scores['monoalphabetic-substitution'] -= 0.4;
                            scores['vigenere-like'] -= 0.4;
                        }
                    } else {
                        // High dictionary score suggests monoalphabetic
                        scores['monoalphabetic-substitution'] += 0.5;
                        scores['transposition'] += 0.3;
                    }
                } else if (ic >= 1.3 && length >= 25 && length < 40) {
                    // Short texts: be conservative, use detector if available
                    if (dictionaryScore < 0.3) {
                        if (
                            transpositionAnalysis &&
                            transpositionAnalysis.transpositionScore > 0.6
                        ) {
                            scores['transposition'] += 1.0;
                        } else {
                            scores['transposition'] += 0.8;
                        }
                    }
                }
            }
        }

        // CRITICAL FIX: Only apply transposition penalty if transposition score is VERY high
        // AND there's no evidence of substitution working (low dictionary score)
        const transpoScore = scores['transposition'];
        if (!caesarTestSucceeded && transpoScore > 1.5 && length >= 30 && dictionaryScore < 0.2) {
            scores['monoalphabetic-substitution'] *= 0.7;
            scores['vigenere-like'] *= 0.6;
            scores['caesar-shift'] *= 0.5;
        }

        // --- Heuristic 4: Text Length ---
        if (!caesarTestSucceeded && length < 50) {
            scores['random-unknown'] += 0.1;
            scores['caesar-shift'] += 0.3;
        }

        // --- Heuristic 6: Dictionary Validation ---
        if (!caesarTestSucceeded) {
            if (dictionaryScore > 0.5) {
                if (ic >= 1.5) {
                    scores['monoalphabetic-substitution'] += 0.4;
                    scores['caesar-shift'] += 0.3;
                } else if (ic >= 1.2) {
                    scores['transposition'] += 0.3;
                }
                scores['random-unknown'] -= 0.3;
            }
            // No boost to vigenere/random for low dictionaryScore: expected for ciphertext
        }

        // --- Heuristic 7: Specific Cipher Pattern Detection ---
        const baconianPattern =
            /[ABab]{5,}/.test(text) || /[01]{5,}/.test(text);
        if (baconianPattern) {
            scores['monoalphabetic-substitution'] += 0.4;
        }

        // Atbash-like detection
        if (ic >= 1.8 && !kasiski.hasRepetitions && dictionaryScore > 0.2) {
            scores['monoalphabetic-substitution'] += 0.8;
            scores['caesar-shift'] += 0.6;
            scores['transposition'] -= 0.5;
        }

        if (ic >= 2.0 && dictionaryScore > 0.1) {
            scores['monoalphabetic-substitution'] += 0.5;
            scores['caesar-shift'] += 0.4;
            scores['transposition'] -= 0.4;
        }

        // --- Heuristic 8: Tie-breaker for short texts with weak signals ---
        if (length < 40 && !caesarTestSucceeded) {
            const topKeyLengthEntry = getTopKeyLength();
            const topKeyLengthValue = getKeyLengthValue(topKeyLengthEntry);
            const hasWeakKasiski =
                topKeyLengthEntry &&
                topKeyLengthEntry.score > 0.05 &&
                topKeyLengthValue > 1;

            if (hasWeakKasiski) {
                const currentBest = Math.max(...Object.values(scores));
                const vigenereScore = scores['vigenere-like'];

                if (vigenereScore + 0.2 >= currentBest) {
                    scores['vigenere-like'] += 0.3;
                }
            }
        }

        // --- Heuristic 9: Extra boost for Autokey/vigenere-like in short/medium texts ---
        if (!caesarTestSucceeded && length >= 30 && length <= 150) {
            const topKeyLengthEntry = getTopKeyLength();
            const topKeyLengthValue = getKeyLengthValue(topKeyLengthEntry);
            const minScore = length < 50 ? 0.05 : 0.1;

            if (
                topKeyLengthEntry &&
                topKeyLengthValue > 1 &&
                topKeyLengthEntry.score > minScore
            ) {
                const currentBest = Math.max(...Object.values(scores));
                const vScore = scores['vigenere-like'];

                // If vigenere-like is close to best, force tie-break
                if (vScore + 0.15 >= currentBest) {
                    scores['vigenere-like'] += 0.5; // More aggressive boost
                }
            }
        }

        // --- Heuristic 10: Prioritize monoalphabetic family over caesar-shift ---
        // Ensure monoalphabetic-substitution is at least slightly stronger than caesar-shift
        // so that the main family is monoalphabetic, and caesar is seen as a sub-case.
        if (scores['caesar-shift'] > 0) {
            scores['monoalphabetic-substitution'] = Math.max(
                scores['monoalphabetic-substitution'],
                scores['caesar-shift'] * 1.05 // 5% above caesar
            );
        }

        // Normalize scores to [0, 1] and filter out very low scores
        const maxScore = Math.max(...Object.values(scores));
        const families = [];

        for (const type in scores) {
            const normalizedScore = maxScore > 0 ? scores[type] / maxScore : 0;
            if (normalizedScore > configLoader.get('cipher_identifier.confidence_thresholds.minimum_family_score', 0.2)) {
                const entry = {
                    type,
                    confidence: parseFloat(normalizedScore.toFixed(2))
                };

                if (type === 'vigenere-like' && suggestedKeyLengths.length > 0) {
                    const topKey = getTopKeyLength();
                    const keyLenValue = getKeyLengthValue(topKey);
                    if (keyLenValue) {
                        entry.suggestedKeyLength = keyLenValue;
                    }
                }

                families.push(entry);
            }
        }

        families.sort((a, b) => b.confidence - a.confidence);

        // If no families were detected with sufficient confidence, classify as random-unknown
        if (families.length === 0) {
            families.push({
                type: 'random-unknown',
                confidence: configLoader.get('cipher_identifier.random_unknown_confidence', 0.7), // Moderate confidence for unknown/random text
                reason: 'No clear cipher pattern detected'
            });
        }

        return {
            families,
            stats: {
                length,
                ic: parseFloat(ic.toFixed(2)),
                entropy: parseFloat(entropy.toFixed(2)),
                hasRepetitions: kasiski.hasRepetitions,
                suggestedKeyLengths: suggestedKeyLengths.slice(0, 3)
            }
        };
    }

    /**
     * Returns a human-readable description of a cipher type.
     * @param {string} type - The cipher type identifier.
     * @returns {string} A description of the cipher.
     */
    static getDescription(type) {
        const descriptions = {
            'monoalphabetic-substitution':
                'Monoalphabetic Substitution (each letter maps to one other letter)',
            'caesar-shift':
                'Caesar Shift (simple rotation of the alphabet)',
            'vigenere-like':
                'Polyalphabetic Cipher (Vigenère, Beaufort, etc.)',
            'transposition':
                'Transposition Cipher (letters are rearranged, not substituted)',
            'random-unknown':
                'Strong Cipher or Random Text (high entropy, uniform distribution)',
            'unknown':
                'Unknown or Unclassifiable'
        };
        return descriptions[type] || 'Unknown cipher type';
    }
}
