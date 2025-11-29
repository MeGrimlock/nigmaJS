import { Orchestrator } from '../../orchestrator.js';
import { CipherIdentifier } from '../../../analysis/identifier.js';
import { getTestTexts as getCommonTestTexts } from '../common/test-texts.js';
import { setupTestEnvironment, runCipherTest, getTestConfig } from '../common/test-common.js';

/**
 * Base test suite for Orchestrator tests
 * 
 * This module provides reusable functions to create orchestrator tests
 * with common patterns, reducing code duplication across test files.
 */

/**
 * Helper function to clean text for comparison (removes punctuation, normalizes case)
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text (uppercase, letters only)
 */
export function cleanText(text) {
    return text.toUpperCase().replace(/[^A-Z]/g, '');
}

/**
 * Helper function to check if texts match (allowing for minor differences)
 * @param {string} result - Decrypted text
 * @param {string} expected - Expected plaintext
 * @param {number} threshold - Similarity threshold (0-1, default 0.95)
 * @returns {boolean} True if texts match within threshold
 */
export function textsMatch(result, expected, threshold = 0.95) {
    const cleanResult = cleanText(result);
    const cleanExpected = cleanText(expected);
    
    if (cleanResult === cleanExpected) return true;
    
    // Check similarity (simple character-by-character comparison)
    const longer = cleanResult.length > cleanExpected.length ? cleanResult : cleanExpected;
    const shorter = cleanResult.length > cleanExpected.length ? cleanExpected : cleanResult;
    
    if (longer.length === 0) return true;
    
    // Simple similarity check: count matching characters
    let matches = 0;
    const minLen = Math.min(cleanResult.length, cleanExpected.length);
    for (let i = 0; i < minLen; i++) {
        if (cleanResult[i] === cleanExpected[i]) matches++;
    }
    
    const similarity = matches / longer.length;
    return similarity >= threshold;
}

/**
 * Helper function to verify basic orchestrator result structure
 * @param {Object} result - Result from orchestrator.autoDecrypt
 * @param {Object} options - Verification options
 * @param {boolean} options.requirePlaintext - Require plaintext to be defined (default: true)
 * @param {boolean} options.requireMethod - Require method to be defined (default: true)
 * @param {boolean} options.requireConfidence - Require confidence > 0 (default: true)
 * @param {number} options.minConfidence - Minimum confidence threshold (default: 0)
 * @param {boolean} options.requireCipherType - Require cipherType to be defined (default: true)
 * @param {boolean} options.requireScore - Require score to be defined (default: false)
 */
export function verifyOrchestratorResult(result, options = {}) {
    const {
        requirePlaintext = true,
        requireMethod = true,
        requireConfidence = true,
        minConfidence = 0,
        requireCipherType = true,
        requireScore = false
    } = options;
    
    if (requirePlaintext) {
        expect(result.plaintext).toBeDefined();
        expect(result.plaintext.length).toBeGreaterThan(0);
    }
    
    if (requireMethod) {
        expect(result.method).toBeDefined();
        expect(typeof result.method).toBe('string');
    }
    
    if (requireConfidence) {
        expect(result.confidence).toBeDefined();
        expect(result.confidence).toBeGreaterThanOrEqual(minConfidence);
        expect(result.confidence).toBeLessThanOrEqual(1);
    }
    
    if (requireCipherType) {
        expect(result.cipherType).toBeDefined();
    }
    
    if (requireScore) {
        expect(result.score).toBeDefined();
        expect(typeof result.score).toBe('number');
    }
}

/**
 * Helper function to verify E2E test results (language, cipher detection, decryption)
 * @param {Object} orchestrator - Orchestrator instance
 * @param {string} expectedLanguage - Expected detected language
 * @param {string} ciphertext - Ciphertext to analyze
 * @param {Object} result - Result from orchestrator.autoDecrypt
 * @param {string} expectedPlaintext - Expected plaintext
 * @param {Object} options - Verification options
 * @param {RegExp|string} options.expectedMethod - Expected method pattern (default: any)
 * @param {RegExp|string} options.expectedCipherType - Expected cipher type pattern (default: any)
 * @param {number} options.minConfidence - Minimum confidence (default: 0.7)
 * @param {boolean} options.verifyLanguage - Verify language detection (default: true)
 * @param {boolean} options.verifyCipherDetection - Verify cipher detection (default: true)
 * @param {boolean} options.verifyPlaintext - Verify plaintext matches (default: true)
 */
