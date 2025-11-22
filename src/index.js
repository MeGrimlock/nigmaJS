import 'regenerator-runtime/runtime';
import { default as BasicCipher } from './basicCipher.js';

import {
	spanishLetterFrequencies,
	spanishBigramFrequencies,
	spanishTrigramFrequencies,
	spanishQuadgramFrequencies,
	LanguageAnalysis
} from './languageAnalysis/analysis.js';

import { default as Columnar } from './methods/columnar/columnar.js';
import { default as Dictionary } from './methods/dictionary/dictionary.js';
import { default as Shift } from './methods/shift/shift.js';
import { default as Enigma } from './methods/enigma/enigma.js';
import { default as Polyalphabetic } from './methods/polyalphabetic/polyalphabetic.js';
import { HMMSolver } from './decryption/hmm-solver.js';
import { VigenereSolver } from './decryption/vigenere-solver.js';

/** 
 * Nigma Class, is a super class that uses all available methods in this library, it imports everything so that it can any method can be called from here.
 * It has 2 uses: 1) Access all methods and 2) Add cryptanalysis methods to the library.
 * As a way of simplifying the implementation, the different methods are all grouped in the corresponding JS files with the same name as the folder that contains them.
 * Therefore imports are-> COLUMNAR, SHIFT and DICTIONARY methods.
 * 
 * @method constructor
 * @param {String} message
 * @returns {Object} An Object with access to all nigmaJS classes
*/


export default class Nigma {

	constructor(message = '') {
		this.testMessages = [
			'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
			'Las dos jornadas tuvieron un denominador común: insistir, y mucho, en educar en temas financieros, a los efectos de que la gente tenga claro cuáles son las ventajas y riesgos a los que se enfrenta.',
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dapibus suscipit velit vitae vulputate. Vivamus vel tempus lacus. Fusce dictum, leo id porttitor dapibus, leo diam rutrum nulla, ut feugiat',
			'La posición de Washington hacia las elecciones en Palestina ha sido coherente. Las elecciones fueron postergadas hasta la muerte de Yasser Arafat, que fue recibida como una oportunidad para la realización  '
		];

		this.message = message;
		this.alphabet = {
			a: '',
			b: '',
			c: '',
			d: '',
			e: '',
			f: '',
			g: '',
			h: '',
			i: '',
			j: '',
			k: '',
			l: '',
			m: '',
			n: '',
			o: '',
			p: '',
			q: '',
			r: '',
			s: '',
			t: '',
			u: '',
			v: '',
			w: '',
			x: '',
			y: '',
			z: '',
			'0': '0',
			'1': '1',
			'2': '2',
			'3': '3',
			'4': '4',
			'5': '5',
			'6': '6',
			'7': '7',
			'8': '8',
			'9': '9',
			' ': ' ',
			'.': '.',
			',': ',',
			'?': '?',
			'!': '!'
		};
	}

    // Static access to modules
	static Shift = Shift;
	static Polyalphabetic = Polyalphabetic;
	static Dictionary = Dictionary;
	static Columnar = Columnar;
	static Enigma = Enigma;
	static LanguageAnalysis = LanguageAnalysis;
    static HMMSolver = HMMSolver;
    static VigenereSolver = VigenereSolver;

	// -------------------------------------------Dictionary Criptoanalysis Methods -------------------------------------------

	getTestMessage = number => this.testMessages[number];

	getChar = cipheredChar => this.alphabet[cipheredChar];

	setChar = (cipheredChar, decodedChar) => {
		this.alphabet[cipheredChar] = decodedChar;
		return this.processMessage();
	};

	resetAlphabet = () => {
		Object.keys(this.alphabet).map((key, index) => (this.alphabet[key] = key));
		return this.processMessage();
	};

	swapChar = (char1, char2) => {
		// Receives 2 keys and swaps their values in the alphabet, since we are testing the script it also updates the text.
		const tempChar = this.alphabet[char1];
		this.alphabet[char1] = this.alphabet[char2];
		this.alphabet[char2] = tempChar;
		return this.processMessage();
	};

	setByFrequency = () => {
		/* The method takes the analyzed text alphabet and compares it with the default language frequency reference. 
	This way we have a start but notice that it works in a very unefficient way */

		const sortedRefFreq = this.sortProperties(this.freqAnalysis(this.message));
		const sortedMsgFreq = this.sortProperties(this.getSLFreq());

		let index = 0;
		do {
			// sortedMsgFreq[index][0] = sortedRefFreq[index][0];
			this.setChar(
				String(sortedMsgFreq[index][0]).toLowerCase(),
				String(sortedRefFreq[index][0]).toLowerCase()
			);
			index += 1;
		} while (index < sortedRefFreq.length - 1);
		// console.table(sortedMsgFreq);
		return this.processMessage();
	};

	processMessage = () => {
		// Using the generated alphabet, the ciphered text is processed in an attempt to decode it.
		let decodedMessage = '';
		const temp = this.message.split('');
		temp.forEach(element => {
			const decodedChar = this.alphabet[element];
			decodedChar !== ''
				? (decodedMessage += decodedChar)
				: (decodedMessage += '?');
		});
		return decodedMessage;
	};
	// ---------------------------------------Frequency Analysis Methods ---------------------------------------

	getSLFreq = () => spanishLetterFrequencies;

	getS2Freq = () => spanishBigramFrequencies;

	getS3Freq = () => spanishTrigramFrequencies;

	getS4Freq = () => spanishQuadgramFrequencies;

	freqAnalysis = (message = '') => {
		// Take all of the characters inside of a text and return an array with this characters as a % of the total
		const pseudoAlphabet = {};
		const auxText = message.split('');
		auxText.forEach(charElement => {
			if (charElement in pseudoAlphabet) {
				pseudoAlphabet[charElement] += 1;
			} else {
				pseudoAlphabet[charElement] = 1;
			}
		});
		const totalChars = auxText.length;
		/*
		for (const [key, value] of Object.entries(pseudoAlphabet)) {
			// Convert the number of repetitions into a %
			pseudoAlphabet[key] = parseFloat(((value / totalChars) * 100).toFixed(3));
		} */

		Object.keys(pseudoAlphabet).forEach(key => {
			const value = pseudoAlphabet[key];
			pseudoAlphabet[key] = parseFloat(((value / totalChars) * 100).toFixed(3));
		});

		return pseudoAlphabet;
	};

	// ---------------------------------------Auxiliary Analysis Methods ---------------------------------------

	sortProperties = (myArray, order = 'desc') => {
		// Take an Object with Key:vlaue pairs and return an array ordered according to the order parameter
		const sortable = [];

		myArray.forEach(element => {
			sortable.push([element, myArray[element]]);
		});

		order === 'asc'
			? sortable.sort((a, b) => a[1] - b[1])
			: sortable.sort((a, b) => b[1] - a[1]);
		return sortable;
	};
}

export { BasicCipher, Columnar, Dictionary, Shift, Enigma, Polyalphabetic, LanguageAnalysis, HMMSolver, VigenereSolver };
