import { Orchestrator } from '../../orchestrator.js';
import { CipherIdentifier } from '../../../analysis/identifier.js';
import fs from 'fs';
import path from 'path';
import {
    analyzeResults,
    checkTestPass,
    generateRoadmapDocument,
    cipherConfigs
} from './phase2-test-helpers.js';
import { setupTestEnvironment, runCipherTest, getTestConfig } from '../common/test-common.js';

/**
 * Base test suite for Phase 2 cipher detection tests.
 * This function sets up and runs tests for a specific language.
 * 
 * @param {string} language - The language code (e.g., 'english', 'spanish')
 * @param {Object} testTexts - Object with 'short', 'medium', and 'long' test texts
 */
export function createPhase2TestSuite(language, testTexts) {
    // Roadmap tracker for failed tests
    const roadmapIssues = [];

    describe(`Phase 2: Cipher Detection Tests - ${language.toUpperCase()}`, () => {
        // Load dictionaries before tests using common setup
        let testDictionaries = {};
        beforeAll(async () => {
            testDictionaries = await setupTestEnvironment([language]);
            console.log(`[Phase2 Test - ${language}] Dictionaries loaded: ${Object.keys(testDictionaries).join(', ')}`);
        }, 30000);
        const ciphers = Object.keys(cipherConfigs);
        const textLengths = ['short', 'medium', 'long'];
        
        // Generate test matrix: cipher × textLength
        ciphers.forEach(cipherName => {
            const cipherConfig = cipherConfigs[cipherName];
            
            textLengths.forEach(textLength => {
                const testName = `${cipherName} - ${textLength}`;
                
                test(testName, async () => {
                    try {
                        const plaintext = testTexts[textLength];
                        
                        // Get Phase 2 test config
                        const config = getTestConfig('phase2');
                        
                        // Use common test flow: encrypt → decrypt → verify
                        const { orchestrator, result, ciphertext, detection } = await runCipherTest({
                            plaintext,
                            language,
                            encryptFn: (pt, lang) => {
                                const cipher = cipherConfig.create(pt, lang);
                                return cipher.encode();
                            },
                            orchestratorOptions: config.orchestratorOptions,
                            verificationOptions: {},
                            detectCipher: config.detectCipher
                        });
                        
                        // Verify detection was created
                        expect(detection).toBeDefined();
                        expect(detection.families).toBeInstanceOf(Array);
                        
                        // Verify result is defined
                        if (!result) {
                            throw new Error(`Orchestrator returned undefined result for ${testName}`);
                        }
                        
                        // Analyze results
                        const analysis = analyzeResults(
                            ciphertext,
                            plaintext,
                            language,
                            cipherName,
                            detection,
                            result
                        );
                        
                        // Verify analysis was created
                        if (!analysis) {
                            throw new Error(`analyzeResults returned undefined for ${testName}`);
                        }
                        
                        // Check if test passed
                        const testResult = checkTestPass(analysis, cipherConfig);
                        
                        // If test failed, add to roadmap
                        if (!testResult.passed) {
                            const roadmapIssue = {
                                cipher: cipherName,
                                language: language,
                                textLength: textLength,
                                plaintextLength: plaintext.length,
                                issues: testResult.issues,
                                analysis: {
                                    detectedType: analysis.detection.detectedType,
                                    detectedConfidence: analysis.detection.detectedConfidence,
                                    ic: analysis.stats.ic,
                                    decryptionSuccess: analysis.decryption.success,
                                    decryptionMethod: analysis.decryption.method,
                                    decryptionConfidence: analysis.decryption.confidence,
                                    languageDetected: analysis.decryption.languageDetected
                                },
                                timestamp: new Date().toISOString()
                            };
                            
                            roadmapIssues.push(roadmapIssue);
                            
                            // Log failure details
                            console.warn(`\n[Phase2 Test - ${language}] FAILED: ${testName}`);
                            console.warn(`  Issues:`, testResult.issues);
                        }
                        
                        // Verify analysis was created successfully
                        expect(analysis).toBeDefined();
                        expect(analysis.cipherName).toBe(cipherName);
                        expect(analysis.language).toBe(language);
                        expect(analysis.detection).toBeDefined();
                        expect(analysis.stats).toBeDefined();
                        expect(analysis.decryption).toBeDefined();
                        
                        // CRITICAL: Test fails if decryption was not successful
                        // This is the main objective of the test - to verify the system can decrypt the message
                        expect(analysis.decryption.success).toBe(true);
                        
                        // Also verify that test passed all validations
                        // This ensures cipher type detection, IC analysis, and language detection are correct
                        expect(testResult.passed).toBe(true);
                    } catch (error) {
                        console.error(`[Phase2 Test - ${language}] ERROR in ${testName}:`, error);
                        console.error(`  Error stack:`, error.stack);
                        // Re-throw to fail the test and show the actual error
                        throw error;
                    }
                }, 20000); // 20 second timeout per test (reduced from 60)
            });
        });
        
        // After all tests, generate roadmap document
        afterAll(() => {
            if (roadmapIssues.length > 0) {
                const roadmapPath = path.join(process.cwd(), `docs/PHASE2_ROADMAP_${language.toUpperCase()}.md`);
                const roadmapContent = generateRoadmapDocument(roadmapIssues, language);
                fs.writeFileSync(roadmapPath, roadmapContent, 'utf8');
                console.log(`\n[Phase2 Test - ${language}] Generated roadmap with ${roadmapIssues.length} issues: ${roadmapPath}`);
            } else {
                console.log(`\n[Phase2 Test - ${language}] All tests passed! No roadmap issues.`);
            }
        });
    });
}

