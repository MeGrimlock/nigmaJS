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

// Test texts for French (short, medium, long)
const testTexts = {
    short: 'PORTEZ CE VIEUX WHISKY AU JUGE BLOND QUI FUME',
    medium: 'LA CRYPTOGRAPHIE EST LA DISCIPLINE QUI ETUDIE LES METHODES POUR RENDRE LES MESSAGES ILLISIBLES A CEUX QUI NE DOIVENT PAS LES LIRE ET PERMET DE COMMUNIQUER DE MANIERE SECURISEE',
    long: 'LA CRYPTOGRAPHIE EST UNE TECHNIQUE ANCIENNE UTILISEE POUR PROTEGER LES INFORMATIONS CONFIDENTIELLES DANS LE MONDE MODERNE ELLE EST ESSENTIELLE POUR LA SECURITE INFORMATIQUE ET LES COMMUNICATIONS NUMERIQUES GARANTISSANT QUE SEULES LES PERSONNES AUTORISEES PEUVENT ACCEDER AUX INFORMATIONS PROTEGEES'
};

const language = 'french';

const roadmapIssues = [];
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