export async function verifyE2EResult(orchestrator, expectedLanguage, ciphertext, result, expectedPlaintext, options = {}) {
    const {
        expectedMethod = null,
        expectedCipherType = null,
        minConfidence = 0.7,
        verifyLanguage = true,
        verifyCipherDetection = true,
        verifyPlaintext = true
    } = options;
    
    // Verify language detection
    if (verifyLanguage) {
        expect(orchestrator.language).toBe(expectedLanguage);
    }
    
    // Verify cipher detection
    if (verifyCipherDetection) {
        const detection = await CipherIdentifier.identify(ciphertext, orchestrator.language);
        const detectedType = detection.families[0].type;
        
        if (expectedCipherType) {
            const pattern = typeof expectedCipherType === 'string' 
                ? new RegExp(expectedCipherType) 
                : expectedCipherType;
            expect(detectedType).toMatch(pattern);
        }
    }
    
    // Verify decryption result
    expect(result).toBeDefined();
    
    if (expectedMethod) {
        const pattern = typeof expectedMethod === 'string' 
            ? new RegExp(expectedMethod) 
            : expectedMethod;
        expect(result.method).toMatch(pattern);
    }
    
    expect(result.confidence).toBeGreaterThanOrEqual(minConfidence);
    
    // Verify plaintext matches
    if (verifyPlaintext && expectedPlaintext) {
        expect(textsMatch(result.plaintext, expectedPlaintext)).toBe(true);
    }
    
    return {
        language: orchestrator.language,
        cipherType: result.cipherType,
        method: result.method,
        confidence: result.confidence
    };
}

/**
 * Creates a test suite for a specific cipher type across multiple languages
 * @param {string} cipherName - Name of the cipher (for test descriptions)
 * @param {Function} encryptFn - Function that takes (plaintext, language) and returns ciphertext
 * @param {Array<string>} languages - Array of languages to test
 * @param {Object} options - Test options
 * @param {number} options.timeout - Test timeout in ms (default: 120000)
 * @param {Object} options.orchestratorOptions - Options to pass to orchestrator.autoDecrypt
 * @param {Object} options.verificationOptions - Options for verifyOrchestratorResult
 */
export function createCipherTestSuite(cipherName, encryptFn, languages = ['english'], options = {}) {
    const {
        timeout = 120000,
        orchestratorOptions = { tryMultiple: true, maxTime: 60000 },
        verificationOptions = {}
    } = options;
    
    // Get test config for orchestrator tests
    const config = getTestConfig('orchestrator');
    const finalOrchestratorOptions = { ...config.orchestratorOptions, ...orchestratorOptions };
    
    describe(`${cipherName} Cipher`, () => {
        languages.forEach(language => {
            it(`should decrypt ${cipherName} in ${language}`, async () => {
                // Get test text (default to medium length)
                const testTexts = getTestTexts();
                const plaintext = testTexts[language]?.medium || testTexts.english.medium;
                
                // Use common test flow
                const { result } = await runCipherTest({
                    plaintext,
                    language,
                    encryptFn,
                    orchestratorOptions: finalOrchestratorOptions,
                    verificationOptions,
                    detectCipher: false
                });
                
                // Log result
                console.log(`[${language}] ${cipherName}: Method=${result.method}, Score=${result.score?.toFixed(2) || 'N/A'}, Confidence=${result.confidence.toFixed(2)}`);
            }, timeout);
        });
    });
}

/**
 * Creates an E2E test for a specific cipher
 * @param {string} testName - Name of the test
 * @param {string} language - Language of the plaintext
 * @param {string} plaintext - Plaintext to encrypt
 * @param {Function} encryptFn - Function that takes plaintext and returns ciphertext
 * @param {Object} options - Test options
 * @param {number} options.timeout - Test timeout in ms (default: 120000)
 * @param {Object} options.orchestratorOptions - Options to pass to orchestrator.autoDecrypt
 * @param {Object} options.verificationOptions - Options for verifyE2EResult
 */
export function createE2ETest(testName, language, plaintext, encryptFn, options = {}) {
    const {
        timeout = 120000,
        orchestratorOptions = { tryMultiple: true, useDictionary: true, maxTime: 60000 },
        verificationOptions = {}
    } = options;
    
    test(testName, async () => {
        // Encrypt
        const ciphertext = encryptFn(plaintext);
        
        // Decrypt with auto language detection
        const orchestrator = new Orchestrator('auto');
        const result = await orchestrator.autoDecrypt(ciphertext, orchestratorOptions);
        
        // Verify E2E result
        await verifyE2EResult(
            orchestrator,
            language,
            ciphertext,
            result,
            plaintext,
            verificationOptions
        );
        
        // Log success
        console.log(`✓ ${testName}: Language=${orchestrator.language}, Method=${result.method}, Confidence=${(result.confidence * 100).toFixed(0)}%`);
    }, timeout);
}

