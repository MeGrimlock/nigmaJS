
import { HMMSolver } from './hmm-solver';
import { LanguageAnalysis } from '../languageAnalysis/analysis';
import Shift from '../methods/shift/shift';
import Polyalphabetic from '../methods/polyalphabetic/polyalphabetic';
import Dictionary from '../methods/dictionary/dictionary';
import Columnar from '../methods/columnar/columnar';
import 'regenerator-runtime/runtime';

// Texto de prueba (~50 chars)
const PLAINTEXT = "THE PROJECT GUTENBERG EBOOK OF OLIVER TWIST BY CHARLES DICKENS";
// Limpiamos para que sea justo (solo letras, mayúsculas)
const CLEAN_PLAINTEXT = PLAINTEXT.replace(/[^A-Z]/g, '');

describe('Decryption Capability Benchmarks', () => {
    let solver;

    beforeAll(() => {
        solver = new HMMSolver('english');
        solver.initialize();
    });

    // Increase timeout for CPU-bound TensorFlow operations
    jest.setTimeout(120000);

    // Helper para medir éxito (similitud > 80%)
    const isDecrypted = (decrypted, original) => {
        let matches = 0;
        for (let i = 0; i < original.length; i++) {
            if (decrypted[i] === original[i]) matches++;
        }
        const accuracy = matches / original.length;
        return accuracy > 0.8;
    };

    // --- SHIFT CIPHERS (Should Pass with Fast Path) ---
    test.skip('Should decrypt Caesar Shift (ROT3)', async () => {
        const cipher = new Shift.CaesarShift(CLEAN_PLAINTEXT, 3);
        const ciphertext = cipher.encode();
        const result = await solver.solve(ciphertext, 10);
        
        console.log(`Caesar Result: ${result}`);
        expect(isDecrypted(result, CLEAN_PLAINTEXT)).toBe(true);
    });

    // --- MONOALPHABETIC SUBSTITUTION (Should Pass with HMM) ---
    test.skip('Should decrypt Simple Substitution', async () => {
        const key = "QWERTYUIOPASDFGHJKLZXCVBNM"; // Teclado QWERTY como llave
        const cipher = new Dictionary.SimpleSubstitution(CLEAN_PLAINTEXT, key);
        const ciphertext = cipher.encode();
        
        // HMM necesita más iteraciones para sustitución completa
        const result = await solver.solve(ciphertext, 200);
        
        console.log(`SimpleSub Result: ${result}`);
        // Nota: HMM a veces cae en mínimos locales, pero debería acercarse
        // Marcamos como 'expected' para ver el rendimiento actual
        expect(isDecrypted(result, CLEAN_PLAINTEXT)).toBe(true);
    });

    test.skip('Should decrypt Atbash (Symmetric Substitution)', async () => {
        const cipher = new Dictionary.Atbash(CLEAN_PLAINTEXT);
        const ciphertext = cipher.encode();
        const result = await solver.solve(ciphertext, 100);
        
        console.log(`Atbash Result: ${result}`);
        expect(isDecrypted(result, CLEAN_PLAINTEXT)).toBe(true);
    });

    // --- POLYALPHABETIC (Should Fail with current HMM) ---
    // Estos tests documentan la limitación actual del solver
    test.skip('Should FAIL to decrypt Vigenère (Polyalphabetic)', async () => {
        const cipher = new Polyalphabetic.Vigenere(CLEAN_PLAINTEXT, "KEY");
        const ciphertext = cipher.encode();
        const result = await solver.solve(ciphertext, 50);
        
        console.log(`Vigenere Result (Expected Failure): ${result}`);
        expect(isDecrypted(result, CLEAN_PLAINTEXT)).toBe(false);
    });

    test.skip('Should FAIL to decrypt Quagmire III', async () => {
        const cipher = new Polyalphabetic.Quagmire3(CLEAN_PLAINTEXT, "KEY");
        const ciphertext = cipher.encode();
        const result = await solver.solve(ciphertext, 50);
        
        console.log(`Quagmire3 Result (Expected Failure): ${result}`);
        expect(isDecrypted(result, CLEAN_PLAINTEXT)).toBe(false);
    });

    // --- TRANSPOSITION (Should Fail with current HMM) ---
    test.skip('Should FAIL to decrypt Rail Fence (Transposition)', async () => {
        const cipher = new Columnar.RailFence(CLEAN_PLAINTEXT, 3);
        const ciphertext = cipher.encode();
        const result = await solver.solve(ciphertext, 50);
        
        console.log(`RailFence Result (Expected Failure): ${result}`);
        expect(isDecrypted(result, CLEAN_PLAINTEXT)).toBe(false);
    });
});

