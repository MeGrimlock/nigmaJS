import { NgramScorer, quickScore, createNgramScorer } from '../ngram-scorer.js';

describe('NgramScorer', () => {

    // -------------------------
    // CONSTRUCTOR
    // -------------------------
    describe('Constructor behavior', () => {

        it('should create a scorer for a supported language', () => {
            const scorer = new NgramScorer('english');
            expect(scorer).toBeDefined();
            expect(scorer.language).toBe('english');
            expect(scorer.model).toBeDefined();
        });

        it('should fallback to English when given an unsupported language', () => {
            const scorer = new NgramScorer('klingon-especial');
            expect(scorer.language).toBe('english');
            expect(scorer.model).toBeDefined();
        });

        it('should not crash when preferredNgramLength does not exist', () => {
            const scorer = new NgramScorer('english', 999);
            expect(scorer.model).toBeDefined();
        });
    });

    // -------------------------
    // SCORE
    // -------------------------
    describe('Score function', () => {

        it('should return a number between 0 and 1 for valid English text', () => {
            const scorer = new NgramScorer('english');
            const score = scorer.score('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG');
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(1);
        });

        it('should give higher scores for English text than random text', () => {
            const scorer = new NgramScorer('english');

            const english = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG AND RUNS INTO THE FOREST WHERE IT RESTS';
            const random  = 'QWERTASDFGZXCVBPLMNBQWERTASDFGZXCVBPLMNBQWERTASDFGZXCVBPLM';

            const englishScore = scorer.score(english);
            const randomScore  = scorer.score(random);

            expect(englishScore).toBeGreaterThan(randomScore);
        });

        it('should return 0 for text shorter than minimum n-gram length', () => {
            const scorer = new NgramScorer('english');
            const score = scorer.score('A'); // too short
            expect(score).toBe(0);
        });

        it('should not crash if text is undefined/null', () => {
            const scorer = new NgramScorer('english');

            expect(() => scorer.score(undefined)).not.toThrow();
            expect(() => scorer.score(null)).not.toThrow();

            expect(scorer.score(undefined)).toBeGreaterThanOrEqual(0);
        });

        it('should fallback to trigram model if quadgram model cannot be used', () => {
            const scorer = new NgramScorer('english', 4);

            const shortText = 'HELLO'; // length 5 ⇒ quadgrams need len >= 4, OK, but test fallback forcing
            const score = scorer.score(shortText, { useFallback: true });

            expect(typeof score).toBe('number');
            expect(score).toBeGreaterThanOrEqual(0);
        });
    });

    // -------------------------
    // scoreMultiple
    // -------------------------
    describe('scoreMultiple', () => {

        it('should return the text with the highest score as bestText', () => {
            const scorer = new NgramScorer('english');
        
            const texts = [
                'QWERTASDFGZXCVB',
                'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
                'ZZZZZZZZZZZZZZZZZZZ'
            ];
        
            const result = scorer.scoreMultiple(texts);
        
            // Debe tener 3 resultados
            expect(result.scores.length).toBe(3);
        
            // El bestScore debe ser el score máximo
            const maxScore = Math.max(...result.scores.map(s => s.score));
            expect(result.bestScore).toBe(maxScore);
        
            // El bestText debe ser el texto cuyo score === maxScore
            const expectedText = result.scores.find(s => s.score === maxScore).text;
            expect(result.bestText).toBe(expectedText);
        });
        

        it('should not crash when array contains undefined or null', () => {
            const scorer = new NgramScorer('english');
            const result = scorer.scoreMultiple([undefined, null, 'HELLO WORLD']);

            expect(result).toBeDefined();
            expect(result.scores.length).toBe(3);
        });
    });

    // -------------------------
    // getRawScore
    // -------------------------
    describe('getRawScore', () => {

        it('should return a finite number for English text', () => {
            const scorer = new NgramScorer('english');
            const raw = scorer.getRawScore('THE QUICK BROWN FOX JUMPS');
            expect(Number.isFinite(raw)).toBe(true);
        });

        it('should fallback to fallbackModel raw scores when needed', () => {
            const scorer = new NgramScorer('english', 4);
            const raw = scorer.getRawScore('HELLO'); // fallback to trigrams
            expect(Number.isFinite(raw)).toBe(true);
        });

        it('should not crash on undefined/null', () => {
            const scorer = new NgramScorer('english');

            expect(() => scorer.getRawScore(undefined)).not.toThrow();
            expect(() => scorer.getRawScore(null)).not.toThrow();
        });
    });

    // -------------------------
    // quickScore & factory
    // -------------------------
    describe('quickScore and createNgramScorer', () => {

        it('quickScore should work without crashing', () => {
            const score = quickScore('HELLO WORLD');
            expect(score).toBeGreaterThanOrEqual(0);
        });

        it('createNgramScorer should return a valid instance', () => {
            const scorer = createNgramScorer('spanish', 3);
            expect(scorer).toBeInstanceOf(NgramScorer);
        });
    });

});
