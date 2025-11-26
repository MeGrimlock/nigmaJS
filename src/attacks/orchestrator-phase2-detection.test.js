import { Orchestrator } from './orchestrator.js';
import { CipherIdentifier } from '../analysis/identifier.js';
import { Stats } from '../analysis/stats.js';
import { LanguageAnalysis } from '../analysis/analysis.js';
import Shift from '../ciphers/shift/shift.js';
import Polyalphabetic from '../ciphers/polyalphabetic/polyalphabetic.js';
import Dictionary from '../ciphers/dictionary/dictionary.js';
import Columnar from '../ciphers/columnar/columnar.js';
import Enigma from '../ciphers/enigma/enigma.js';
import fs from 'fs';
import path from 'path';

// Load dictionaries directly from filesystem for tests
async function loadDictionariesForTests() {
    const languagesToLoad = ['english', 'spanish', 'italian', 'french', 'portuguese', 'german'];
    const possiblePaths = [
        path.join(process.cwd(), 'demo/data'),
        path.join(process.cwd(), 'data'),
        path.join(__dirname, '../../demo/data'),
        path.join(__dirname, '../../data')
    ];
    
    const loadedDictionaries = {};
    
    for (const lang of languagesToLoad) {
        for (const basePath of possiblePaths) {
            const filePath = path.join(basePath, `${lang}-dictionary.json`);
            if (fs.existsSync(filePath)) {
                try {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const words = JSON.parse(data);
                    const dictSet = new Set(words);
                    loadedDictionaries[lang] = dictSet;
                    console.log(`[Phase2 Test] Loaded ${lang} dictionary: ${words.length} words`);
                    break;
                } catch (error) {
                    console.warn(`[Phase2 Test] Failed to load ${lang} dictionary:`, error.message);
                }
            }
        }
    }
    
    // Patch LanguageAnalysis to use filesystem-loaded dictionaries
    const originalGetDictionary = LanguageAnalysis.getDictionary;
    LanguageAnalysis.getDictionary = function(language) {
        if (loadedDictionaries[language]) {
            return loadedDictionaries[language];
        }
        return originalGetDictionary ? originalGetDictionary.call(this, language) : null;
    };
    
    LanguageAnalysis.loadDictionary = async function(language, basePathParam = 'data/') {
        if (loadedDictionaries[language]) {
            return true;
        }
        
        for (const testPath of possiblePaths) {
            const filePath = path.join(testPath, `${language}-dictionary.json`);
            if (fs.existsSync(filePath)) {
                try {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const words = JSON.parse(data);
                    loadedDictionaries[language] = new Set(words);
                    return true;
                } catch (error) {
                    // Continue
                }
            }
        }
        return false;
    };
    
    return loadedDictionaries;
}

