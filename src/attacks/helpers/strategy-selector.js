import { AtbashSolver } from '../strategies/atbash-solver.js';
import { AutokeySolver } from '../strategies/autokey-solver.js';
import { BaconianSolver } from '../strategies/baconian-solver.js';
import { PolybiusSolver } from '../strategies/polybius-solver.js';
import { CaesarBruteForce } from '../strategies/caesar-brute-force.js';
import { ROT47BruteForce } from '../strategies/rot47-brute-force.js';
import { VigenereStrategy } from '../strategies/vigenere-strategy.js';
import { SubstitutionStrategy } from '../strategies/substitution-strategy.js';
import { PolyalphabeticStrategy } from '../strategies/polyalphabetic-strategy.js';
import { RailFenceSolver } from '../strategies/railfence-solver.js';
import { AmscoSolver } from '../strategies/amsco-solver.js';

/**
 * Strategy Selector
 * 
 * Selects appropriate attack strategies based on cipher detection.
 * Follows Single Responsibility Principle: only responsible for strategy selection.
 */
export class StrategySelector {
    /**
     * Selects strategies based on cipher type detection.
     * @param {Object} topCandidate - Top cipher type candidate from CipherIdentifier
     * @param {Object} stats - Statistics from cipher detection
     * @param {string} ciphertext - The ciphertext to decrypt
     * @param {string} language - Current language
     * @param {Array} languageDetectionResults - Optional language detection results for multi-language support
     * @param {boolean} autoDetectLanguage - Whether language auto-detection is enabled
     * @returns {Array<Object>} Array of strategy objects with { name, execute } methods
     */
    static selectStrategies(topCandidate, stats, ciphertext = '', language = 'english', languageDetectionResults = null, autoDetectLanguage = false) {
        const strategies = [];
        
        // Check if text contains non-letter ASCII (for ROT47 detection)
        const hasNonLetterASCII = ciphertext && /[!-~]/.test(ciphertext) && /[^A-Za-z\s]/.test(ciphertext);
        
        switch (topCandidate.type) {
            case 'caesar-shift':
                // For Caesar, try Atbash first (it's a special case: Caesar shift 25)
                strategies.push({
                    name: 'Atbash',
                    execute: async (text) => {
                        const solver = new AtbashSolver(language);
                        return await solver.solve(text);
                    }
                });
                // Try ROT47 if text contains printable ASCII beyond letters
                if (hasNonLetterASCII) {
                    strategies.push({
                        name: 'Brute Force (ROT47)',
                        execute: async (text) => {
                            const solver = new ROT47BruteForce(language);
                            // If we have language detection results, try top candidates
                            let languageCandidates = [language];
                            if (autoDetectLanguage && languageDetectionResults) {
                                languageCandidates = languageDetectionResults
                                    .slice(0, 3) // Try top 3 languages
                                    .map(r => r.language);
                                console.log(`[StrategySelector] ROT47 will try languages: ${languageCandidates.join(', ')}`);
                            }
                            return await solver.solve(text, languageCandidates);
                        }
                    });
                }
                // Then try standard Caesar brute force (letters only)
                strategies.push({
                    name: 'Brute Force (Caesar/ROT13)',
                    execute: async (text) => {
                        const solver = new CaesarBruteForce(language);
                        return await solver.solve(text);
                    }
                });
                break;
                
            case 'vigenere-like':
                // For Vigenère, try Vigenère-specific methods FIRST
                strategies.push({
                    name: 'Vigenère Solver (Friedman)',
                    execute: async (text) => {
                        const solver = new VigenereStrategy(language);
                        return await solver.solve(text, topCandidate.suggestedKeyLength);
                    }
                });
                // Try Autokey (polyalphabetic variant)
                strategies.push({
                    name: 'Autokey',
                    execute: async (text) => {
                        const solver = new AutokeySolver(language);
                        return await solver.solve(text);
                    }
                });
                // Then try advanced polyalphabetic (Porta, Beaufort, Gronsfeld, Quagmire)
                strategies.push({
                    name: 'Advanced Polyalphabetic (Porta/Beaufort/Gronsfeld/Quagmire)',
                    execute: async (text) => {
                        const solver = new PolyalphabeticStrategy(language);
                        return await solver.solve(text);
                    }
                });
                // Fallback to substitution if all polyalphabetic methods fail
                strategies.push({
                    name: 'Hill Climbing (Fallback)',
                    execute: async (text) => {
                        const solver = new SubstitutionStrategy(language);
                        return await solver.solve(text, 'hillclimb');
                    }
                });
                // Only try Caesar as last resort for Vigenère (unlikely to work)
                strategies.push({
                    name: 'Brute Force (Caesar/ROT13) - Fallback',
                    execute: async (text) => {
                        const solver = new CaesarBruteForce(language);
                        return await solver.solve(text);
                    }
                });
                break;
                
            case 'monoalphabetic-substitution':
                // For monoalphabetic, try specific dictionary ciphers FIRST (fast and accurate)
                strategies.push({
                    name: 'Atbash',
                    execute: async (text) => {
                        const solver = new AtbashSolver(language);
                        return await solver.solve(text);
                    }
                });
                // Try Polybius if text contains number pairs
                if (/\d{2}/.test(ciphertext)) {
                    strategies.push({
                        name: 'Polybius Square',
                        execute: async (text) => {
                            const solver = new PolybiusSolver(language);
                            return await solver.solve(text);
                        }
                    });
                }
                // Try Baconian if text contains A/B patterns or binary-like patterns
                if (/[ABab]{5,}/.test(ciphertext) || /[01]{5,}/.test(ciphertext)) {
                    strategies.push({
                        name: 'Baconian',
                        execute: async (text) => {
                            const solver = new BaconianSolver(language);
                            return await solver.solve(text);
                        }
                    });
                }
                // Try Caesar/ROT brute force (faster than Hill Climbing)
                strategies.push({
                    name: 'Brute Force (Caesar/ROT13)',
                    execute: async (text) => {
                        const solver = new CaesarBruteForce(language);
                        return await solver.solve(text);
                    }
                });
                // Also try ROT47 if text contains non-letter ASCII
                if (hasNonLetterASCII) {
                    strategies.push({
                        name: 'Brute Force (ROT47)',
                        execute: async (text) => {
                            const solver = new ROT47BruteForce(language);
                            let languageCandidates = [language];
                            if (autoDetectLanguage && languageDetectionResults) {
                                languageCandidates = languageDetectionResults
                                    .slice(0, 3)
                                    .map(r => r.language);
                                console.log(`[StrategySelector] ROT47 will try languages: ${languageCandidates.join(', ')}`);
                            }
                            return await solver.solve(text, languageCandidates);
                        }
                    });
                }
                // Then try Hill Climbing (for complex substitutions)
                strategies.push({
                    name: 'Hill Climbing',
                    execute: async (text) => {
                        const solver = new SubstitutionStrategy(language);
                        return await solver.solve(text, 'hillclimb');
                    }
                });
                // Finally try Simulated Annealing (most thorough but slowest)
                strategies.push({
                    name: 'Simulated Annealing',
                    execute: async (text) => {
                        const solver = new SubstitutionStrategy(language);
                        return await solver.solve(text, 'annealing');
                    }
                });
                break;
                
            case 'transposition':
                // Try Rail Fence first (most common transposition cipher)
                strategies.push({
                    name: 'Rail Fence',
                    execute: async (text) => {
                        const solver = new RailFenceSolver(language);
                        return await solver.solve(text);
                    }
                });
                // Try Amsco (columnar transposition variant)
                strategies.push({
                    name: 'Amsco',
                    execute: async (text) => {
                        const solver = new AmscoSolver(language);
                        return await solver.solve(text);
                    }
                });
                // Fallback to substitution (in case it's actually a substitution cipher)
                strategies.push({
                    name: 'Hill Climbing (Transposition Fallback)',
                    execute: async (text) => {
                        const solver = new SubstitutionStrategy(language);
                        return await solver.solve(text, 'hillclimb');
                    }
                });
                break;
                
            case 'random-unknown':
            default:
                // Try everything, starting with fast dictionary ciphers
                strategies.push({
                    name: 'Atbash',
                    execute: async (text) => {
                        const solver = new AtbashSolver(language);
                        return await solver.solve(text);
                    }
                });
                // Try Polybius if text contains number pairs
                if (/\d{2}/.test(ciphertext)) {
                    strategies.push({
                        name: 'Polybius Square',
                        execute: async (text) => {
                            const solver = new PolybiusSolver(language);
                            return await solver.solve(text);
                        }
                    });
                }
                // Try Baconian if text contains A/B patterns
                if (/[ABab]{5,}/.test(ciphertext) || /[01]{5,}/.test(ciphertext)) {
                    strategies.push({
                        name: 'Baconian',
                        execute: async (text) => {
                            const solver = new BaconianSolver(language);
                            return await solver.solve(text);
                        }
                    });
                }
                strategies.push({
                    name: 'Brute Force (Caesar)',
                    execute: async (text) => {
                        const solver = new CaesarBruteForce(language);
                        return await solver.solve(text);
                    }
                });
                strategies.push({
                    name: 'Autokey',
                    execute: async (text) => {
                        const solver = new AutokeySolver(language);
                        return await solver.solve(text);
                    }
                });
                strategies.push({
                    name: 'Hill Climbing',
                    execute: async (text) => {
                        const solver = new SubstitutionStrategy(language);
                        return await solver.solve(text, 'hillclimb');
                    }
                });
                break;
        }
        
        return strategies;
    }
}

