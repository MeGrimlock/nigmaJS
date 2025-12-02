// Dynamic imports for Node.js compatibility
let fs, path, yaml;
try {
    if (typeof require !== 'undefined') {
        fs = require('fs');
        path = require('path');
        yaml = require('js-yaml');
    }
} catch (e) {
    // Browser environment - modules not available
}

/**
 * Configuration Loader - Browser Compatible
 *
 * Provides configuration values with browser-compatible defaults.
 * In the browser, we use embedded defaults instead of loading YAML files.
 */
class ConfigLoader {
    constructor() {
        this.config = null;
        this.isBrowser = typeof window !== 'undefined';
    }

    /**
     * Loads configuration - browser-safe version
     * @param {string} configPath - Not used in browser
     * @returns {Object} Configuration object
     */
    loadConfig(configPath = null) {
        if (this.config) {
            return this.config; // Return cached config
        }

        if (this.isBrowser) {
            console.log('[ConfigLoader] Using browser-compatible embedded config');
            this.config = this.getDefaultConfig();
            return this.config;
        }

        // Node.js environment - try to load from files (legacy support)
        if (!this.isBrowser && fs && path && yaml) {
            try {
                const configDir = path.join(process.cwd(), 'config');
                const configFiles = [];

                const expectedFiles = ['detection-thresholds.yaml', 'attacks-config.yaml'];

                if (fs.existsSync(configDir)) {
                    for (const filename of expectedFiles) {
                        const filePath = path.join(configDir, filename);
                        if (fs.existsSync(filePath)) {
                            configFiles.push(filePath);
                        }
                    }
                }

                if (configFiles.length > 0) {
                    let mergedConfig = {};
                    for (const filePath of configFiles) {
                        const fileContents = fs.readFileSync(filePath, 'utf8');
                        const fileConfig = yaml.load(fileContents) || {};
                        mergedConfig = this.deepMerge(mergedConfig, fileConfig);
                    }
                    this.config = mergedConfig;
                    return this.config;
                }
            } catch (error) {
                console.warn('[ConfigLoader] File loading failed, using defaults:', error.message);
            }
        }

        this.config = this.getDefaultConfig();
        return this.config;
    }

    /**
     * Browser-compatible file finder (returns empty array)
     * @returns {Array<string>} Always empty in browser
     */
    findConfigFiles() {
        return []; // No file loading in browser
    }