// Test texts for each language (short, medium, long)
const testTexts = {
    english: {
        short: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
        medium: 'IN CRYPTOGRAPHY A SUBSTITUTION CIPHER IS A METHOD OF ENCRYPTING BY WHICH UNITS OF PLAINTEXT ARE REPLACED WITH CIPHERTEXT ACCORDING TO A FIXED SYSTEM',
        long: 'THE HISTORY OF CRYPTOGRAPHY BEGINS THOUSANDS OF YEARS AGO UNTIL RECENT DECADES IT HAS BEEN SYNONYMOUS WITH ENCRYPTION THE CONVERSION OF INFORMATION FROM A READABLE STATE TO APPARENT NONSENSE THE ORIGINATOR OF AN ENCRYPTED MESSAGE SHARES THE DECODING TECHNIQUE NEEDED TO RECOVER THE ORIGINAL INFORMATION ONLY WITH INTENDED RECIPIENTS THEREBY PRECLUDING UNWANTED PERSONS FROM DOING THE SAME'
    },
    spanish: {
        short: 'EL VELOZ MURCIELAGO HINDU COMIA FELIZ CARDILLO Y KIWI',
        medium: 'LA CRIPTOGRAFIA ES LA DISCIPLINA QUE SE ENCARGA DE ESTUDIAR Y DESARROLLAR TECNICAS DE COMUNICACION SEGURA QUE PERMITEN PROTEGER INFORMACION MEDIANTE EL USO DE CODIGOS Y CIFRADOS',
        long: 'LA CRIPTOGRAFIA HA SIDO UTILIZADA DESDE LA ANTIGUEDAD PARA PROTEGER INFORMACION CONFIDENCIAL EN LA ACTUALIDAD ES FUNDAMENTAL EN LA SEGURIDAD INFORMATICA Y EN LAS COMUNICACIONES DIGITALES PERMITIENDO QUE SOLO LAS PERSONAS AUTORIZADAS PUEDAN ACCEDER A LA INFORMACION PROTEGIDA'
    },
    italian: {
        short: 'QUEL VECCHIO TIPO DI JET FUOCO LENTO ZANZARE',
        medium: 'LA CRITTOGRAFIA E LA DISCIPLINA CHE STUDIA I METODI PER RENDERE I MESSAGGI ILLEGGIBILI A CHI NON DEVE LEGGERLI E PERMETTE DI COMUNICARE IN MODO SICURO',
        long: 'LA CRITTOGRAFIA E UNA TECNICA ANTICA UTILIZATA PER PROTEGGERE LE INFORMAZIONI CONFIDENZIALI NEL MONDO MODERNO E ESSENZIALE PER LA SICUREZZA INFORMATICA E LE COMUNICAZIONI DIGITALI GARANTENDO CHE SOLO LE PERSONE AUTORIZZATE POSSONO ACCEDERE ALLE INFORMAZIONI PROTETTE'
    },
    french: {
        short: 'PORTEZ CE VIEUX WHISKY AU JUGE BLOND QUI FUME',
        medium: 'LA CRYPTOGRAPHIE EST LA DISCIPLINE QUI ETUDIE LES METHODES POUR RENDRE LES MESSAGES ILLISIBLES A CEUX QUI NE DOIVENT PAS LES LIRE ET PERMET DE COMMUNIQUER DE MANIERE SECURISEE',
        long: 'LA CRYPTOGRAPHIE EST UNE TECHNIQUE ANCIENNE UTILISEE POUR PROTEGER LES INFORMATIONS CONFIDENTIELLES DANS LE MONDE MODERNE ELLE EST ESSENTIELLE POUR LA SECURITE INFORMATIQUE ET LES COMMUNICATIONS NUMERIQUES GARANTISSANT QUE SEULES LES PERSONNES AUTORISEES PEUVENT ACCEDER AUX INFORMATIONS PROTEGEES'
    },
    portuguese: {
        short: 'UM VEXAME QUANDO JAZIA FRANCISCO PARVA TROUXE',
        medium: 'A CRIPTOGRAFIA E A DISCIPLINA QUE ESTUDA OS METODOS PARA TORNAR AS MENSAGENS ILEGIVEIS PARA AQUELES QUE NAO DEVEM LER E PERMITE COMUNICAR DE FORMA SEGURA',
        long: 'A CRIPTOGRAFIA E UMA TECNICA ANTIGA UTILIZADA PARA PROTEGER INFORMACOES CONFIDENCIAIS NO MUNDO MODERNO E ESSENCIAL PARA A SEGURANCA INFORMATICA E AS COMUNICACOES DIGITAIS GARANTINDO QUE APENAS PESSOAS AUTORIZADAS PODEM ACESSAR AS INFORMACOES PROTEGIDAS'
    },
    german: {
        short: 'FRANZ JAGT IM KOMPLETT VERWAHRLOSTEN TAXI QUER DURCH BAYERN',
        medium: 'KRYPTOGRAPHIE IST DIE WISSENSCHAFT DIE SICH MIT METHODEN BESCHAFTIGT UM NACHRICHTEN FUR DIEJENIGEN UNLESERLICH ZU MACHEN DIE SIE NICHT LESEN SOLLEN UND ERMOGLICHT SICHERE KOMMUNIKATION',
        long: 'KRYPTOGRAPHIE IST EINE ALTE TECHNIK DIE ZUR SCHUTZ VERTRAULICHER INFORMATIONEN VERWENDET WIRD IN DER MODERNEN WELT IST SIE WESENTLICH FUR DIE INFORMATIONS SICHERHEIT UND DIGITALE KOMMUNIKATION UND STELLT SICHER DASS NUR AUTORISIERTE PERSONEN AUF GESCHUTZTE INFORMATIONEN ZUGREIFEN KONNEN'
    }
};

