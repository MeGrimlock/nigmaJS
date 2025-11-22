
import { HMMSolver } from './hmm-solver';
import { VigenereSolver } from './vigenere-solver';
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
    let hmmSolver;
    let vigenereSolver;

    beforeAll(() => {
        hmmSolver = new HMMSolver('english');
        hmmSolver.initialize();
        vigenereSolver = new VigenereSolver('english');
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
        const result = await hmmSolver.solve(ciphertext, 10);
        
        console.log(`Caesar Result: ${result}`);
        expect(isDecrypted(result, CLEAN_PLAINTEXT)).toBe(true);
    });

    // --- POLYALPHABETIC (VIGENERE SOLVER) ---
    // Este test debe pasar usando el nuevo VigenereSolver
    test('Should decrypt Vigenère using Friedman/Kasiski method', () => {
        const key = "KEY";
        const cipher = new Polyalphabetic.Vigenere(CLEAN_PLAINTEXT, key);
        const ciphertext = cipher.encode();
        
        const result = vigenereSolver.solve(ciphertext);
        
        console.log(`Vigenere Result (Found Key: ${result.key}): ${result.plaintext}`);
        expect(result.key).toBe(key);
        expect(isDecrypted(result.plaintext, CLEAN_PLAINTEXT)).toBe(true);
    });

    // --- TRANSPOSITION (Should Fail with current HMM) ---
    test.skip('Should FAIL to decrypt Rail Fence (Transposition)', async () => {
        const cipher = new Columnar.RailFence(CLEAN_PLAINTEXT, 3);
        const ciphertext = cipher.encode();
        const result = await hmmSolver.solve(ciphertext, 50);
        
        console.log(`RailFence Result (Expected Failure): ${result}`);
        expect(isDecrypted(result, CLEAN_PLAINTEXT)).toBe(false);
    });
});
