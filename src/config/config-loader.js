import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Configuration Loader
 * 
 * Loads and provides access to configuration values from YAML files.
 * This allows dynamic tuning of thresholds and values without code changes.
 */
class ConfigLoader {
    constructor() {
        this.config = null;
        this.configPath = null;
    }

    /**
     * Loads configuration from YAML file.
     * @param {string} configPath - Path to YAML config file (relative to project root or absolute)
     * @returns {Object} Configuration object
     */
    loadConfig(configPath = null) {
        if (this.config && !configPath) {
            return this.config; // Return cached config
        }

        // Default config path
        if (!configPath) {
            // Try multiple possible locations (relative to process.cwd())
            const possiblePaths = [
                path.join(process.cwd(), 'config', 'detection-thresholds.yaml'),
                path.join(process.cwd(), 'src', 'config', 'detection-thresholds.yaml'),
                path.resolve(__dirname || process.cwd(), 'config', 'detection-thresholds.yaml'),
                path.resolve(__dirname || process.cwd(), '../../config', 'detection-thresholds.yaml'),
                path.resolve(__dirname || process.cwd(), '../../../config', 'detection-thresholds.yaml')
            ];

            for (const p of possiblePaths) {
                try {
                    if (fs.existsSync(p)) {
                        configPath = p;
                        break;
                    }
                } catch (e) {
                    // Continue to next path
                }
            }

            if (!configPath) {
                console.warn('[ConfigLoader] Config file not found, using defaults');
                return this.getDefaultConfig();
            }
        }

        try {
            const fileContents = fs.readFileSync(configPath, 'utf8');
            this.config = yaml.load(fileContents);
            this.configPath = configPath;
            console.log(`[ConfigLoader] Loaded config from: ${configPath}`);
            return this.config;
        } catch (error) {
            console.warn(`[ConfigLoader] Failed to load config from ${configPath}:`, error.message);
            return this.getDefaultConfig();
        }
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
                    short: 0.8,
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
            cipher_identifier: {
                caesar_test: {
                    // Thresholds for detecting Caesar cipher
                    primary_threshold: {
                        score: 0.6,
                        improvement: 0.15
                    },
                    secondary_threshold: {
                        score: 0.4,
                        improvement: 0.08
                    },
                    minimum_threshold: {
                        score: 0.3,
                        improvement: 0.05
                    },
                    // Score multipliers
                    primary_multiplier: 2.2,
                    secondary_multiplier: 1.5,
                    // Score penalties for other cipher types
                    vigenere_penalty: 1.8,
                    transposition_penalty: 1.8,
                    monoalphabetic_boost: 1.3
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
            }
        };
    }

    /**
     * Gets a configuration value using dot notation (e.g., 'language_detection.text_length.very_short').
     * @param {string} path - Dot-notation path to config value
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value or default
     */
    get(path, defaultValue = null) {
        if (!this.config) {
            this.loadConfig();
        }

        const keys = path.split('.');
        let value = this.config;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value !== undefined ? value : defaultValue;
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
     * Reloads configuration from file.
     */
    reload() {
        this.config = null;
        this.loadConfig(this.configPath);
    }
}

// Export singleton instance
export const configLoader = new ConfigLoader();
export default configLoader;
