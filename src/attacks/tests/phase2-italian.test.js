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

// Test texts for Italian (short, medium, long)
const testTexts = {
    short: 'QUEL VECCHIO TIPO DI JET FUOCO LENTO ZANZARE',
    medium: 'LA CRITTOGRAFIA E LA DISCIPLINA CHE STUDIA I METODI PER RENDERE I MESSAGGI ILLEGGIBILI A CHI NON DEVE LEGGERLI E PERMETTE DI COMUNICARE IN MODO SICURO',
    long: 'LA CRITTOGRAFIA E UNA TECNICA ANTICA UTILIZATA PER PROTEGGERE LE INFORMAZIONI CONFIDENZIALI NEL MONDO MODERNO E ESSENZIALE PER LA SICUREZZA INFORMATICA E LE COMUNICAZIONI DIGITALI GARANTENDO CHE SOLO LE PERSONE AUTORIZZATE POSSONO ACCEDERE ALLE INFORMAZIONI PROTETTE'
};

const language = 'italian';

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
    
    ciphers.forEach(cipherName => {
        const cipherConfig = cipherConfigs[cipherName];
        
        textLengths.forEach(textLength => {
            const testName = `${cipherName} - ${textLength}`;
            
            test(testName, async () => {
                const plaintext = testTexts[textLength];
                const cipher = cipherConfig.create(plaintext, language);
                const ciphertext = cipher.encode();
                
                const orchestrator = new Orchestrator('auto');
                const detection = await CipherIdentifier.identify(ciphertext, language);
                const result = await orchestrator.autoDecrypt(ciphertext, {
                    tryMultiple: true,
                    useDictionary: true,
                    maxTime: 30000
                });
                
                const analysis = analyzeResults(ciphertext, plaintext, language, cipherName, detection, result);
                const testResult = checkTestPass(analysis, cipherConfig);
                
                if (!testResult.passed) {
                    roadmapIssues.push({
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
                    });
                    
                    console.warn(`\n[Phase2 Test - ${language}] FAILED: ${testName}`);
                    console.warn(`  Issues:`, testResult.issues);
                }
                
                expect(analysis).toBeDefined();
            }, 60000);
        });
    });
    
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

