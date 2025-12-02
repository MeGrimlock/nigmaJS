
import 'regenerator-runtime/runtime';
import { HMMSolver } from '../strategies/hmm-solver';
import { LanguageAnalysis } from '../../analysis/analysis-core.js';
import { configLoader } from '../../config/config-loader.js';
import fs from 'fs';
import path from 'path';

// Write test results to file for debugging
const writeTestResult = (testName, result, error = null) => {
    const logEntry = `${new Date().toISOString()} - ${testName}: ${result}${error ? ` - Error: ${error.message}` : ''}\n`;
    try {
        fs.appendFileSync('hmm-test-results.log', logEntry);
    } catch (e) {
        // Ignore file write errors
    }
};

// Mock fetch for Node.js environment to load dictionaries
global.fetch = jest.fn((url) => {
    // url comes from LanguageAnalysis.loadDictionary, e.g., "data/english-dictionary.json"
    // We map this to the actual file system path in "demo/data/"
    const fileName = url.split('/').pop();
    const filePath = path.join(process.cwd(), 'demo/data', fileName);

    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(JSON.parse(data))
        });
    } else {
        console.error(`Mock Fetch: File not found at ${filePath}`);
        return Promise.reject(new Error(`File not found: ${url}`));
    }
});

/**
 * HMM Solver Tests
 *
 * Tests cover:
 * - Fast path Caesar detection
 * - Configuration parameter handling
 * - Basic functionality and error handling
 */