    /**
     * Deep merges two objects.
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Gets default configuration (fallback if YAML not available).
     * @returns {Object} Default configuration
     */
    getDefaultConfig() {
        return {
            language_detection: {
                text_length: {
                    very_short: 50,
                    short: 100,
                    medium: 200,
                    long: 200
                },
                weights: {
                    chi_squared: {
                        monogram: { very_short: 0.3, short: 0.4, medium: 0.5, long: 0.5 },
                        bigram: { very_short: 2.0, short: 2.5, medium: 3.0, long: 3.0 }
                    },
                    shape_score: {
                        monogram: { very_short: 0.3, short: 0.4, medium: 0.5, long: 0.5 },
                        bigram: { very_short: 2.0, short: 2.5, medium: 3.0, long: 3.0 },
                        trigram: { very_short: 1.0, short: 1.5, medium: 2.0, long: 2.0 },
                        quadgram: { very_short: 0.5, short: 0.75, medium: 1.0, long: 1.0 }
                    }
                },
                ioc: {
                    weight: { very_short: 20, short: 35, medium: 50, long: 50 }
                },
                dictionary: {
                    weight_multiplier: { very_short: 2.0, short: 1.5, medium: 1.2, long: 1.0 },
                    min_word_length: 2,
                    min_score_for_bonus: 0.2,
                    bonus_multiplier: 50,
                    cross_validation: {
                        significant_difference: 0.2,
                        bonus: -30,
                        penalty: 30
                    },
                    low_score_penalty: { very_short: 150, short: 100, medium: 50, long: 0 },
                    low_score_threshold: 0.1,
                    bonuses: {
                        length_bonus_max: 0.3,
                        length_bonus_divisor: 8,
                        short_text_bonus: 0.2,
                        short_text_max_words: 3
                    }
                },
                plaintext_redetection: {
                    confident_score_threshold: 250,
                    min_score_difference: 100,
                    min_dict_validation: 0.3
                }
            },
            ic_analysis: {
                tolerance: {
                    very_short: Infinity,
                    short: 0.6881599015328204,
                    medium: 0.5,
                    long: 0.3
                },
                tolerance_percent: {
                    very_short: 50,  // 50% for very short texts - high variance
                    short: 30,       // 30% for short texts
                    medium: 20,      // 20% for medium texts
                    long: 10         // 10% for long texts
                },
                expected_values: {
                    english: 1.73,
                    french: 2.02,
                    german: 2.05,
                    italian: 1.94,
                    portuguese: 1.94,
                    spanish: 1.94,
                    russian: 1.76,
                    chinese: 0.0
                }
            },
            language_detection: {
                penalization_factors: {
                    latin_languages: 0.6  // French, Italian, Portuguese penalty
                },
                ambiguity: {
                    difference_threshold: 0.05,  // 5% difference threshold
                    preference_threshold: 0.98   // 98% score threshold for preference
                },
                supported_languages: ['english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'russian', 'chinese']
            },
            // Language-specific cipher identification parameters
            // Optimized via Genetic Algorithm for each language
            cipher_identifier_by_language: {
                english: {
                    caesar_test: {
                        primary_threshold: {
                            score: 0.8242247046591749,
                            improvement: 0.18551096570624753
                        },
                        secondary_threshold: {
                            score: 0.4872059889598983,
                            improvement: 0.08
                        },
                        minimum_threshold: {
                            score: 0.3,
                            improvement: 0.05
                        },
                        primary_multiplier: 2.2,
                        secondary_multiplier: 1.5,
                        vigenere_penalty: 2.1926582806256496,
                        transposition_penalty: 1.8,
                        monoalphabetic_boost: 1.5194079184753928
                    }
                },
                spanish: {
                    caesar_test: {
                        // TODO: Run optimizer with Spanish dataset to get optimal values
                        // For now, using English values as baseline
                        primary_threshold: {
                            score: 0.82,
                            improvement: 0.19
                        },
                        secondary_threshold: {
                            score: 0.49,
                            improvement: 0.08
                        },
                        minimum_threshold: {
                            score: 0.3,
                            improvement: 0.05
                        },
                        primary_multiplier: 2.2,
                        secondary_multiplier: 1.5,
                        vigenere_penalty: 2.2,
                        transposition_penalty: 1.8,
                        monoalphabetic_boost: 1.5
                    }
                },
                // Fallback groups for unsupported languages
                _fallback_latin: 'spanish',  // French, Italian, Portuguese → Spanish params
                _fallback_default: 'english' // All others → English params
            },
            // Legacy: Global defaults (used if language-specific not found)
            cipher_identifier: {
                caesar_test: {
                    primary_threshold: {
                        score: 0.82,
                        improvement: 0.19
                    },
                    secondary_threshold: {
                        score: 0.49,
                        improvement: 0.08
                    },
                    minimum_threshold: {
                        score: 0.3,
                        improvement: 0.05
                    },
                    primary_multiplier: 2.2,
                    secondary_multiplier: 1.5,
                    vigenere_penalty: 2.2,
                    transposition_penalty: 1.8,
                    monoalphabetic_boost: 1.5
                },
                text_categories: {
                    short_threshold: 50
                },
                confidence_thresholds: {
                    minimum_family_score: 0.2,
                    random_unknown_fallback: 0.7
                }
            },
            periodic_analysis: {
                analyze: {
                    minimum_text_length: 10
                },
                periodic_ic: {
                    minimum_column_length: 5,
                    use_normalized_ic: false,
                    max_period: 20,
                    min_period: 1
                },
                repetition_score: {
                    minimum_text_length: 3,
                    minimum_run_length: 3
                },
                variance_threshold: 0.1,
                peak_threshold: 0.08
            },
            short_text_patterns: {
                score: {
                    minimum_text_length: 3,
                    minimum_word_length: 2
                },
                symmetry_analysis: {
                    minimum_length: 6,
                    symmetry_threshold: 1
                }
            },
            stop_words: {},
            stop_words_scoring: {
                weight: 0.3,
                min_count: 1,
                bonus_per_word: 20
            },

            // Attacks Module Default Configuration
            attacks: {
                supported_languages: ['english', 'spanish', 'french', 'german', 'italian', 'portuguese'],
                timeouts: {
                    max_total_time: 120000,
                    max_solver_time: 30000,
                    max_orchestrator_time: 60000
                },
                limits: {
                    max_text_length: 10000,
                    max_dictionary_words: 50000,
                    max_candidates: 100
                }
            },

            orchestrator: {
                language_detection: {
                    enabled: true,
                    max_languages: 3,
                    confidence_threshold: 0.6
                },
                strategy_selection: {
                    max_strategies: 5,
                    parallel_execution: true,
                    early_termination: true
                },
                result_aggregation: {
                    min_confidence_threshold: 0.7,
                    max_results: 3,
                    include_alternatives: true
                }
            },

            caesar_brute_force: {
                scoring: {
                    ngram_order: 4,
                    use_dictionary: true,
                    dictionary_weight: 0.3
                },
                limits: {
                    min_text_length: 3,
                    max_shift_range: 26
                },
                thresholds: {
                    confidence_threshold: 0.8,
                    word_coverage_threshold: 0.4
                }
            },

            vigenere_solver: {
                key_length_detection: {
                    max_key_length: 20,
                    min_key_length: 2,
                    candidates_per_length: 5,
                    ioc_target: 1.73
                },
                key_finding: {
                    hill_climb_iterations: 1000,
                    dictionary_validation: true,
                    segment_validation: true
                },
                thresholds: {
                    confidence_threshold: 0.75,
                    min_ngram_score: -3.0
                }
            },

            atbash_solver: {
                scoring: {
                    ngram_order: 4,
                    use_dictionary: true
                },
                thresholds: {
                    confidence_threshold: 0.8,
                    score_threshold: -2.5
                }
            },

            baconian_solver: {
                pattern_detection: {
                    min_text_length: 5,
                    max_pattern_length: 100
                },
                scoring: {
                    ngram_order: 3,
                    use_dictionary: true
                },
                thresholds: {
                    confidence_threshold: 0.6,
                    word_coverage_threshold: 0.3
                }
            },

            rot47_brute_force: {
                character_ranges: {
                    ascii_start: 33,
                    ascii_end: 126,
                    range_size: 94
                },
                scoring: {
                    ngram_order: 3,
                    use_dictionary: true
                },
                thresholds: {
                    confidence_threshold: 0.7,
                    ascii_coverage_threshold: 0.8
                }
            },

            polyalphabetic_solvers: {
                key_validation: {
                    min_key_length: 2,
                    max_key_length: 20,
                    dictionary_check: true
                },
                scoring: {
                    ngram_order: 4,
                    use_dictionary: true,
                    partial_key_scoring: true
                },
                thresholds: {
                    confidence_threshold: 0.75,
                    key_validation_threshold: 0.5
                }
            },

            railfence_solver: {
                rails: {
                    min_rails: 2,
                    max_rails: 10
                },
                scoring: {
                    ngram_order: 3,
                    use_dictionary: true
                },
                thresholds: {
                    confidence_threshold: 0.7
                }
            },

            amsco_solver: {
                period_detection: {
                    min_period: 2,
                    max_period: 20
                },
                scoring: {
                    ngram_order: 3,
                    use_dictionary: true
                },
                thresholds: {
                    confidence_threshold: 0.6
                }
            },

            autokey_solver: {
                key_search: {
                    max_key_candidates: 100,
                    progressive_key: true
                },
                scoring: {
                    ngram_order: 4,
                    use_dictionary: true
                },
                thresholds: {
                    confidence_threshold: 0.7
                }
            },

            polybius_solver: {
                alphabet_detection: {
                    standard_alphabet: "ABCDEFGHIKLMNOPQRSTUVWXYZ",
                    detect_custom: true
                },
                scoring: {
                    ngram_order: 3,
                    use_dictionary: true
                },
                thresholds: {
                    confidence_threshold: 0.6
                }
            },

            hmm_solver: {
                model_training: {
                    max_iterations: 100,
                    convergence_threshold: 0.001,
                    use_fast_path: true
                },
                language_model: {
                    ngram_order: 3,
                    smoothing_factor: 0.1
                },
                thresholds: {
                    confidence_threshold: 0.75,
                    fast_path_threshold: 0.8
                }
            },

            substitution_strategy: {
                hill_climbing: {
                    max_iterations: 2000,
                    restart_count: 10,
                    temperature_schedule: "exponential"
                },
                scoring: {
                    ngram_order: 4,
                    use_dictionary: true
                },
                thresholds: {
                    confidence_threshold: 0.8,
                    improvement_threshold: 0.01
                }
            },

            vigenere_strategy: {
                key_length_detection: {
                    max_key_length: 15,
                    statistical_methods: true,
                    dictionary_methods: true
                },
                key_finding: {
                    hill_climb_iterations: 1000,
                    dictionary_validation: true
                },
                thresholds: {
                    confidence_threshold: 0.75
                }
            },

            benchmarking: {
                enabled: true,
                metrics: {
                    collect_solver_times: true,
                    collect_confidence_scores: true,
                    collect_failure_reasons: true
                },
                reporting: {
                    summary_report: true,
                    detailed_report: false,
                    export_format: "json"
                }
            },

            debug: {
                enabled: false,
                log_level: "warn",
                log_solver_progress: false,
                log_orchestrator_steps: false
            },

            test_config: {
                default_timeout: 30000,
                stress_test_enabled: false,
                benchmark_tests: true
            }
        };
    }

    /**
     * Gets language-specific cipher identifier configuration with intelligent fallback.
     * @param {string} language - Language code (e.g., 'english', 'spanish', 'french')
     * @param {string} configSection - Section to retrieve (e.g., 'caesar_test')
     * @returns {Object} Language-specific configuration
     */
    getLanguageSpecificConfig(language, configSection = 'caesar_test') {
        if (!this.config) {
            this.loadConfig();
        }

        const byLanguage = this.config.cipher_identifier_by_language || {};

        // Direct match
        if (byLanguage[language] && byLanguage[language][configSection]) {
            return byLanguage[language][configSection];
        }

        // Fallback for Latin-based languages
        const latinLanguages = ['french', 'italian', 'portuguese', 'catalan', 'romanian'];
        if (latinLanguages.includes(language)) {
            const fallbackLang = byLanguage._fallback_latin || 'spanish';
            if (byLanguage[fallbackLang] && byLanguage[fallbackLang][configSection]) {
                return byLanguage[fallbackLang][configSection];
            }
        }

        // Default fallback
        const defaultLang = byLanguage._fallback_default || 'english';
        if (byLanguage[defaultLang] && byLanguage[defaultLang][configSection]) {
            return byLanguage[defaultLang][configSection];
        }

        // Ultimate fallback: global cipher_identifier config
        if (this.config.cipher_identifier && this.config.cipher_identifier[configSection]) {
            return this.config.cipher_identifier[configSection];
        }

        return {};
    }

    /**
     * Gets a configuration value using dot notation (e.g., 'language_detection.text_length.very_short').
     * @param {string} path - Dot-notation path to config value
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value or default
     */
    get(path, defaultValue = null) {
        try {
            if (!this.config) {
                this.loadConfig();
            }

            if (!path || typeof path !== 'string') {
                return defaultValue;
            }

            const keys = path.split('.');
            let value = this.config;

            for (const key of keys) {
                if (value && typeof value === 'object' && !Array.isArray(value) && key in value) {
                    value = value[key];
                } else {
                    return defaultValue;
                }
            }

            return value !== undefined ? value : defaultValue;
        } catch (error) {
            console.warn(`[ConfigLoader] Error getting config path "${path}":`, error.message);
            return defaultValue;
        }
    }

    /**
     * Gets text length category for a given text length.
     * @param {number} length - Text length in characters
     * @returns {string} Category: 'very_short', 'short', 'medium', or 'long'
     */
    getTextLengthCategory(length) {
        if (!this.config) {
            this.loadConfig();
        }

        const thresholds = this.get('language_detection.text_length', {});

        if (length < (thresholds.very_short || 50)) return 'very_short';
        if (length < (thresholds.short || 100)) return 'short';
        if (length < (thresholds.medium || 200)) return 'medium';
        return 'long';
    }

    /**
     * Reloads configuration from file (no-op in browser).
     */
    reload() {
        if (this.isBrowser) {
            // In browser, just reset to defaults
            this.config = null;
            this.loadConfig();
        } else {
            // In Node.js, try to reload from files
            this.config = null;
            this.loadConfig(this.configPath);
        }
    }
}

// Export singleton instance
export const configLoader = new ConfigLoader();
export default configLoader;
