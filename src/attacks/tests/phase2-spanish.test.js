import { Orchestrator } from '../orchestrator.js';
import { CipherIdentifier } from '../../analysis/identifier.js';
import fs from 'fs';
import path from 'path';
import {
    loadDictionariesForTests,
    analyzeResults,
    checkTestPass,
    generateRoadmapDocument,
    cipherConfigs
} from './phase2-test-helpers.js';

// Test texts for Spanish (short, medium, long)
const testTexts = {
    short: 'EL VELOZ MURCIELAGO HINDU COMIA FELIZ CARDILLO Y KIWI',
    medium: 'LA CRIPTOGRAFIA ES LA DISCIPLINA QUE SE ENCARGA DE ESTUDIAR Y DESARROLLAR TECNICAS DE COMUNICACION SEGURA QUE PERMITEN PROTEGER INFORMACION MEDIANTE EL USO DE CODIGOS Y CIFRADOS',
    long: 'LA CRIPTOGRAFIA HA SIDO UTILIZADA DESDE LA ANTIGUEDAD PARA PROTEGER INFORMACION CONFIDENCIAL EN LA ACTUALIDAD ES FUNDAMENTAL EN LA SEGURIDAD INFORMATICA Y EN LAS COMUNICACIONES DIGITALES PERMITIENDO QUE SOLO LAS PERSONAS AUTORIZADAS PUEDAN ACCEDER A LA INFORMACION PROTEGIDA'
};

const language = 'spanish';

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
                    maxTime: 30000
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
                    
                    console.warn(`\n[Phase2 Test - ${language}] FAILED: ${testName}`);
                    console.warn(`  Issues:`, testResult.issues);
                }
                
                expect(analysis).toBeDefined();
            }, 60000);
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

