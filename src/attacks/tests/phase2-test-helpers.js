import { Orchestrator } from '../orchestrator.js';
import { CipherIdentifier } from '../../analysis/identifier.js';
import { Stats } from '../../analysis/stats.js';
import { LanguageAnalysis } from '../../analysis/analysis.js';
import Shift from '../../ciphers/shift/shift.js';
import Polyalphabetic from '../../ciphers/polyalphabetic/polyalphabetic.js';
import Dictionary from '../../ciphers/dictionary/dictionary.js';
import Columnar from '../../ciphers/columnar/columnar.js';
import fs from 'fs';
import path from 'path';

// Load dictionaries directly from filesystem for tests
export async function loadDictionariesForTests() {
    const languagesToLoad = ['english', 'spanish', 'italian', 'french', 'portuguese', 'german'];
    const possiblePaths = [
        path.join(process.cwd(), 'demo/data'),
        path.join(process.cwd(), 'data'),
        path.join(__dirname, '../../../demo/data'),
        path.join(__dirname, '../../../data')
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

// Helper to analyze results
export function analyzeResults(ciphertext, plaintext, language, cipherName, detection, result) {
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
            chiSquared: null // Stats.chiSquared not available, use chiSquaredWithDictionary if needed
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
export function checkTestPass(analysis, expected) {
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

// Generate roadmap markdown document
export function generateRoadmapDocument(issues, language) {
    let content = `# Phase 2: Cipher Detection Improvements - Roadmap (${language})\n\n`;
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
            content += `### ${item.cipher} - ${item.textLength}\n\n`;
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
    const issueTypeStats = {};
    
    issues.forEach(issue => {
        cipherStats[issue.cipher] = (cipherStats[issue.cipher] || 0) + 1;
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
    
    content += '\n### By Issue Type\n';
    Object.entries(issueTypeStats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
            content += `- ${type}: ${count} occurrences\n`;
        });
    
    return content;
}

// Cipher configurations for testing
export const cipherConfigs = {
    // Shift ciphers
    'CaesarShift': {
        create: (text, language) => new Shift.CaesarShift(text, 3),
        expectedType: 'caesar-shift',
        expectedIC: 1.73,
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
        expectedIC: 1.0,
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
        expectedIC: 1.73,
        keyParams: { rails: 3 }
    },
    'Amsco': {
        create: (text, language) => new Columnar.Amsco(text, '132'),
        expectedType: 'transposition',
        expectedIC: 1.73,
        keyParams: { key: '132' }
    }
};