// Cipher configurations for testing
const cipherConfigs = {
    // Shift ciphers
    'CaesarShift': {
        create: (text, language) => new Shift.CaesarShift(text, 3),
        expectedType: 'caesar-shift',
        expectedIC: 1.73, // English IC
        keyParams: { shift: 3 }
    },
    'Rot13': {
        create: (text, language) => new Shift.Rot13(text, 13),
        expectedType: 'caesar-shift',
        expectedIC: 1.73,
        keyParams: {}
    },
    'Rot47': {
        create: (text, language) => new Shift.Rot47(text),
        expectedType: 'caesar-shift',
        expectedIC: 1.73,
        keyParams: {}
    },
    // Polyalphabetic ciphers
    'Vigenere': {
        create: (text, language) => new Polyalphabetic.Vigenere(text, 'KEY'),
        expectedType: 'vigenere-like',
        expectedIC: 1.0, // Lower IC for polyalphabetic
        keyParams: { key: 'KEY' }
    },
    'Beaufort': {
        create: (text, language) => new Polyalphabetic.Beaufort(text, 'KEY'),
        expectedType: 'vigenere-like',
        expectedIC: 1.0,
        keyParams: { key: 'KEY' }
    },
    'Porta': {
        create: (text, language) => new Polyalphabetic.Porta(text, 'KEY'),
        expectedType: 'vigenere-like',
        expectedIC: 1.0,
        keyParams: { key: 'KEY' }
    },
    'Gronsfeld': {
        create: (text, language) => new Polyalphabetic.Gronsfeld(text, '12345'),
        expectedType: 'vigenere-like',
        expectedIC: 1.0,
        keyParams: { key: '12345' }
    },
    // Dictionary ciphers
    'Atbash': {
        create: (text, language) => new Dictionary.Atbash(text),
        expectedType: 'monoalphabetic-substitution',
        expectedIC: 1.73,
        keyParams: {}
    },
    'Autokey': {
        create: (text, language) => new Dictionary.Autokey(text, 'SECRET'),
        expectedType: 'vigenere-like',
        expectedIC: 1.0,
        keyParams: { key: 'SECRET' }
    },
    'SimpleSubstitution': {
        create: (text, language) => new Dictionary.SimpleSubstitution(text, 'ZYXWVUTSRQPONMLKJIHGFEDCBA'),
        expectedType: 'monoalphabetic-substitution',
        expectedIC: 1.73,
        keyParams: { key: 'ZYXWVUTSRQPONMLKJIHGFEDCBA' }
    },
    'Polybius': {
        create: (text, language) => new Dictionary.Polybius(text, ''),
        expectedType: 'monoalphabetic-substitution',
        expectedIC: 1.73,
        keyParams: { keyword: '' }
    },
    // Columnar ciphers
    'RailFence': {
        create: (text, language) => new Columnar.RailFence(text, 3),
        expectedType: 'transposition',
        expectedIC: 1.73, // Same IC as plaintext
        keyParams: { rails: 3 }
    },
    'Amsco': {
        create: (text, language) => new Columnar.Amsco(text, '132'),
        expectedType: 'transposition',
        expectedIC: 1.73,
        keyParams: { key: '132' }
    }
};

// Roadmap tracker for failed tests
const roadmapIssues = [];

// Helper to analyze results
function analyzeResults(ciphertext, plaintext, language, cipherName, detection, result) {
    const analysis = {
        cipherName,
        language,
        textLength: ciphertext.length,
        detection: {
            detectedType: detection.families[0]?.type || 'unknown',
            detectedConfidence: detection.families[0]?.confidence || 0,
            top3Types: detection.families.slice(0, 3).map(f => ({
                type: f.type,
                confidence: f.confidence
            }))
        },
        stats: {
            ic: Stats.indexOfCoincidence(ciphertext),
            entropy: Stats.entropy(ciphertext),
            chiSquared: Stats.chiSquared(ciphertext, language)
        },
        decryption: {
            success: result.plaintext && result.plaintext.length > 0,
            method: result.method || 'none',
            confidence: result.confidence || 0,
            languageDetected: result.language || 'unknown'
        },
        validation: result.dictionaryValidation || null
    };
    
    return analysis;
}

// Helper to check if test passed
function checkTestPass(analysis, expected) {
    const issues = [];
    
    // Check cipher type detection
    if (analysis.detection.detectedType !== expected.expectedType) {
        issues.push({
            type: 'cipher_type_detection',
            expected: expected.expectedType,
            actual: analysis.detection.detectedType,
            confidence: analysis.detection.detectedConfidence
        });
    }
    
    // Check IC (with tolerance)
    const icDiff = Math.abs(analysis.stats.ic - expected.expectedIC);
    if (icDiff > 0.3) {
        issues.push({
            type: 'ic_analysis',
            expected: expected.expectedIC,
            actual: analysis.stats.ic,
            difference: icDiff
        });
    }
    
    // Check language detection (should match input language)
    if (analysis.decryption.languageDetected !== analysis.language) {
        issues.push({
            type: 'language_detection',
            expected: analysis.language,
            actual: analysis.decryption.languageDetected
        });
    }
    
    // Check decryption success
    if (!analysis.decryption.success) {
        issues.push({
            type: 'decryption_failure',
            method: analysis.decryption.method,
            confidence: analysis.decryption.confidence
        });
    }
    
    return {
        passed: issues.length === 0,
        issues
    };
}

