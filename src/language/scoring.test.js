import { Scorers } from './scorers.js';
import { NGramModel } from './ngram-model.js';

describe('Phase 2: N-Gram Models & Scoring', () => {
    
    // Using texts that contain specific quadgrams present in our sparse data models
    // to ensure correct identification despite limited dictionary size.
    // Spanish Data includes: ESTA, PARA, ENTE, CION
    const SPANISH_TEXT = "ESTA SITUACION ES PARA LA GENTE";
    
    // English Data includes: THAT, TION, MENT, WITH
    const ENGLISH_TEXT = "THAT RELATIONSHIP WITH THE GOVERNMENT";
    
    // German Data includes: EINE, ISCH, LICH, ENDE
    const GERMAN_TEXT = "EINE GESCHICHTE ENDE AUCH SCHNELL";
    
    test('NGramModel should compute scores correctly', () => {
        // Create a mini model for testing with percentages (sum ~100)
        const miniMap = { "THE": 60, "AND": 40 }; 
        const model = new NGramModel(miniMap, 3);
        
        // P(THE) = 60/100 = 0.6. Log10(0.6) ≈ -0.2218
        // Our implementation: log10(60) - 2 = 1.778 - 2 = -0.2218
        
        const scoreKnown = model.score("THE");
        expect(scoreKnown).toBeCloseTo(Math.log10(0.6), 2);
        
        const scoreUnknown = model.score("XYZ");
        // Should be floor (-7)
        expect(scoreUnknown).toBe(-7);
    });

    test('Spanish text should score highest in Spanish model', () => {
        const ranking = Scorers.rankLanguages(SPANISH_TEXT);
        
        // console.table(ranking);

        expect(ranking[0].lang).toBe('spanish');
        // Ensure significant margin
        expect(ranking[0].score).toBeGreaterThan(ranking[1].score + 1); 
    });

    test('English text should score highest in English model', () => {
        const ranking = Scorers.rankLanguages(ENGLISH_TEXT);
        expect(ranking[0].lang).toBe('english');
    });

    test('German text should score highest in German model', () => {
        const ranking = Scorers.rankLanguages(GERMAN_TEXT);
        expect(ranking[0].lang).toBe('german');
    });

    test('Scrambled text should have low scores across the board', () => {
        const scrambled = "XQZJK LMVWP RBTYH DGFCN SKWOA";
        const ranking = Scorers.rankLanguages(scrambled);
        
        // All should be floor or close to it
        // Length 29 chars -> ~26 quadgrams. 26 * -7 = -182.
        expect(ranking[0].score).toBeLessThan(-100); 
    });

    test('Scorers.scoreText works for specific lookup', () => {
        const esScore = Scorers.scoreText(SPANISH_TEXT, 'spanish');
        const enScore = Scorers.scoreText(SPANISH_TEXT, 'english');
        
        expect(esScore).toBeGreaterThan(enScore);
    });
});