/**
 * Creates a test suite for text length variations
 * @param {string} cipherName - Name of the cipher
 * @param {Function} encryptFn - Function that takes plaintext and returns ciphertext
 * @param {string} language - Language to test
 * @param {Object} options - Test options
 */
export function createLengthVariationTests(cipherName, encryptFn, language = 'english', options = {}) {
    const {
        timeout = 60000,
        orchestratorOptions = { tryMultiple: true, maxTime: 30000 }
    } = options;
    
    describe(`${cipherName} - Text Length Variations`, () => {
        const testTexts = getTestTexts();
        const texts = testTexts[language] || testTexts.english;
        
        ['short', 'medium', 'long'].forEach(length => {
            if (!texts[length]) return;
            
            it(`should handle ${length} texts in ${language}`, async () => {
                const plaintext = texts[length];
                
                const config = getTestConfig('orchestrator');
                const finalOrchestratorOptions = { ...config.orchestratorOptions, ...orchestratorOptions };
                
                const { result } = await runCipherTest({
                    plaintext,
                    language,
                    encryptFn: (pt) => encryptFn(pt),
                    orchestratorOptions: finalOrchestratorOptions,
                    verificationOptions: {},
                    detectCipher: false
                });
                
                console.log(`[${length}] Length=${plaintext.length}, Method=${result.method}, Score=${result.score?.toFixed(2) || 'N/A'}`);
            }, timeout);
        });
    });
}

/**
 * Creates a test suite for edge cases
 * @param {string} cipherName - Name of the cipher
 * @param {Function} encryptFn - Function that takes plaintext and returns ciphertext
 * @param {Object} options - Test options
 */
export function createEdgeCaseTests(cipherName, encryptFn, options = {}) {
    const {
        timeout = 30000,
        orchestratorOptions = { tryMultiple: false, maxTime: 15000 }
    } = options;
    
    const config = getTestConfig('orchestrator');
    const baseOrchestratorOptions = { ...config.orchestratorOptions, ...orchestratorOptions };
    
    describe(`${cipherName} - Edge Cases`, () => {
        it('should handle text with numbers', async () => {
            const plaintext = 'THE YEAR 2024 IS A LEAP YEAR WITH 366 DAYS';
            
            await runCipherTest({
                plaintext,
                language: 'english',
                encryptFn: (pt) => encryptFn(pt),
                orchestratorOptions: baseOrchestratorOptions,
                verificationOptions: { requireScore: false },
                detectCipher: false
            });
        }, timeout);
        
        it('should handle very short texts', async () => {
            const plaintext = 'HELLO WORLD';
            
            await runCipherTest({
                plaintext,
                language: 'english',
                encryptFn: (pt) => encryptFn(pt),
                orchestratorOptions: { ...baseOrchestratorOptions, maxTime: 10000 },
                verificationOptions: { 
                    requireScore: false,
                    minConfidence: 0 // Very short texts may have low confidence
                },
                detectCipher: false
            });
        }, timeout);
        
        it('should handle mixed case (after normalization)', async () => {
            const plaintext = 'The Quick Brown Fox Jumps Over The Lazy Dog';
            
            await runCipherTest({
                plaintext: plaintext.toUpperCase(),
                language: 'english',
                encryptFn: (pt) => encryptFn(pt),
                orchestratorOptions: { ...baseOrchestratorOptions, maxTime: 20000 },
                verificationOptions: {},
                detectCipher: false
            });
        }, timeout);
    });
}

/**
 * Creates a performance benchmark test
 * @param {string} cipherName - Name of the cipher
 * @param {Function} encryptFn - Function that takes plaintext and returns ciphertext
 * @param {string} plaintext - Plaintext to test
 * @param {number} maxTime - Maximum allowed time in ms
 * @param {Object} options - Test options
 */
