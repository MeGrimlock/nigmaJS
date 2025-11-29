import { Orchestrator } from '../../orchestrator.js';
import { CipherIdentifier } from '../../../analysis/identifier.js';
import { verifyOrchestratorResult } from '../orchestrator/orchestrator-test-base.js';

/**
 * Common test utilities shared between Phase 2 and Orchestrator tests
 * 
 * This module provides unified functions for common test patterns:
 * - Encrypt-decrypt-verify flow
 * - Dictionary setup
 * - Result verification
 * - Test configuration
 */

/**
 * Common test flow: Encrypt → Decrypt → Verify
 * 
 * This encapsulates the most common test pattern used in both Phase 2 and Orchestrator tests.
 * 
 * @param {Object} params - Test parameters
 * @param {string} params.plaintext - Plaintext to encrypt
 * @param {string} params.language - Language for orchestrator
 * @param {Function} params.encryptFn - Function that takes (plaintext, language) and returns ciphertext
 * @param {Object} params.orchestratorOptions - Options for orchestrator.autoDecrypt()
 * @param {Object} params.verificationOptions - Options for verifyOrchestratorResult()
 * @param {boolean} params.detectCipher - Whether to detect cipher type (default: false)
 * @returns {Promise<Object>} { orchestrator, result, ciphertext, detection }
 */
export async function runCipherTest({
    plaintext,
    language,
    encryptFn,
    orchestratorOptions = { tryMultiple: true, maxTime: 60000 },
    verificationOptions = {},
    detectCipher = false
}) {
    // 1. Encrypt
    const ciphertext = encryptFn(plaintext, language);
    
    // 2. Create orchestrator
    const orchestrator = new Orchestrator(language);
    
    // 3. Detect cipher type (optional)
    let detection = null;
    if (detectCipher) {
        detection = await CipherIdentifier.identify(ciphertext, language);
    }
    
    // 4. Decrypt
    const result = await orchestrator.autoDecrypt(ciphertext, orchestratorOptions);
    
    // 5. Verify basic result structure
    verifyOrchestratorResult(result, verificationOptions);
    
    return {
        orchestrator,
        result,
        ciphertext,
        detection,
        plaintext
    };
}

/**
 * Setup test environment (dictionaries, etc.)
 * 
 * @param {Array<string>} languages - Languages to load dictionaries for
 * @returns {Promise<Object>} Loaded dictionaries
 */
export async function setupTestEnvironment(languages = ['english']) {
    // Import dynamically to avoid circular dependencies
    const { loadDictionariesForTests } = await import('../phase2/phase2-test-helpers.js');
    const dictionaries = await loadDictionariesForTests();
    // Return only requested languages if specified
    if (languages.length > 0 && languages[0] !== 'english') {
        const filtered = {};
        for (const lang of languages) {
            if (dictionaries[lang]) {
                filtered[lang] = dictionaries[lang];
            }
        }
        return Object.keys(filtered).length > 0 ? filtered : dictionaries;
    }
    return dictionaries;
}

/**
 * Create a test matrix: cipher × language × textLength
 * 
 * This is a unified version that can be used by both Phase 2 and Orchestrator tests.
 * 
 * @param {Object} params - Test matrix parameters
 * @param {string|Array<string>} params.cipherName - Cipher name(s) to test
 * @param {Function|Object} params.encryptFn - Encryption function or object with create() method
 * @param {Array<string>} params.languages - Languages to test
 * @param {Array<string>} params.textLengths - Text lengths to test (default: ['medium'])
 * @param {Object} params.options - Test options
 * @returns {Array<Object>} Array of test configurations
 */
export function createTestMatrix({
    cipherName,
    encryptFn,
    languages = ['english'],
    textLengths = ['medium'],
    options = {}
}) {
    const ciphers = Array.isArray(cipherName) ? cipherName : [cipherName];
    const tests = [];
    
    ciphers.forEach(cipher => {
        languages.forEach(language => {
            textLengths.forEach(textLength => {
                tests.push({
                    cipherName: cipher,
                    language,
                    textLength,
                    encryptFn: typeof encryptFn === 'function' 
                        ? encryptFn 
                        : (plaintext, lang) => {
                            const cipherInstance = encryptFn.create(plaintext, lang);
                            return cipherInstance.encode();
                        },
                    options
                });
            });
        });
    });
    
    return tests;
}

/**
 * Get test configuration based on test type
 * 
 * @param {string} testType - Type of test ('phase2', 'orchestrator', 'e2e')
 * @returns {Object} Configuration object
 */
export function getTestConfig(testType = 'orchestrator') {
    const configs = {
        phase2: {
            timeout: 20000,
            orchestratorOptions: {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 10000
            },
            detectCipher: true
        },
        orchestrator: {
            timeout: 60000,
            orchestratorOptions: {
                tryMultiple: true,
                maxTime: 60000
            },
            detectCipher: false
        },
        e2e: {
            timeout: 120000,
            orchestratorOptions: {
                tryMultiple: true,
                useDictionary: true,
                maxTime: 60000
            },
            detectCipher: true
        }
    };
    
    return configs[testType] || configs.orchestrator;
}

/**
 * Verify decryption result with different levels of detail
 * 
 * @param {Object} result - Result from orchestrator.autoDecrypt()
 * @param {string} level - Verification level ('basic', 'detailed', 'full')
 * @param {Object} options - Additional verification options
 */
export function verifyDecryptionResult(result, level = 'basic', options = {}) {
    const { verifyOrchestratorResult } = require('../orchestrator/orchestrator-test-base.js');
    
    switch(level) {
        case 'basic':
            verifyOrchestratorResult(result, options);
            break;
            
        case 'detailed':
            verifyOrchestratorResult(result, options);
            // Additional checks can be added here
            if (options.expectedMethod) {
                const pattern = typeof options.expectedMethod === 'string' 
                    ? new RegExp(options.expectedMethod) 
                    : options.expectedMethod;
                expect(result.method).toMatch(pattern);
            }
            break;
            
        case 'full':
            // Phase 2 style: full analysis
            verifyOrchestratorResult(result, options);
            // Full analysis would be done by Phase 2 helpers
            break;
            
        default:
            verifyOrchestratorResult(result, options);
    }
}

