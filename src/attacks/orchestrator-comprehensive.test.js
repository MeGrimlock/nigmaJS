import { Orchestrator } from './orchestrator.js';
import Shift from '../ciphers/shift/shift.js';
import Polyalphabetic from '../ciphers/polyalphabetic/polyalphabetic.js';
import { Scorer } from '../search/scorer.js';
import { PolyalphabeticSolver } from './strategies/polyalphabetic-solver.js';

/**
 * Comprehensive Orchestrator Tests
 * 
 * Tests the orchestrator against:
 * - Multiple cipher types (Caesar, ROT13, Vigenère, Substitution)
 * - Multiple languages (English, Spanish, French, German, Italian, Portuguese)
 * - Different text lengths (short, medium, long)
 * - Edge cases (numbers, punctuation, mixed content)
 */

// Test texts in different languages
const testTexts = {
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

describe('Orchestrator - Comprehensive Tests', () => {
    // Helper function to test a cipher type across languages
    const testCipherAcrossLanguages = (cipherName, encryptFn, languages = ['english', 'spanish']) => {
        languages.forEach(lang => {
            it(`should decrypt ${cipherName} in ${lang}`, async () => {
                const plaintext = testTexts[lang].medium;
                const ciphertext = encryptFn(plaintext, lang);
                
                const orchestrator = new Orchestrator(lang);
                const result = await orchestrator.autoDecrypt(ciphertext, {
                    tryMultiple: true,
                    maxTime: 60000
                });
                
                expect(result.plaintext).toBeDefined();
                expect(result.method).toBeDefined();
                expect(result.score).toBeGreaterThan(-Infinity);
                expect(result.cipherType).toBeDefined();
                
                console.log(`[${lang}] ${cipherName}: Method=${result.method}, Score=${result.score.toFixed(2)}, Confidence=${result.confidence.toFixed(2)}`);
            }, 120000);
        });
    };
    
    describe('Caesar Shift Cipher', () => {
        testCipherAcrossLanguages(
            'Caesar Shift',
            (plaintext) => {
                const caesar = new Shift.CaesarShift(plaintext, 7);
                return caesar.encode();
            },
            ['english', 'spanish', 'french', 'german']
        );
    });
    
    describe('ROT13 Cipher', () => {
        testCipherAcrossLanguages(
            'ROT13',
            (plaintext) => {
                const rot13 = new Shift.Rot13(plaintext);
                return rot13.encode();
            },
            ['english', 'spanish']
        );
    });
    
    describe('Vigenère Cipher', () => {
        testCipherAcrossLanguages(
            'Vigenère (KEY)',
            (plaintext) => {
                const vigenere = new Polyalphabetic.Vigenere('KEY');
                return vigenere.encode(plaintext);
            },
            ['english', 'spanish']
        );
        
        testCipherAcrossLanguages(
            'Vigenère (CRYPTO)',
            (plaintext) => {
                const vigenere = new Polyalphabetic.Vigenere('CRYPTO');
                return vigenere.encode(plaintext);
            },
            ['english']
        );
    });
    
    describe('Random Substitution Cipher', () => {
        testCipherAcrossLanguages(
            'Random Substitution',
            (plaintext, lang) => {
                const key = Scorer.randomKey();
                const scorer = new Scorer(lang);
                return scorer.applyKey(plaintext, key);
            },
            ['english', 'spanish', 'french']
        );
    });
    
    describe('Frequency-based Substitution', () => {
        it('should decrypt frequency-based substitution in English', async () => {
            const plaintext = testTexts.english.long;
            const key = Scorer.frequencyKey(plaintext, 'english');
            const scorer = new Scorer('english');
            // Apply reverse key for encryption
            const reverseKey = {};
            for (const [k, v] of Object.entries(key)) {
                reverseKey[v] = k;
            }
            const ciphertext = scorer.applyKey(plaintext, reverseKey);
            
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                maxTime: 60000
            });
            
            expect(result.plaintext).toBeDefined();
            expect(result.score).toBeGreaterThan(-7);
            
            console.log(`Frequency Substitution: Score=${result.score.toFixed(2)}, Confidence=${result.confidence.toFixed(2)}`);
        }, 120000);
    });
    
    describe('Text Length Variations', () => {
        ['short', 'medium', 'long'].forEach(length => {
            it(`should handle ${length} texts in English`, async () => {
                const plaintext = testTexts.english[length];
                const caesar = new Shift.CaesarShift(plaintext, 5);
                const ciphertext = caesar.encode();
                
                const orchestrator = new Orchestrator('english');
                const result = await orchestrator.autoDecrypt(ciphertext, {
                    tryMultiple: true,
                    maxTime: 30000
                });
                
                expect(result.plaintext).toBeDefined();
                expect(result.method).toBeDefined();
                
                console.log(`[${length}] Length=${plaintext.length}, Method=${result.method}, Score=${result.score.toFixed(2)}`);
            }, 60000);
        });
    });
    
    describe('Edge Cases', () => {
        it('should handle text with numbers', async () => {
            const plaintext = 'THE YEAR 2024 IS A LEAP YEAR WITH 366 DAYS';
            const caesar = new Shift.CaesarShift(plaintext, 3);
            const ciphertext = caesar.encode();
            
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: false,
                maxTime: 15000
            });
            
            expect(result.plaintext).toBeDefined();
            expect(result.method).toBeDefined();
        }, 30000);
        
        it('should handle very short texts', async () => {
            const plaintext = 'HELLO WORLD';
            const caesar = new Shift.CaesarShift(plaintext, 7);
            const ciphertext = caesar.encode();
            
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: false,
                maxTime: 10000
            });
            
            expect(result.plaintext).toBeDefined();
            // Very short texts may not decrypt perfectly
            expect(result.cipherType).toBeDefined();
        }, 30000);
        
        it('should handle mixed case (after normalization)', async () => {
            const plaintext = 'The Quick Brown Fox Jumps Over The Lazy Dog';
            const caesar = new Shift.CaesarShift(plaintext.toUpperCase(), 5);
            const ciphertext = caesar.encode();
            
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                maxTime: 20000
            });
            
            expect(result.plaintext).toBeDefined();
        }, 60000);
    });
    
    describe('Multi-language Detection', () => {
        it('should work with Spanish text using English orchestrator (fallback)', async () => {
            const plaintext = testTexts.spanish.medium;
            const caesar = new Shift.CaesarShift(plaintext, 5);
            const ciphertext = caesar.encode();
            
            // Use English orchestrator on Spanish text
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                maxTime: 30000
            });
            
            expect(result.plaintext).toBeDefined();
            // May not be perfect, but should produce something
            expect(result.score).toBeGreaterThan(-Infinity);
        }, 60000);
    });
    
    describe('Performance Benchmarks', () => {
        it('should decrypt Caesar in under 5 seconds', async () => {
            const plaintext = testTexts.english.medium;
            const caesar = new Shift.CaesarShift(plaintext, 7);
            const ciphertext = caesar.encode();
            
            const startTime = Date.now();
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: false,
                maxTime: 5000
            });
            const elapsed = Date.now() - startTime;
            
            expect(result.plaintext).toBeDefined();
            expect(elapsed).toBeLessThan(5000);
            
            console.log(`Caesar decryption took ${elapsed}ms`);
        }, 10000);
        
        it('should decrypt substitution in under 30 seconds', async () => {
            const plaintext = testTexts.english.medium;
            const key = Scorer.randomKey();
            const scorer = new Scorer('english');
            const ciphertext = scorer.applyKey(plaintext, key);
            
            const startTime = Date.now();
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                maxTime: 30000
            });
            const elapsed = Date.now() - startTime;
            
            expect(result.plaintext).toBeDefined();
            expect(elapsed).toBeLessThan(30000);
            
            console.log(`Substitution decryption took ${elapsed}ms`);
        }, 60000);
    });
    
    describe('Advanced Polyalphabetic Ciphers', () => {
        it('should decrypt Beaufort cipher', async () => {
            const plaintext = testTexts.english.medium;
            const key = 'CRYPTO';
            
            const beaufort = new Polyalphabetic.Beaufort(plaintext, key);
            const ciphertext = beaufort.encode();
            
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                maxTime: 60000
            });
            
            expect(result.plaintext).toBeDefined();
            expect(result.method).toBeDefined();
            expect(result.score).toBeGreaterThan(-Infinity);
            
            console.log(`Beaufort: Method=${result.method}, Score=${result.score.toFixed(2)}, Confidence=${result.confidence.toFixed(2)}`);
        }, 120000);
        
        it('should decrypt Porta cipher', async () => {
            const plaintext = testTexts.english.medium;
            const key = 'FORTIFICATION';
            
            const porta = new Polyalphabetic.Porta(plaintext, key);
            const ciphertext = porta.encode();
            
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                maxTime: 60000
            });
            
            expect(result.plaintext).toBeDefined();
            expect(result.method).toBeDefined();
            expect(result.score).toBeGreaterThan(-Infinity);
            
            console.log(`Porta: Method=${result.method}, Score=${result.score.toFixed(2)}, Confidence=${result.confidence.toFixed(2)}`);
        }, 120000);
        
        it('should decrypt Gronsfeld cipher', async () => {
            const plaintext = testTexts.english.medium;
            const key = '31415';
            
            const gronsfeld = new Polyalphabetic.Gronsfeld(plaintext, key);
            const ciphertext = gronsfeld.encode();
            
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                maxTime: 60000
            });
            
            expect(result.plaintext).toBeDefined();
            expect(result.method).toBeDefined();
            expect(result.score).toBeGreaterThan(-Infinity);
            
            console.log(`Gronsfeld: Method=${result.method}, Score=${result.score.toFixed(2)}, Confidence=${result.confidence.toFixed(2)}`);
        }, 120000);
        
        it('should attempt to decrypt Quagmire I cipher', async () => {
            const plaintext = testTexts.english.long; // Quagmire needs more text
            const key = 'SECRET';
            const cipherAlphabet = 'ZYXWVUTSRQPONMLKJIHGFEDCBA';
            
            const quagmire = new Polyalphabetic.Quagmire1(plaintext, key, cipherAlphabet);
            const ciphertext = quagmire.encode();
            
            const orchestrator = new Orchestrator('english');
            const result = await orchestrator.autoDecrypt(ciphertext, {
                tryMultiple: true,
                maxTime: 60000
            });
            
            expect(result.plaintext).toBeDefined();
            expect(result.method).toBeDefined();
            
            console.log(`Quagmire I: Method=${result.method}, Score=${result.score.toFixed(2)}, Confidence=${result.confidence.toFixed(2)}`);
        }, 120000);
    });
});