export function createPerformanceTest(cipherName, encryptFn, plaintext, maxTime, options = {}) {
    const {
        timeout = maxTime * 2,
        orchestratorOptions = { tryMultiple: false, maxTime }
    } = options;
    
    it(`should decrypt ${cipherName} in under ${maxTime}ms`, async () => {
        const startTime = Date.now();
        
        await runCipherTest({
            plaintext,
            language: 'english',
            encryptFn: (pt) => encryptFn(pt),
            orchestratorOptions,
            verificationOptions: { requireScore: false },
            detectCipher: false
        });
        
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeLessThan(maxTime);
        
        console.log(`${cipherName} decryption took ${elapsed}ms`);
    }, timeout);
}

/**
 * Creates a dictionary validation test
 * @param {string} testName - Name of the test
 * @param {Function} encryptFn - Function that takes plaintext and returns ciphertext
 * @param {string} plaintext - Plaintext to test
 * @param {Object} options - Test options
 */
export function createDictionaryValidationTest(testName, encryptFn, plaintext, options = {}) {
    const {
        timeout = 60000,
        orchestratorOptions = { tryMultiple: true, useDictionary: true }
    } = options;
    
    test(testName, async () => {
        const { result } = await runCipherTest({
            plaintext,
            language: 'english',
            encryptFn: (pt) => encryptFn(pt),
            orchestratorOptions,
            verificationOptions: {},
            detectCipher: false
        });
        
        // Additional dictionary validation checks
        expect(result.dictionaryValidation).toBeDefined();
        expect(result.dictionaryValidation.metrics).toBeDefined();
        expect(result.dictionaryValidation.metrics.totalWords).toBeGreaterThan(0);
        
        console.log('Dictionary-validated result:', {
            plaintext: result.plaintext,
            method: result.method,
            confidence: result.confidence.toFixed(2),
            validWords: result.dictionaryValidation.metrics.validWords,
            wordCoverage: result.dictionaryValidation.metrics.wordCoverage
        });
    }, timeout);
}

/**
 * Gets standard test texts for different languages
 * @param {string} language - Optional language to get texts for
 * @returns {Object} Object with test texts by language and length
 */
export function getTestTexts(language = null) {
    return getCommonTestTexts(language);
}

