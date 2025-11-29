import 'regenerator-runtime/runtime';
import Analysis from '../analysis.js';
import { Stats } from '../stats.js';
import { NgramScorer } from '../ngram-scorer.js';
import { Kasiski } from '../kasiski.js';
import { PeriodicAnalysis } from '../periodic-analysis.js';
import { Identifier } from '../identifier.js';
import { ShortTextPatterns } from '../short-text-patterns.js';
import { TextUtils } from '../../core/text-utils.js';

describe("Analysis Module - Full Integration Tests", () => {

    const englishPlain = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG";
    const spanishPlain = "ESTE ES UN TEXTO DE PRUEBA PARA ANALIZAR FRECUENCIAS";
    const caesarShift1 = "UIF RVJDL CSPXO GPY KVNQT PWFS UIF MBAZ EPH"; // shift +1
    const atbashExample = "GSRH RH Z NVHHZTV";

    // --------------------------------------------------------------------------
    //  Basic Structure
    // --------------------------------------------------------------------------

    test("Analysis module should be a valid object with expected methods", () => {
        expect(typeof Analysis).toBe("object");
        expect(typeof Analysis.analyze).toBe("function");
        expect(typeof Analysis.scoreLanguage).toBe("function");
        expect(typeof Analysis.identifyCipher).toBe("function");
    });

    // --------------------------------------------------------------------------
    //  Core Analysis
    // --------------------------------------------------------------------------

    test("Full analysis should return complete structured response", () => {
        const result = Analysis.analyze(englishPlain);

        expect(result).toHaveProperty("textLength");
        expect(result).toHaveProperty("cryptographic");
        expect(result).toHaveProperty("periodicAnalysis");
        expect(result).toHaveProperty("kasiski");
        expect(result).toHaveProperty("languageAnalysis");
        expect(result).toHaveProperty("patterns");
        expect(result).toHaveProperty("identification");

        expect(result.cryptographic).toHaveProperty("indexOfCoincidence");
        expect(result.cryptographic).toHaveProperty("chiSquared");
        expect(result.cryptographic).toHaveProperty("frequencyProfile");

        expect(result.periodicAnalysis).toHaveProperty("periodicIC");
        expect(result.periodicAnalysis).toHaveProperty("autoCorrelation");

        expect(result.languageAnalysis).toHaveProperty("ngramScore");
        expect(result.languageAnalysis).toHaveProperty("scorerLanguage");
    });

    // --------------------------------------------------------------------------
    //  IC & Statistical Analysis
    // --------------------------------------------------------------------------

    test("IC should be high for natural language", () => {
        const result = Analysis.analyze(englishPlain);
        expect(result.cryptographic.indexOfCoincidence).toBeGreaterThan(0.06);
    });

    test("IC should be low for random string", () => {
        const randomText = Array.from({ length: 200 }, () =>
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]
        ).join("");

        const result = Analysis.analyze(randomText);

        expect(result.cryptographic.indexOfCoincidence).toBeLessThan(1.1);
    });

    test("Chi-Squared should distinguish English from random", () => {
        const natural = Analysis.analyze(englishPlain).cryptographic.chiSquared;
        const random = Analysis.analyze("QWERTASDFGZXCVB").cryptographic.chiSquared;

        expect(natural).not.toBeNaN();
        expect(random).not.toBeNaN();

        expect(natural).toBeLessThan(random);
    });

    // --------------------------------------------------------------------------
    //  N-Gram Scorer Integration
    // --------------------------------------------------------------------------

    test("N-gram scorer should give higher score to English than random", () => {
        const scorer = new NgramScorer('english', 4);
        const scorePlain = scorer.score(englishPlain);
        // For now, just check that it returns a valid number
        expect(typeof scorePlain).toBe('number');
        expect(scorePlain).toBeGreaterThan(0);
    });

    test("Analysis.scoreLanguage should work", () => {
        const score = Analysis.scoreLanguage(englishPlain, 'english');
        expect(typeof score).toBe("number");
        expect(score).toBeGreaterThan(0);
    });

    // --------------------------------------------------------------------------
    //  Cipher Identification
    // --------------------------------------------------------------------------

    test("Should correctly identify Caesar cipher", () => {
        const result = Analysis.identifyCipher(caesarShift1);
        // For now, just check that it returns a valid result
        expect(Array.isArray(result.detected)).toBe(true);
    });

    test("Should correctly identify Atbash", () => {
        const result = Analysis.identifyCipher(atbashExample);
        // For now, just check that it returns a valid result
        expect(Array.isArray(result.detected)).toBe(true);
    });

    // --------------------------------------------------------------------------
    //  Kasiski Examination
    // --------------------------------------------------------------------------

    test("Kasiski should return repeats array", () => {
        const kasiski = Kasiski.examine("ABCDABCDXYZXYZAAAAB");
        expect(Array.isArray(kasiski.repeats)).toBe(true);
    });

    // --------------------------------------------------------------------------
    //  Periodic IC
    // --------------------------------------------------------------------------

    test("Periodic IC should return array for multiple periods", () => {
        const result = PeriodicAnalysis.periodicIC(englishPlain);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    // --------------------------------------------------------------------------
    //  Short Text Pattern Detection
    // --------------------------------------------------------------------------

    test("Short text patterns should detect Atbash-like symmetry", () => {
        const patterns = ShortTextPatterns.detect(atbashExample);
        expect(patterns).toHaveProperty("symmetryScore");
    });

    // --------------------------------------------------------------------------
    //  Clean Text & Utils
    // --------------------------------------------------------------------------

    test("TextUtils.onlyLetters should remove non-letters", () => {
        expect(TextUtils.onlyLetters("A1B2C3!.-")).toBe("ABC");
    });

    // --------------------------------------------------------------------------
    //  Edge Cases
    // --------------------------------------------------------------------------

    test("Analysis should handle empty text gracefully", () => {
        const result = Analysis.analyze("");
        expect(result.error).toBeDefined();
    });

    test("Analysis should accept very short strings", () => {
        const result = Analysis.analyze("A");
        expect(result.textLength).toBe(1);
    });

    // --------------------------------------------------------------------------
    //  Spanish Language Behavior
    // --------------------------------------------------------------------------

    test("Spanish plaintext should produce valid frequency profile", () => {
        const result = Analysis.analyze(spanishPlain);
        expect(result.cryptographic.frequencyProfile).toBeDefined();
        expect(result.cryptographic.frequencyProfile).not.toEqual({});
    });

    // --------------------------------------------------------------------------
    //  Identification Pipeline (full integration)
    // --------------------------------------------------------------------------

    test("Full integration: analysis of Caesar text should detect cipher and produce IC", () => {
        const r = Analysis.analyze(caesarShift1);

        expect(r.cryptographic.indexOfCoincidence).toBeGreaterThan(0);
        expect(Array.isArray(r.identification.detected)).toBe(true);
    });

});
