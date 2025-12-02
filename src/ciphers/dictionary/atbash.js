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

		// Atbash cipher: A↔Z, B↔Y, C↔X, etc.
		const alphabet = {
			// Uppercase letters
			'A': 'Z', 'B': 'Y', 'C': 'X', 'D': 'W', 'E': 'V',
			'F': 'U', 'G': 'T', 'H': 'S', 'I': 'R', 'J': 'Q',
			'K': 'P', 'L': 'O', 'M': 'N',
			'N': 'M', 'O': 'L', 'P': 'K', 'Q': 'J', 'R': 'I',
			'S': 'H', 'T': 'G', 'U': 'F', 'V': 'E', 'W': 'D',
			'X': 'C', 'Y': 'B', 'Z': 'A',

			// Lowercase letters
			'a': 'z', 'b': 'y', 'c': 'x', 'd': 'w', 'e': 'v',
			'f': 'u', 'g': 't', 'h': 's', 'i': 'r', 'j': 'q',
			'k': 'p', 'l': 'o', 'm': 'n',
			'n': 'm', 'o': 'l', 'p': 'k', 'q': 'j', 'r': 'i',
			's': 'h', 't': 'g', 'u': 'f', 'v': 'e', 'w': 'd',
			'x': 'c', 'y': 'b', 'z': 'a'
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