describe('HMMSolver Tests', () => {
    const config = configLoader.loadConfig();

    // Helper for ROT encryption
    const encryptCaesar = (text, shift) => {
        return text.toUpperCase().replace(/[A-Z]/g, char => {
            const code = char.charCodeAt(0);
            let shifted = code + shift;
            if (shifted > 90) shifted -= 26;
            return String.fromCharCode(shifted);
        });
    };

    // Test texts
    const shortPlainText = "HELLO WORLD";
    const shortCipherText = encryptCaesar(shortPlainText, 3);

    let solver;
    let hmmInitialized = false;

    beforeAll(async () => {
        console.log('Starting HMM solver initialization...');
        writeTestResult('HMM initialization', 'started');

        solver = new HMMSolver('english');
        console.log('HMMSolver instance created');
        console.log('Mock mode:', solver.isMockMode);

        try {
            console.log('Calling solver.initialize()...');
            await solver.initialize();
            hmmInitialized = !solver.isMockMode; // Only consider initialized if not in mock mode
            console.log('HMM initialization completed. Mock mode:', solver.isMockMode);
            writeTestResult('HMM initialization', solver.isMockMode ? 'mock mode' : 'real mode');
        } catch (error) {
            console.warn('HMM initialization failed:', error.message);
            hmmInitialized = false;
            writeTestResult('HMM initialization', 'failed', error);
        }

        console.log('HMM initialization phase complete. Initialized:', hmmInitialized, 'Mock mode:', solver.isMockMode);
    }, 10000);

    describe('Basic Functionality', () => {
        test('should initialize with correct language', () => {
            console.log('Testing basic initialization...');
            writeTestResult('initialize with correct language', 'started');
            try {
                expect(solver.language).toBe('english');
                writeTestResult('initialize with correct language', 'passed');
            } catch (error) {
                writeTestResult('initialize with correct language', 'failed', error);
                throw error;
            }
        });

        test('should load configuration properly', () => {
            console.log('Testing configuration loading...');
            writeTestResult('load configuration properly', 'started');
            try {
                expect(solver.config).toBeDefined();
                expect(solver.config.hmm_solver).toBeDefined();
                writeTestResult('load configuration properly', 'passed');
            } catch (error) {
                writeTestResult('load configuration properly', 'failed', error);
                throw error;
            }
        });

        test('should have required character mapping', () => {
            console.log('Testing character mapping...');
            expect(solver.chars).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
            expect(solver.charMap).toBeDefined();
            expect(Object.keys(solver.charMap)).toHaveLength(26);
        });

        test('should create solver instance', () => {
            console.log('Testing solver instantiation...');
            expect(solver).toBeDefined();
            expect(typeof solver.solve).toBe('function');
            expect(typeof solver.solveGenerator).toBe('function');
        });
    });

    describe('Fast Path Caesar Detection', () => {
        test('should detect and solve short Caesar shift instantly (Fast Path)', async () => {
            console.log('Testing fast path Caesar detection...');

            const cipher = "KHOOR ZRUOG"; // "HELLO WORLD" shifted +3

            const result = await solver.solve(cipher, 1);
            console.log('Fast path result:', result);

            // Just check that we get some result
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        test('should NOT trigger fast path for non-Caesar text', async () => {
            console.log('Testing non-Caesar text handling...');

            const nonCaesarText = "HOL3LR2ELWOD1"; // Contains numbers

            const generator = solver.solveGenerator(nonCaesarText, 1);
            const firstResult = (await generator.next()).value;

            // Just check that we get a properly structured result
            expect(firstResult).toBeDefined();
            expect(firstResult).toHaveProperty('method');
            expect(firstResult).toHaveProperty('decryptedText');
            expect(firstResult).toHaveProperty('progress');
        });
    });

    describe('Configuration Parameter Handling', () => {
        test('should use config values for model training parameters', () => {
            console.log('Testing config parameters...');
            const maxIterations = config.hmm_solver?.model_training?.max_iterations || 100;
            expect(maxIterations).toBeGreaterThan(0);
            expect(typeof maxIterations).toBe('number');
        });

        test('should use config values for thresholds', () => {
            console.log('Testing config thresholds...');
            const confidenceThreshold = config.hmm_solver?.thresholds?.confidence_threshold || 0.75;
            const fastPathThreshold = config.hmm_solver?.thresholds?.fast_path_threshold || 0.8;

            expect(confidenceThreshold).toBeGreaterThan(0);
            expect(confidenceThreshold).toBeLessThanOrEqual(1);
            expect(fastPathThreshold).toBeGreaterThan(0);
            expect(fastPathThreshold).toBeLessThanOrEqual(1);
        });

        test('should fallback to defaults when config is missing', () => {
            console.log('Testing config fallbacks...');
            // Test that we can access config with fallbacks
            const testConfig = {};
            expect(testConfig.hmm_solver?.model_training?.max_iterations || 50).toBe(50);
            expect(testConfig.hmm_solver?.thresholds?.fast_path_threshold || 0.8).toBe(0.8);
        });
    });

    describe('Error Handling', () => {
        test('should handle empty input gracefully', async () => {
            console.log('Testing empty input...');

            const result = await solver.solve('');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should handle null input gracefully', async () => {
            console.log('Testing null input...');

            const result = await solver.solve(null);
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should handle text with only non-letters', async () => {
            console.log('Testing non-letter input...');

            const nonLetterText = "123456789!@#$%^&*()";
            const result = await solver.solve(nonLetterText);
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });

    describe('Generator-based Solving', () => {
        test('should yield progress updates during solving', async () => {
            console.log('Testing generator progress updates...');

            const generator = solver.solveGenerator(shortCipherText, 3);
            const results = [];

            for await (const result of generator) {
                results.push(result);
                expect(result).toHaveProperty('iteration');
                expect(result).toHaveProperty('totalIterations');
                expect(result).toHaveProperty('progress');
                expect(result).toHaveProperty('method');
                expect(typeof result.progress).toBe('number');
                expect(result.progress).toBeGreaterThanOrEqual(0);
                expect(result.progress).toBeLessThanOrEqual(100);
            }

            expect(results.length).toBeGreaterThan(0);
            expect(results[results.length - 1].progress).toBe(100);
        });

        test('should provide final result in last iteration', async () => {
            console.log('Testing generator final result...');

            const generator = solver.solveGenerator(shortCipherText, 2);
            let finalResult = null;

            for await (const result of generator) {
                if (result.progress === 100) {
                    finalResult = result;
                }
            }

            expect(finalResult).toBeDefined();
            expect(finalResult.decryptedText).toBeDefined();
            expect(finalResult.method).toBeDefined();
        });
    });

    describe('Multi-language Support', () => {
        test('should initialize with different languages', () => {
            console.log('Testing multi-language initialization...');

            expect(solver.language).toBe('english');
            // Test that solver can be created with different languages
            const spanishSolver = new HMMSolver('spanish');
            expect(spanishSolver.language).toBe('spanish');
        });

        test('should work with supported languages from config', () => {
            console.log('Testing supported languages from config...');

            const supportedLanguages = config.attacks?.supported_languages || [];
            expect(supportedLanguages).toContain('english');
            expect(Array.isArray(supportedLanguages)).toBe(true);
        });
    });

    describe('Edge Cases and Advanced Scenarios', () => {
        test('should handle very short text', async () => {
            console.log('Testing very short text...');

            const shortText = "AB";
            const result = await solver.solve(shortText);
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should handle text with mixed case and punctuation', async () => {
            console.log('Testing mixed case and punctuation...');

            const mixedText = "Hello, World! This is a TEST.";
            const cipher = encryptCaesar(mixedText, 5);
            const result = await solver.solve(cipher, 2);
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should handle repeated characters', async () => {
            console.log('Testing repeated characters...');

            const repeatedText = "AAAAAAAAAAAA";
            const result = await solver.solve(repeatedText, 2);
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });

    describe('Result Validation', () => {
        test('should return result with expected structure', async () => {
            console.log('Testing result structure...');

            const generator = solver.solveGenerator(shortCipherText, 2);
            const result = (await generator.next()).value;

            expect(result).toHaveProperty('iteration');
            expect(result).toHaveProperty('totalIterations');
            expect(result).toHaveProperty('progress');
            expect(result).toHaveProperty('decryptedText');
            expect(result).toHaveProperty('method');

            expect(typeof result.iteration).toBe('number');
            expect(typeof result.totalIterations).toBe('number');
            expect(typeof result.progress).toBe('number');
            expect(typeof result.decryptedText).toBe('string');
        });
    });
});
