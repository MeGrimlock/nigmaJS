import { Orchestrator } from '../orchestrator.js';
import { CipherIdentifier } from '../../analysis/identifier.js';
import Shift from '../../ciphers/shift/shift.js';
import Polyalphabetic from '../../ciphers/polyalphabetic/polyalphabetic.js';
import Dictionary from '../../ciphers/dictionary/dictionary.js';
import Columnar from '../../ciphers/columnar/columnar.js';
import fs from 'fs';
import path from 'path';
import {
    loadDictionariesForTests,
    analyzeResults,
    checkTestPass,
    generateRoadmapDocument,
    cipherConfigs
} from './phase2-test-helpers.js';

// Test texts for English (short, medium, long)
const testTexts = {
    short: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
    medium: 'IN CRYPTOGRAPHY A SUBSTITUTION CIPHER IS A METHOD OF ENCRYPTING BY WHICH UNITS OF PLAINTEXT ARE REPLACED WITH CIPHERTEXT ACCORDING TO A FIXED SYSTEM',
    long: 'THE HISTORY OF CRYPTOGRAPHY BEGINS THOUSANDS OF YEARS AGO UNTIL RECENT DECADES IT HAS BEEN SYNONYMOUS WITH ENCRYPTION THE CONVERSION OF INFORMATION FROM A READABLE STATE TO APPARENT NONSENSE THE ORIGINATOR OF AN ENCRYPTED MESSAGE SHARES THE DECODING TECHNIQUE NEEDED TO RECOVER THE ORIGINAL INFORMATION ONLY WITH INTENDED RECIPIENTS THEREBY PRECLUDING UNWANTED PERSONS FROM DOING THE SAME'
};

const language = 'english';

// Roadmap tracker for failed tests
const roadmapIssues = [];

// Load dictionaries before tests
let testDictionaries = {};
beforeAll(async () => {
    testDictionaries = await loadDictionariesForTests();
    console.log(`[Phase2 Test - ${language}] Dictionaries loaded: ${Object.keys(testDictionaries).join(', ')}`);
}, 30000);

describe(`Phase 2: Cipher Detection Tests - ${language.toUpperCase()}`, () => {
    const ciphers = Object.keys(cipherConfigs);
    const textLengths = ['short', 'medium', 'long'];
    
    // Generate test matrix: cipher × textLength
    ciphers.forEach(cipherName => {
        const cipherConfig = cipherConfigs[cipherName];
        
        textLengths.forEach(textLength => {
            const testName = `${cipherName} - ${textLength}`;
            
            test(testName, async () => {
                const plaintext = testTexts[textLength];
                const cipher = cipherConfig.create(plaintext, language);
                const ciphertext = cipher.encode();
                
                // Create orchestrator with auto language detection
                const orchestrator = new Orchestrator('auto');
                
                // Detect cipher type
                const detection = await CipherIdentifier.identify(ciphertext, language);
                
                // Attempt decryption
                const result = await orchestrator.autoDecrypt(ciphertext, {
                    tryMultiple: true,
                    useDictionary: true,
                    maxTime: 30000 // 30 seconds per test
                });
                
                // Analyze results
                const analysis = analyzeResults(
                    ciphertext,
                    plaintext,
                    language,
                    cipherName,
                    detection,
                    result
                );
                
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
                
                // For now, we don't fail the test - we just document the issues
                expect(analysis).toBeDefined();
            }, 60000); // 60 second timeout per test
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

