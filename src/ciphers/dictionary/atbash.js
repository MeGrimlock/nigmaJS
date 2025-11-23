import { default as BasicCipher } from '../../core/basicCipher.js';

/**
 * Atbash is a monoalphabetic substitution cipher originally used to encrypt the Hebrew alphabet. 
 * It can be modified for use with any known writing system with a standard collating order.
 * @method constructor
 * @param {String} message to be encoded/decoded
 * @param {Boolean} encoded indicating if the message passed is encoded, default set to false
 * @param {Boolean} debug indicating if we need to print debug messages, default set to false
 */

export default class atbash extends BasicCipher {
	constructor(message, encoded = false, debug = false) {

		const alphabet = {
			'4': 'a',
			'3': 'b',
			'2': 'c',
			'1': 'd',
			'0': 'e',
			z: 'f',
			y: 'g',
			x: 'h',
			w: 'i',
			v: 'j',
			u: 'k',
			t: 'l',
			s: 'm',
			r: 'n',
			q: 'o',
			p: 'p',
			o: 'q',
			n: 'r',
			m: 's',
			l: 't',
			k: 'u',
			j: 'v',
			i: 'w',
			h: 'x',
			g: 'y',
			f: 'z',
			e: '0',
			d: '1',
			c: '2',
			b: '3',
			a: '4',
			'!': '5',
			'?': '6',
			',': '7',
			'.': '8',
			' ': '9',
			'9': ' ',
			'8': '.',
			'7': ',',
			'6': '?',
			'5': '!'
		};

		super(message, encoded, 'atbash', '', alphabet, debug);

		this.wordSep = ' ';
		this.characterSep = '';
		// Parametros: message,encoded,method,key,alphabet
		// constructor(message, encoded, method, key, alphabet, debug)
		// logMessage("constuctor",this);
	}

	/**
	 * @method encode
	 * @param message text to be encoded, if empty use sotred message
	 */

	encode = (message=this.message) =>
		this.encodeAlphabet(message, this.characterSep, this.wordSep);

	/**
	 * @method decode
	 * @param message text to be decoded, if empty use sotred message
	 */
	decode = (message=this.message) =>
		this.decodeAlphabet(message, this.characterSep, this.wordSep);
}

