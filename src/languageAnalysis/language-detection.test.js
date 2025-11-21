import { LanguageAnalysis } from '../languageAnalysis/analysis.js';

describe('Language Detection Accuracy', () => {
    
    const testCases = [
        {
            lang: 'english',
            text: 'US President Donald Trump has given Ukraine less than a week to accept his plan – widely seen as favoring Russia – to end the war, as President Volodymyr Zelensky said his country faced “one of the most difficult moments” in its history.'
        },
        {
            lang: 'spanish',
            text: 'El ingenioso hidalgo don Quijote de la Mancha es una novela escrita por el español Miguel de Cervantes Saavedra. Publicada su primera parte con el título de El ingenioso hidalgo don Quijote de la Mancha a comienzos de 1605, es la obra más destacada de la literatura española.'
        },
        {
            lang: 'german',
            text: 'Die Verwandlung ist eine Erzählung von Franz Kafka, die 1912 entstand und 1915 veröffentlicht wurde. Die Geschichte handelt von Gregor Samsa, der eines Morgens als riesiges Ungeziefer verwandelt aufwacht.'
        },
        {
            lang: 'french',
            text: 'Longtemps, je me suis couché de bonne heure. Parfois, à peine ma bougie éteinte, mes yeux se fermaient si vite que je n’avais pas le temps de me dire : « Je m’endors. »'
        },
        {
            lang: 'italian',
            text: 'Nel mezzo del cammin di nostra vita mi ritrovai per una selva oscura, ché la diritta via era smarrita. Ahi quanto a dir qual era è cosa dura esta selva selvaggia e aspra e forte che nel pensier rinova la paura!'
        },
        {
            lang: 'portuguese',
            text: 'As armas e os barões assinalados, Que da ocidental praia Lusitana, Por mares nunca de antes navegados, Passaram ainda além da Taprobana, Em perigos e guerras esforçados, Mais do que prometia a força humana.'
        },
        // Russian and Chinese use different alphabets, so they are easier, but good to test.
        {
            lang: 'russian',
            text: 'Все счастливые семьи похожи друг на друга, каждая несчастливая семья несчастлива по-своему. Все смешалось в доме Облонских.'
        },
        // Chinese is unique as N-gram analysis works differently (characters), let's see if our structure holds.
        {
            lang: 'chinese',
            text: '道可道，非常道。名可名，非常名。无名天地之始；有名万物之母。故常无，欲以观其妙；常有，欲以观其徼。'
        }
    ];

    testCases.forEach(({ lang, text }) => {
        test(`should correctly detect ${lang}`, () => {
            const results = LanguageAnalysis.detectLanguage(text);
            const topResult = results[0];
            
            // Log results for visibility during test run
            console.log(`Testing ${lang.toUpperCase()}: Detected -> ${topResult.language.toUpperCase()} (Score: ${topResult.score.toFixed(2)})`);
            
            // Verify the winner matches the expected language
            expect(topResult.language).toBe(lang);
            
            // Verify the score is reasonably low (good match)
            // Score < 50 is usually a very good match
            // We can be lenient here as short texts might have higher variance
            expect(topResult.score).toBeLessThan(200);
        });
    });

    test('should handle encoded text (simulation)', () => {
        // This simulates a Caesar cipher (shifted) text which preserves frequency distribution shapes
        // Original (English): "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG"
        // Shifted (+1): "UIF RVJDL CSPXO GPY KVNQT PWFS UIF MBAZ EPH"
        // Note: This text is too short for reliable statistical analysis, so we use a longer one.
        
        // Text: "DEFEND THE EAST WALL OF THE CASTLE" (English) -> Shifted
        const englishText = "DEFEND THE EAST WALL OF THE CASTLE";
        // Let's use a slightly longer one for stability
        const longerEnglish = "THE ENEMY IS ADVANCING FROM THE NORTH WE NEED REINFORCEMENTS IMMEDIATELY";
        // Simple Caesar shift +1
        const shiftText = (str) => str.split('').map(c => {
            if (c === ' ') return ' ';
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) {
                return String.fromCharCode(((code - 65 + 1) % 26) + 65);
            }
            return c;
        }).join('');

        const cipherText = shiftText(longerEnglish);
        
        const results = LanguageAnalysis.detectLanguage(cipherText);
        const topResult = results[0];

        console.log(`Testing ENCODED ENGLISH: Detected -> ${topResult.language.toUpperCase()} (Score: ${topResult.score.toFixed(2)})`);
        
        expect(topResult.language).toBe('english');
    });
});

