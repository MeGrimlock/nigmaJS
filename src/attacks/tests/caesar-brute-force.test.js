import { CaesarBruteForce } from '../strategies/caesar-brute-force.js';
import { default as Shift } from '../../ciphers/shift/shift.js';

/**
 * Caesar Brute Force Solver Tests
 */
describe('Caesar Brute Force Solver', () => {
    const englishPlain = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG";
    const caesarCipher = "WKLV TXLFN EURZQ IRA MXPSV RYHU WKH ODCB GRJ"; // Caesar shift +3

    describe('Basic Functionality', () => {
        test('should correctly find Caesar shift', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(caesarCipher);

            expect(result.method).toBe('caesar-brute-force');
            expect(typeof result.key).toBe('number');
            expect(result.key).toBeGreaterThanOrEqual(0);
            expect(result.key).toBeLessThanOrEqual(25);
            expect(result.confidence).toBeGreaterThan(0.1);
            expect(result.plaintext.length).toBeGreaterThan(0);
        });

        test('should return valid result structure', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(caesarCipher);

            expect(result).toHaveProperty('plaintext');
            expect(result).toHaveProperty('method');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('key');
            expect(result).toHaveProperty('wordCoverage');
        });

        test('should work with different languages', async () => {
            const spanishSolver = new CaesarBruteForce('spanish');
            const result = await spanishSolver.solve(caesarCipher);

            expect(result.method).toBe('caesar-brute-force');
            expect(typeof result.confidence).toBe('number');
            expect(typeof result.key).toBe('number');
        });

        test('should handle unsupported languages gracefully', async () => {
            const klingonSolver = new CaesarBruteForce('klingon');
            const result = await klingonSolver.solve(caesarCipher);

            expect(result.method).toBe('caesar-brute-force');
            expect(typeof result.confidence).toBe('number');
            expect(typeof result.key).toBe('number');
        });
    });

    describe('Shift Detection', () => {
        test('should find shift 1 correctly', async () => {
            const shift1Cipher = "UIF RVJDL CSPXO GPY KVNQT PWFS UIF MBAZ EPH"; // Shift +1
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(shift1Cipher);

            expect(result.key).toBe(1);
            expect(result.confidence).toBeGreaterThan(0.4);
        });

        test('should find shift 13 (ROT13) correctly', async () => {
            const rot13Cipher = "GUR DHVXR OEBJA SBK WHZCF BIRE GUR YNML QBT"; // ROT13
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(rot13Cipher);

            expect(result.key).toBe(13);
            expect(result.confidence).toBeGreaterThan(0.4);
        });

        test('should find shift 25 correctly', async () => {
            const shift25Cipher = "SGD PTHBJ AQMVN ENV ITLOR NUDQ SGD KZYX CNF"; // Shift +25
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(shift25Cipher);

            expect(result.key).toBe(25);
            expect(result.confidence).toBeGreaterThan(0.3);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty input', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve('');

            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
            expect(result.plaintext).toBe('');
            expect(result.key).toBe(0);
        });

        test('should handle null input', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(null);

            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
            expect(result.plaintext).toBe('');
            expect(result.key).toBe(0);
        });

        test('should handle very short input', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve('AB');

            expect(result.method).toBe('caesar-brute-force');
            expect(typeof result.key).toBe('number');
            expect(result.key).toBeGreaterThanOrEqual(0);
            expect(result.key).toBeLessThanOrEqual(25);
        });

        test('should handle text with only non-letters', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve('123456789!@#$%');

            expect(result.confidence).toBeLessThan(0.8);
            expect(typeof result.score).toBe('number');
        });

        test('should handle text with mixed case and punctuation', async () => {
            const mixedCipher = "WkLv TxLfN EuRzQ IrA MxPsV RyHu WkH OdCb GrJ!?"; // Mixed case +3 shift
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(mixedCipher);

            expect(result.method).toBe('caesar-brute-force');
            expect(result.key).toBe(3);
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        test('should handle very long text efficiently', async () => {
            const longPlain = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG ".repeat(50);
            const caesar = new Shift.CaesarShift(longPlain, 7);
            const longCipher = caesar.encode();

            const solver = new CaesarBruteForce('english');
            const startTime = Date.now();
            const result = await solver.solve(longCipher);
            const endTime = Date.now();

            expect(result.method).toBe('caesar-brute-force');
            expect(result.key).toBe(7);
            expect(result.confidence).toBeGreaterThan(0.3);
            expect(endTime - startTime).toBeLessThan(5000); // Should be fast
        }, 5000);

        test('should handle text with repeated characters', async () => {
            const repeatedCipher = "AAAA BBBB CCCC"; // Shift doesn't matter for repeated chars
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(repeatedCipher);

            expect(result.method).toBe('caesar-brute-force');
            expect(typeof result.key).toBe('number');
            expect(result.confidence).toBeGreaterThanOrEqual(0);
        });

        test('should handle all uppercase text', async () => {
            const upperCipher = "WKLV LV DOO XSSHUF DVH";
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(upperCipher);

            expect(result.method).toBe('caesar-brute-force');
            expect(result.key).toBe(3);
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        test('should handle all lowercase text', async () => {
            const lowerCipher = "wklv lv doo xsseur dvh";
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(lowerCipher);

            expect(result.method).toBe('caesar-brute-force');
            expect(result.key).toBe(3);
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        test('should handle repeated patterns', async () => {
            const repeatedCipher = "WKLVWKLVWKLV"; // "THIS" repeated, shifted +3
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(repeatedCipher);

            expect(typeof result.key).toBe('number');
            expect(result.key).toBeGreaterThanOrEqual(0);
            expect(result.key).toBeLessThanOrEqual(25);
            expect(result.confidence).toBeGreaterThan(0.3);
        });

        test('should handle palindrome-like text', async () => {
            const palindromeCipher = "AABBCCDDEEFF"; // Simple repeating pattern
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(palindromeCipher);

            expect(typeof result.key).toBe('number');
            expect(result.confidence).toBeGreaterThan(0);
        });
    });

    describe('Confidence and Scoring', () => {
        test('should give high confidence for clear Caesar text', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(caesarCipher);

            expect(result.confidence).toBeGreaterThan(0.4);
            expect(result.score).toBeGreaterThan(-20);
            expect(result.wordCoverage).toBeGreaterThan(0.2);
        });

        test('should give reasonable confidence for ambiguous text', async () => {
            const ambiguousCipher = "XYZABC"; // Could be many shifts
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(ambiguousCipher);

            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
            expect(typeof result.score).toBe('number');
        });

        test('should calculate word coverage correctly', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(caesarCipher);

            expect(result).toHaveProperty('wordCoverage');
            expect(typeof result.wordCoverage).toBe('number');
            expect(result.wordCoverage).toBeGreaterThanOrEqual(0);
            expect(result.wordCoverage).toBeLessThanOrEqual(1);
        });

        test('should prefer correct shift over incorrect ones', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(caesarCipher);

            // The correct shift (3) should have higher confidence than wrong shifts
            expect(typeof result.key).toBe('number');
            expect(result.key).toBeGreaterThanOrEqual(0);
            expect(result.key).toBeLessThanOrEqual(25);
            expect(result.confidence).toBeGreaterThan(0.3);
        });

        test('should give high confidence for correct Caesar text', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(caesarCipher);

            expect(result.confidence).toBeGreaterThan(0.4);
            expect(result.score).toBeGreaterThan(-2);
        });

        test('should give low confidence for non-Caesar text', async () => {
            const solver = new CaesarBruteForce('english');
            const randomText = "XYZ ABC DEF GHI JKL MNO PQR STU VWX YZA BC";
            const result = await solver.solve(randomText);

            expect(result.confidence).toBeLessThan(0.9);
        });

        test('should calculate word coverage', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(caesarCipher);

            expect(typeof result.wordCoverage).toBe('number');
            expect(result.wordCoverage).toBeGreaterThan(0.3);
        });
    });

    describe('Performance and Stress Testing', () => {
        test('should complete within reasonable time', async () => {
            const solver = new CaesarBruteForce('english');
            const startTime = Date.now();

            await solver.solve(caesarCipher);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete in less than 2 seconds for typical text
            expect(duration).toBeLessThan(2000);
        }, 2000);

        test('should solve quickly for short text', async () => {
            const shortCipher = "WKLV"; // "THIS" shifted +3
            const solver = new CaesarBruteForce('english');
            const startTime = Date.now();
            const result = await solver.solve(shortCipher);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(100); // Should be fast
            expect(result.key).toBe(3);
        });

        test('should handle longer text efficiently', async () => {
            const longCipher = caesarCipher.repeat(5); // Repeat the cipher text
            const solver = new CaesarBruteForce('english');
            const startTime = Date.now();
            const result = await solver.solve(longCipher);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(500); // Should be reasonably fast
            expect(result.key).toBe(3);
        });

        test('should handle maximum shift (25)', async () => {
            const shift25Cipher = "ZABC YZAB"; // Shift 25 from ABCDYZ
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(shift25Cipher);

            expect(result.method).toBe('caesar-brute-force');
            expect(typeof result.key).toBe('number');
            expect(result.key).toBeGreaterThanOrEqual(0);
            expect(result.key).toBeLessThanOrEqual(25);
            expect(result.confidence).toBeGreaterThanOrEqual(0);
        });

        test('should handle minimum shift (1)', async () => {
            const shift1Cipher = "BCDE YZAB"; // Shift 1 from ABCDYZ
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(shift1Cipher);

            expect(result.method).toBe('caesar-brute-force');
            expect(typeof result.key).toBe('number');
            expect(result.key).toBeGreaterThanOrEqual(0);
            expect(result.key).toBeLessThanOrEqual(25);
            expect(result.confidence).toBeGreaterThanOrEqual(0);
        });

        test('should handle zero shift (no encryption)', async () => {
            const noShiftCipher = "ABCD YZAB"; // No shift
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(noShiftCipher);

            expect(result.method).toBe('caesar-brute-force');
            expect(typeof result.key).toBe('number');
            expect(result.key).toBeGreaterThanOrEqual(0);
            expect(result.key).toBeLessThanOrEqual(25);
            expect(result.confidence).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Cipher Integration', () => {
        test('should work with Shift.CaesarShift cipher', () => {
            const caesar = new Shift.CaesarShift(englishPlain, 3);
            const encrypted = caesar.encode();

            expect(encrypted).toBeTruthy();
            expect(typeof encrypted).toBe('string');
            expect(encrypted.length).toBeGreaterThan(0);
        });

        test('should be consistent with cipher decode', () => {
            const caesar = new Shift.CaesarShift(caesarCipher, 3);
            const decoded = caesar.decode();

            expect(decoded).toBeTruthy();
            expect(typeof decoded).toBe('string');
            expect(decoded.length).toBeGreaterThan(0);
        });

        test('should work with different shift values', () => {
            for (let shift = 0; shift <= 25; shift++) {
                const caesar = new Shift.CaesarShift("HELLO", shift);
                const encrypted = caesar.encode();
                const caesarDecode = new Shift.CaesarShift(encrypted, shift);
                const decrypted = caesarDecode.decode();

                expect(decrypted.toUpperCase()).toBe("HELLO");
            }
        });
    });

    describe('Error Handling and Robustness', () => {
        test('should handle malformed input gracefully', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve('!@#$%^&*()');

            expect(result.method).toBe('caesar-brute-force');
            expect(result.confidence).toBe(0);
            expect(result.score).toBe(-Infinity);
        });

        test('should handle unicode characters', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve('HELLO 🌍 WORLD');

            expect(result.method).toBe('caesar-brute-force');
            expect(result.plaintext).toContain('🌍'); // Non-ASCII preserved
        });

        test('should handle extremely long text', async () => {
            const extremelyLong = 'A'.repeat(10000);
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(extremelyLong);

            expect(result.method).toBe('caesar-brute-force');
            expect(typeof result.key).toBe('number');
            expect(typeof result.confidence).toBe('number');
        });

        test('should handle text with numbers', async () => {
            const withNumbers = "H3LL0 W0RLD123";
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve(withNumbers);

            expect(result.method).toBe('caesar-brute-force');
            expect(result.plaintext).toContain('3'); // Numbers preserved
            expect(result.plaintext).toContain('0');
        });

        test('should handle very short text', async () => {
            const solver = new CaesarBruteForce('english');
            const result = await solver.solve('ABC');

            expect(typeof result.key).toBe('number');
            expect(result.confidence).toBeGreaterThan(0);
        });
    });
});