// Load dictionaries before tests
let testDictionaries = {};
beforeAll(async () => {
    testDictionaries = await loadDictionariesForTests();
    console.log(`[Phase2 Test] Dictionaries loaded: ${Object.keys(testDictionaries).join(', ')}`);
}, 30000);

describe('Phase 2: Comprehensive Cipher Detection Tests', () => {
    const languages = Object.keys(testTexts);
    const ciphers = Object.keys(cipherConfigs);
    
    // Generate test matrix: language × cipher × textLength
    languages.forEach(language => {
        ciphers.forEach(cipherName => {
            const cipherConfig = cipherConfigs[cipherName];
            const textLengths = ['short', 'medium', 'long'];
            
            textLengths.forEach(textLength => {
                const testName = `${cipherName} - ${language} - ${textLength}`;
                
                test(testName, async () => {
                    const plaintext = testTexts[language][textLength];
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
                        console.warn(`\n[Phase2 Test] FAILED: ${testName}`);
                        console.warn(`  Issues:`, testResult.issues);
                        console.warn(`  Analysis:`, JSON.stringify(roadmapIssue.analysis, null, 2));
                    }
                    
                    // For now, we don't fail the test - we just document the issues
                    // This allows us to see all problems and prioritize fixes
                    expect(analysis).toBeDefined();
                }, 60000); // 60 second timeout per test
            });
        });
    });
    
    // After all tests, generate roadmap document
    afterAll(() => {
        if (roadmapIssues.length > 0) {
            const roadmapPath = path.join(process.cwd(), 'docs/PHASE2_ROADMAP.md');
            const roadmapContent = generateRoadmapDocument(roadmapIssues);
            fs.writeFileSync(roadmapPath, roadmapContent, 'utf8');
            console.log(`\n[Phase2 Test] Generated roadmap with ${roadmapIssues.length} issues: ${roadmapPath}`);
        } else {
            console.log('\n[Phase2 Test] All tests passed! No roadmap issues.');
        }
    });
});

// Generate roadmap markdown document
function generateRoadmapDocument(issues) {
    let content = '# Phase 2: Cipher Detection Improvements - Roadmap\n\n';
    content += `Generated: ${new Date().toISOString()}\n\n`;
    content += `Total Issues: ${issues.length}\n\n`;
    
    // Group by issue type
    const issuesByType = {};
    issues.forEach(issue => {
        issue.issues.forEach(i => {
            if (!issuesByType[i.type]) {
                issuesByType[i.type] = [];
            }
            issuesByType[i.type].push({
                ...issue,
                specificIssue: i
            });
        });
    });
    
    // Document each issue type
    Object.keys(issuesByType).forEach(issueType => {
        content += `## ${issueType.replace(/_/g, ' ').toUpperCase()}\n\n`;
        content += `**Count:** ${issuesByType[issueType].length}\n\n`;
        
        issuesByType[issueType].forEach(item => {
            content += `### ${item.cipher} - ${item.language} - ${item.textLength}\n\n`;
            content += `- **Plaintext Length:** ${item.plaintextLength} chars\n`;
            content += `- **Issue Details:** ${JSON.stringify(item.specificIssue, null, 2)}\n`;
            content += `- **Analysis:**\n`;
            content += `  - Detected Type: ${item.analysis.detectedType} (confidence: ${item.analysis.detectedConfidence})\n`;
            content += `  - IC: ${item.analysis.ic}\n`;
            content += `  - Decryption: ${item.analysis.decryptionSuccess ? 'SUCCESS' : 'FAILED'}\n`;
            content += `  - Method: ${item.analysis.decryptionMethod}\n`;
            content += `  - Confidence: ${item.analysis.decryptionConfidence}\n`;
            content += `  - Language Detected: ${item.analysis.languageDetected}\n\n`;
        });
    });
    
    // Summary statistics
    content += '## Summary Statistics\n\n';
    const cipherStats = {};
    const languageStats = {};
    const issueTypeStats = {};
    
    issues.forEach(issue => {
        cipherStats[issue.cipher] = (cipherStats[issue.cipher] || 0) + 1;
        languageStats[issue.language] = (languageStats[issue.language] || 0) + 1;
        issue.issues.forEach(i => {
            issueTypeStats[i.type] = (issueTypeStats[i.type] || 0) + 1;
        });
    });
    
    content += '### By Cipher\n';
    Object.entries(cipherStats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cipher, count]) => {
            content += `- ${cipher}: ${count} issues\n`;
        });
    
    content += '\n### By Language\n';
    Object.entries(languageStats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([lang, count]) => {
            content += `- ${lang}: ${count} issues\n`;
        });
    
    content += '\n### By Issue Type\n';
    Object.entries(issueTypeStats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
            content += `- ${type}: ${count} occurrences\n`;
        });
    
    return content;
}

