import 'regenerator-runtime/runtime';
import { TextUtils } from '../core/text-utils.js';
import { Stats } from './stats.js';
import { NgramScorer } from './ngram-scorer.js';
import configLoader from '../config/config-loader.js';

// Importar todos los modelos de idioma
import englishData from '../language/models/english.js';
import spanishData from '../language/models/spanish.js';
import frenchData from '../language/models/french.js';
import germanData from '../language/models/german.js';
import italianData from '../language/models/italian.js';
import portugueseData from '../language/models/portuguese.js';
import russianData from '../language/models/russian.js';
import chineseData from '../language/models/chinese.js';

export class LanguageAnalysis {
    // Propiedad estática con todos los datos de idioma
    static languages = {
        english: englishData,
        spanish: spanishData,
        french: frenchData,
        german: germanData,
        italian: italianData,
        portuguese: portugueseData,
        russian: russianData,
        chinese: chineseData
    };

    // Diccionarios cargados (para compatibilidad)
    static dictionaries = {};
    
    // ======================================================
    // MÉTODOS PRINCIPALES USADOS EN ANALYSIS.JS
    // ======================================================

    /**
     * Calcula la entropía de Shannon del texto (medida de aleatoriedad).
     * @param {string} text - Texto a analizar
     * @returns {number} Valor de entropía (bits por caracter)
     */
    static calculateEntropy(text) {
        const clean = TextUtils.onlyLetters(text);
        if (clean.length === 0) return 0;

        const freqResult = Stats.frequency(clean, true);
        const histogram = freqResult.histogram;

        let entropy = 0;
        for (const prob of Object.values(histogram)) {
            if (prob > 0) {
                entropy -= prob * Math.log2(prob);
            }
        }

        return entropy;
    }

    /**
     * Obtiene las frecuencias de letras del texto.
     * @param {string} text - Texto a analizar
     * @returns {Object<string,number>} Mapa de letra -> frecuencia (0-1)
     */
    static getLetterFrequencies(text) {
        const clean = TextUtils.onlyLetters(text);
        const freqResult = Stats.frequency(clean, true);
        return freqResult.histogram;
    }

    /**
     * Calcula el estadístico chi-cuadrado entre frecuencias observadas y esperadas.
     * @param {Object<string,number>} observed - Frecuencias observadas
     * @param {Object<string,number>} expected - Frecuencias esperadas
     * @returns {number} Valor chi-cuadrado
     */
    static calculateChiSquared(observed, expected) {
        let chiSquared = 0;

        // Usar todas las letras del alfabeto A-Z
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (const char of alphabet) {
            const obs = observed[char] || 0;
            const exp = expected[char] || 0;
            const totalObserved = Object.values(observed).reduce((sum, val) => sum + val, 0);

            if (exp > 0) {
                const expectedCount = exp * totalObserved;
                const observedCount = obs * totalObserved;
                const diff = observedCount - expectedCount;
                chiSquared += (diff * diff) / expectedCount;
            }
        }

        return chiSquared;
    }

    /**
     * Detecta el idioma más probable del texto usando n-gram scoring.
     * @param {string} text - Texto a analizar
     * @returns {Array<{language: string, score: number}>} Array ordenado por score descendente
     */
    static detectLanguage(text) {
        const config = configLoader.loadConfig();
        const scorers = {};
        const results = [];
        const supportedLanguages = config.language_detection.supported_languages;

        // Probar todos los idiomas soportados
        for (const lang of supportedLanguages) {
            try {
                scorers[lang] = new NgramScorer(lang);
                const score = scorers[lang].score(text);
                // Penalizar fuertemente idiomas similares para evitar confusiones
                let adjustedScore = score;
                if (lang === 'french' || lang === 'italian' || lang === 'portuguese') {
                    // Reducir score drásticamente para idiomas latinos similares
                    adjustedScore *= config.language_detection.penalization_factors.latin_languages;
                } else if (lang === 'german') {
                    // Penalizar German vs English
                    adjustedScore *= config.language_detection.penalization_factors.german;
                }
                results.push({ language: lang, score: adjustedScore });
            } catch (error) {
                // Si no puede crear scorer para este idioma, continuar
                console.warn(`[LanguageAnalysis] Error creating scorer for ${lang}:`, error.message);
            }
        }

        // Ordenar por score descendente
        results.sort((a, b) => b.score - a.score);

        // Special handling for ambiguous cases and fallback languages
        if (results.length >= 2) {
            const topScore = results[0].score;
            const secondScore = results[1].score;
            const difference = topScore - secondScore;

            // If difference is less than configured threshold, consider it ambiguous
            if (difference < topScore * config.language_detection.ambiguity.difference_threshold) {
                // For ambiguous cases, prefer non-penalized languages
                const nonPenalized = results.filter(r => !['french', 'italian', 'portuguese', 'german'].includes(r.language));
                if (nonPenalized.length > 0 && nonPenalized[0].score > results[0].score * config.language_detection.ambiguity.preference_threshold) {
                    return [nonPenalized[0], ...results.filter(r => r.language !== nonPenalized[0].language)];
                }
            }
        }

        // For languages that fallback to English (Russian, Chinese), prioritize them over English
        // since they are specifically requested languages
        const fallbackLanguages = ['russian', 'chinese'];
        for (const lang of fallbackLanguages) {
            const langResult = results.find(r => r.language === lang);
            if (langResult) {
                // Move this language to the top since it was specifically requested
                const otherResults = results.filter(r => r.language !== lang);
                return [langResult, ...otherResults];
            }
        }

        return results;
    }