// Legacy function - kept for backward compatibility but now uses common
function _getTestTextsOld() {
    return {
        english: {
            short: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
            medium: 'IN CRYPTOGRAPHY A SUBSTITUTION CIPHER IS A METHOD OF ENCRYPTING BY WHICH UNITS OF PLAINTEXT ARE REPLACED WITH CIPHERTEXT ACCORDING TO A FIXED SYSTEM',
            long: 'THE HISTORY OF CRYPTOGRAPHY BEGINS THOUSANDS OF YEARS AGO UNTIL RECENT DECADES IT HAS BEEN SYNONYMOUS WITH ENCRYPTION THE CONVERSION OF INFORMATION FROM A READABLE STATE TO APPARENT NONSENSE THE ORIGINATOR OF AN ENCRYPTED MESSAGE SHARES THE DECODING TECHNIQUE NEEDED TO RECOVER THE ORIGINAL INFORMATION ONLY WITH INTENDED RECIPIENTS THEREBY PRECLUDING UNWANTED PERSONS FROM DOING THE SAME'
        },
        spanish: {
            short: 'EL VELOZ MURCIELAGO HINDU COMIA FELIZ CARDILLO Y KIWI',
            medium: 'LA CRIPTOGRAFIA ES EL ARTE Y LA CIENCIA DE CIFRAR MENSAJES DE FORMA QUE SOLO LAS PERSONAS AUTORIZADAS PUEDAN LEERLOS Y PROCESARLOS',
            long: 'LA HISTORIA DE LA CRIPTOGRAFIA SE REMONTA A MILES DE AÑOS ATRAS HASTA DECADAS RECIENTES HA SIDO SINONIMO DE CIFRADO LA CONVERSION DE INFORMACION DE UN ESTADO LEGIBLE A UN APARENTE SINSENTIDO EL ORIGINADOR DE UN MENSAJE CIFRADO COMPARTE LA TECNICA DE DECODIFICACION NECESARIA PARA RECUPERAR LA INFORMACION ORIGINAL SOLO CON LOS DESTINATARIOS PREVISTOS IMPIDIENDO ASI QUE PERSONAS NO DESEADAS HAGAN LO MISMO'
        },
        french: {
            short: 'LE RENARD BRUN RAPIDE SAUTE PAR DESSUS LE CHIEN PARESSEUX',
            medium: 'LA CRYPTOGRAPHIE EST LA PRATIQUE ET ETUDE DES TECHNIQUES POUR SECURISER LA COMMUNICATION EN PRESENCE DE TIERS APPELES ADVERSAIRES',
            long: 'LHISTOIRE DE LA CRYPTOGRAPHIE COMMENCE IL Y A DES MILLIERS DANNEES JUSQUA CES DERNIERES DECENNIES ELLE A ETE SYNONYME DE CHIFFREMENT LA CONVERSION DINFORMATIONS DUN ETAT LISIBLE A UN NON SENS APPARENT LAUTEUR DUN MESSAGE CHIFFRE PARTAGE LA TECHNIQUE DE DECODAGE NECESSAIRE POUR RECUPERER LES INFORMATIONS DORIGINE UNIQUEMENT AVEC LES DESTINATAIRES PREVUS EMPECHANT AINSI LES PERSONNES NON DESIREES DE FAIRE DE MEME'
        },
        german: {
            short: 'DER SCHNELLE BRAUNE FUCHS SPRINGT UBER DEN FAULEN HUND',
            medium: 'KRYPTOGRAPHIE IST DIE PRAXIS UND DAS STUDIUM VON TECHNIKEN ZUR SICHEREN KOMMUNIKATION IN GEGENWART DRITTER PARTEIEN DIE ALS GEGNER BEZEICHNET WERDEN',
            long: 'DIE GESCHICHTE DER KRYPTOGRAPHIE BEGINNT VOR TAUSENDEN VON JAHREN BIS VOR KURZEM WAR SIE SYNONYM MIT VERSCHLUSSELUNG DER UMWANDLUNG VON INFORMATIONEN AUS EINEM LESBAREN ZUSTAND IN SCHEINBAREN UNSINN DER URHEBER EINER VERSCHLUSSELTEN NACHRICHT TEILT DIE ZUR WIEDERHERSTELLUNG DER URSPRUNGLICHEN INFORMATIONEN ERFORDERLICHE DECODIERUNGSTECHNIK NUR MIT DEN BEABSICHTIGTEN EMPFANGERN UND VERHINDERT DADURCH DASS UNERWUNSCHTE PERSONEN DASSELBE TUN'
        },
        italian: {
            short: 'LA VELOCE VOLPE MARRONE SALTA SOPRA IL CANE PIGRO',
            medium: 'LA CRITTOGRAFIA E LA PRATICA E LO STUDIO DELLE TECNICHE PER COMUNICAZIONI SICURE IN PRESENZA DI TERZE PARTI CHIAMATE AVVERSARI',
            long: 'LA STORIA DELLA CRITTOGRAFIA INIZIA MIGLIAIA DI ANNI FA FINO A DECENNI RECENTI E STATA SINONIMO DI CIFRATURA LA CONVERSIONE DI INFORMAZIONI DA UNO STATO LEGGIBILE A UN APPARENTE NONSENSO LAUTORE DI UN MESSAGGIO CIFRATO CONDIVIDE LA TECNICA DI DECODIFICA NECESSARIA PER RECUPERARE LE INFORMAZIONI ORIGINALI SOLO CON I DESTINATARI PREVISTI IMPEDENDO COSI ALLE PERSONE INDESIDERATE DI FARE LO STESSO'
        },
        portuguese: {
            short: 'A RAPIDA RAPOSA MARROM PULA SOBRE O CAO PREGUICOSO',
            medium: 'A CRIPTOGRAFIA E A PRATICA E O ESTUDO DE TECNICAS PARA COMUNICACAO SEGURA NA PRESENCA DE TERCEIROS CHAMADOS ADVERSARIOS',
            long: 'A HISTORIA DA CRIPTOGRAFIA COMECA HA MILHARES DE ANOS ATRAS ATE DECADAS RECENTES TEM SIDO SINONIMO DE CRIPTOGRAFIA A CONVERSAO DE INFORMACOES DE UM ESTADO LEGIVEL PARA UM APARENTE ABSURDO O ORIGINADOR DE UMA MENSAGEM CRIPTOGRAFADA COMPARTILHA A TECNICA DE DECODIFICACAO NECESSARIA PARA RECUPERAR AS INFORMACOES ORIGINAIS APENAS COM OS DESTINATARIOS PRETENDIDOS IMPEDINDO ASSIM QUE PESSOAS INDESEJADAS FACAM O MESMO'
        }
    };
}

/**
 * Sets up dictionaries for orchestrator tests
 * This should be called in beforeAll hook
 * @param {Array<string>} languages - Languages to load dictionaries for
 * @returns {Promise<Object>} Loaded dictionaries
 */
export async function setupOrchestratorTests(languages = ['english']) {
    return await setupTestEnvironment(languages);
}