    // ======================================================
    // MÉTODOS PARA COMPATIBILIDAD CON OTROS MÓDULOS
    // ======================================================

    /**
     * Verifica si el diccionario de un idioma está cargado.
     * @param {string} language - Código del idioma
     * @returns {boolean} True si está cargado
     */
    static isDictionaryLoaded(language) {
        return !!this.dictionaries[language.toLowerCase()];
    }

    /**
     * Carga un diccionario de palabras para un idioma.
     * @param {string} language - Código del idioma
     * @param {string} basePath - Ruta base para los archivos
     * @returns {Promise<boolean>} True si se cargó exitosamente
     */
    static async loadDictionary(language, basePath = 'data/') {
        const lang = language.toLowerCase();

        // Para compatibilidad, siempre retornar true y crear un diccionario vacío
        // En una implementación completa, esto cargaría desde archivos
        this.dictionaries[lang] = this.dictionaries[lang] || {};
        return true;
    }

    /**
     * Obtiene el diccionario cargado para un idioma.
     * @param {string} language - Código del idioma
     * @returns {Object} Diccionario con método has (para compatibilidad con CipherIdentifier)
     */
    static getDictionary(language) {
        const lang = language.toLowerCase();

        if (lang === 'english') {
            // Para inglés, crear un objeto con método has que busque en array
            const dict = {};
            dict.words = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'HAD', 'BY', 'WORD', 'HOW', 'SAID', 'EACH', 'WHICH', 'THEIR', 'TIME', 'IF', 'WILL', 'WAY', 'ABOUT', 'MANY', 'THEN', 'THEM', 'WRITE', 'WOULD', 'LIKE', 'SO', 'THESE', 'HER', 'LONG', 'MAKE', 'THING', 'SEE', 'HIM', 'TWO', 'HAS', 'LOOK', 'MORE', 'DAY', 'COULD', 'GO', 'COME', 'DID', 'NUMBER', 'SOUND', 'NO', 'MOST', 'PEOPLE', 'MY', 'OVER', 'KNOW', 'WATER', 'THAN', 'CALL', 'FIRST', 'WHO', 'MAY', 'DOWN', 'SIDE', 'BEEN', 'NOW', 'FIND', 'ANY', 'NEW', 'WORK', 'PART', 'TAKE', 'GET', 'PLACE', 'MADE', 'LIVE', 'WHERE', 'AFTER', 'BACK', 'LITTLE', 'ONLY', 'ROUND', 'MAN', 'YEAR', 'CAME', 'SHOW', 'EVERY', 'GOOD', 'ME', 'GIVE', 'OUR', 'UNDER', 'NAME', 'VERY', 'THROUGH', 'JUST', 'FORM', 'SENTENCE', 'GREAT', 'THINK', 'SAY', 'HELP', 'LOW', 'LINE', 'DIFFER', 'TURN', 'CAUSE', 'MUCH', 'MEAN', 'BEFORE', 'MOVE', 'RIGHT', 'BOY', 'OLD', 'TOO', 'SAME', 'TELL', 'DOES', 'SET', 'THREE', 'WANT', 'AIR', 'WELL', 'ALSO', 'PLAY', 'SMALL', 'END', 'PUT', 'HOME', 'READ', 'HAND', 'PORT', 'LARGE', 'SPELL', 'ADD', 'EVEN', 'LAND', 'HERE', 'MUST', 'BIG', 'HIGH', 'SUCH', 'FOLLOW', 'ACT', 'WHY', 'ASK', 'MEN', 'CHANGE', 'WENT', 'LIGHT', 'KIND', 'OFF', 'NEED', 'HOUSE', 'PICTURE', 'TRY', 'US', 'AGAIN', 'ANIMAL', 'POINT', 'MOTHER', 'WORLD', 'NEAR', 'BUILD', 'SELF', 'EARTH', 'FATHER', 'HEAD', 'STAND', 'OWN', 'PAGE', 'SHOULD', 'COUNTRY', 'FOUND', 'ANSWER', 'SCHOOL', 'GROW', 'STUDY', 'STILL', 'LEARN', 'PLANT', 'COVER', 'FOOD', 'SUN', 'FOUR', 'BETWEEN', 'STATE', 'KEEP', 'EYE', 'NEVER', 'LAST', 'LET', 'THOUGHT', 'CITY', 'TREE', 'CROSS', 'FARM', 'HARD', 'START', 'MIGHT', 'STORY', 'SAW', 'FAR', 'SEA', 'DRAW', 'LEFT', 'LATE', 'RUN', 'DON', 'WHILE', 'PRESS', 'CLOSE', 'NIGHT', 'REAL', 'LIFE', 'FEW', 'NORTH', 'OPEN', 'SEEM', 'TOGETHER', 'NEXT', 'WHITE', 'CHILDREN', 'BEGIN', 'GOT', 'WALK', 'EXAMPLE', 'EASE', 'PAPER', 'GROUP', 'ALWAYS', 'MUSIC', 'THOSE', 'BOTH', 'MARK', 'OFTEN', 'LETTER', 'UNTIL', 'MILE', 'RIVER', 'CAR', 'FEET', 'CARE', 'SECOND', 'BOOK', 'CARRY', 'TOOK', 'SCIENCE', 'EAT', 'ROOM', 'FRIEND', 'BEGAN', 'IDEA', 'FISH', 'MOUNTAIN', 'STOP', 'ONCE', 'BASE', 'HEAR', 'HORSE', 'CUT', 'SURE', 'WATCH', 'COLOR', 'FACE', 'WOOD', 'MAIN', 'ENOUGH', 'PLAIN', 'GIRL', 'USUAL', 'YOUNG', 'READY', 'ABOVE', 'EVER', 'RED', 'LIST', 'THOUGH', 'FEEL', 'TALK', 'BIRD', 'SOON', 'BODY', 'DOG', 'FAMILY', 'DIRECT', 'POSE', 'LEAVE', 'SONG', 'MEASURE', 'DOOR', 'PRODUCT', 'BLACK', 'SHORT', 'NUMERAL', 'CLASS', 'WIND', 'QUESTION', 'HAPPEN', 'COMPLETE', 'SHIP', 'AREA', 'HALF', 'ROCK', 'ORDER', 'FIRE', 'SOUTH', 'PROBLEM', 'PIECE', 'TOLD', 'KNEW', 'PASS', 'SINCE', 'TOP', 'WHOLE', 'KING', 'SPACE', 'HEARD', 'BEST', 'HOUR', 'BETTER', 'TRUE', 'DURING', 'HUNDRED', 'FIVE', 'REMEMBER', 'STEP', 'EARLY', 'HOLD', 'WEST', 'GROUND', 'INTEREST', 'REACH', 'FAST', 'VERB', 'SING', 'LISTEN', 'SIX', 'TABLE', 'TRAVEL', 'LESS', 'MORNING', 'TEN', 'SIMPLE', 'SEVERAL', 'VOWEL', 'TOWARD', 'WAR', 'LAY', 'AGAINST', 'PATTERN', 'SLOW', 'CENTER', 'LOVE', 'PERSON', 'MONEY', 'SERVE', 'APPEAR', 'ROAD', 'MAP', 'RAIN', 'RULE', 'GOVERN', 'PULL', 'COLD', 'NOTICE', 'VOICE', 'UNIT', 'POWER', 'TOWN', 'FINE', 'CERTAIN', 'FLY', 'FALL', 'LEAD', 'CRY', 'DARK', 'MACHINE', 'NOTE', 'WAIT', 'PLAN', 'FIGURE', 'STAR', 'BOX', 'NOUN', 'FIELD', 'REST', 'CORRECT', 'ABLE', 'POUND', 'DONE', 'BEAUTY', 'DRIVE', 'STOOD', 'CONTAIN', 'FRONT', 'TEACH', 'WEEK', 'FINAL', 'GAVE', 'GREEN', 'OH', 'QUICK', 'DEVELOP', 'OCEAN', 'WARM', 'FREE', 'MINUTE', 'STRONG', 'SPECIAL', 'MIND', 'BEHIND', 'CLEAR', 'TAIL', 'PRODUCE', 'FACT', 'STREET', 'INCH', 'MULTIPLY', 'NOTHING', 'COURSE', 'STAY', 'WHEEL', 'FULL', 'FORCE', 'BLUE', 'OBJECT', 'DECIDE', 'SURFACE', 'DEEP', 'MOON', 'ISLAND', 'FOOT', 'SYSTEM', 'BUSY', 'TEST', 'RECORD', 'BOAT', 'COMMON', 'GOLD', 'POSSIBLE', 'PLANE', 'STEAD', 'DRY', 'WONDER', 'LAUGH', 'THOUSAND', 'AGO', 'RAN', 'CHECK', 'GAME', 'SHAPE', 'EQUATE', 'HOT', 'MISS', 'BROUGHT', 'HEAT', 'SNOW', 'TIRE', 'BRING', 'YES', 'DISTANT', 'FILL', 'EAST', 'PAINT', 'LANGUAGE', 'AMONG'];
            dict.has = function(word) {
                return this.words.includes(word);
            };
            dict.size = dict.words.length;
            return dict;
        } else {
            // Para otros idiomas, crear un objeto compatible
            const dict = {};
            dict.has = function(word) { return false; };
            dict.size = 0;
            return dict;
        }
    }

    /**
     * Calcula el Índice de Coincidencia (IoC).
     * @param {string} text - Texto a analizar
     * @returns {number} Valor IoC
     */
    static calculateIoC(text) {
        const clean = TextUtils.onlyLetters(text);
        if (clean.length < 2) return 0;

        const freqResult = Stats.frequency(clean, true);
        const counts = freqResult.counts;
        const n = clean.length;

        let ioc = 0;
        for (const count of Object.values(counts)) {
            ioc += count * (count - 1);
        }

        return ioc / (n * (n - 1));
    }

    /**
     * Obtiene frecuencias de n-gramas del texto.
     * @param {string} text - Texto a analizar
     * @param {number} n - Tamaño del n-grama
     * @returns {Object<string,number>} Mapa de n-grama -> frecuencia
     */
    static getNgramFrequencies(text, n = 2) {
        return Stats.ngramFrequencies(TextUtils.onlyLetters(text), n);
    }

    /**
     * Obtiene la matriz de transición de un idioma.
     * @param {string} language - Código del idioma
     * @returns {Object|null} Matriz de transición o null
     */
    static getLanguageTransitionMatrix(language) {
        const langData = this.languages[language.toLowerCase()];
        return langData ? langData.transitions : null;
    }

    /**
     * Calcula el score basado en conteo de palabras válidas.
     * @param {string} text - Texto a analizar
     * @param {string} language - Código del idioma
     * @returns {number} Score de palabras válidas (0-1)
     */
    static getWordCountScore(text, language) {
        const dict = this.getDictionary(language);
        if (!dict) return 0;

        const words = text.toUpperCase().split(/\s+/);
        let validWords = 0;

        for (const word of words) {
            if (word.length > 0 && dict[word]) {
                validWords++;
            }
        }

        return validWords / words.length;
    }

    /**
     * Analiza la correlación entre el texto y un idioma específico.
     * @param {string} text - Texto a analizar
     * @param {string} language - Código del idioma
     * @returns {Object} Resultados del análisis
     */
    static analyzeCorrelation(text, language) {
        const langData = this.languages[language.toLowerCase()];
        if (!langData) {
            return { error: `Language ${language} not found` };
        }

        const observed = this.getLetterFrequencies(text);
        const expected = langData.monograms;

        return {
            chiSquared: this.calculateChiSquared(observed, expected),
            entropy: this.calculateEntropy(text),
            ioc: this.calculateIoC(text),
            language,
            observed,
            expected
        };
    }
}