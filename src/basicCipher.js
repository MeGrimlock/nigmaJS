/* eslint-disable no-unused-expressions */
/* eslint-disable no-return-assign */

/**
 * BasicCipher 
 * Template class for creating new Ciphers, all I create extends this class.
 * In cryptography, a cipher (or cypher) is an algorithm for performing encryption or decryption—a series of well-defined steps that can be followed as a procedure. An alternative, less common term is encipherment. 
 * To encipher or encode is to convert information into cipher or code. In common parlance, "cipher" is synonymous with "code", as they are both a set of steps that encrypt a message; 
 * However, the concepts are distinct in cryptography, especially classical cryptography.
 * Codes generally substitute different length strings of character in the output, while ciphers generally substitute the same number of characters as are input. 
 * There are exceptions and some cipher systems may use slightly more, or fewer, characters when output versus the number that were input.
 * https://en.wikipedia.org/wiki/Cipher
 * 
 * @since 1.0.0
 * @method constructor
 * @param {String} message the message that is going to be processed by the cipher
 * @param {Boolean} encoded boolean indicating whether or not the message is encoded
 * @param {String} method a String that indicates which cipher is being used
 * @param {String} key when the cipher needs a key, we store it here
 * @param {Object} alphabet when the cipher needs an alphabet, we store it here albhabet is an array of key:value pairs
 * @param {Boolean} debug boolean indicating whether or not to display debug messages
 * @returns {Object} new cipher with all its properties and methods
 * @example 
 * const myCipher = new BasicCipher("Texto to encode",false,"cool new methods name","if theres a key","if theres an alphabet",false)
 
 */

export default class BasicCipher {


	constructor(message, encoded, method, key, alphabet, debug) {
	
		this.message = message;
		this.encoded = encoded;
		this.method = method;
		this.key = key || '';
		this.alphabet = alphabet;
		this.debug = debug;
	}

	// --------------------------------------------------GETs--------------------------------------------------
	getMsg = () => this.message;

	getEncoded = () => this.encoded;

	getMethod = () => this.method;

	getKey = () => this.key;

	getAlphabet = () => this.alphabet;

	// --------------------------------------------------SETs--------------------------------------------------
	/**
	 * @method setMsg
	 * @param {String} newMessage message that we want to store in the cipher
	 */
	setMsg(newMessage) {
		return (this.message = newMessage);
	}
	
	/**
	 * @method setEncoded
	 * @param {Boolean} newEncoded encoded is a boolean that indicates if the stored message is or not encoded
	 */

	setEncoded(newEncoded) {
		return (this.encoded = newEncoded);
	}

	/**
	 * @method setMethod
	 * @param {String} newMethod 
	 */

	setMethod(newMethod) {
		return (this.method = newMethod);
	}

	/**
	 * @param setKey 
	 * @param {String} newKey 
	 */

	setKey(newKey) {
		return (this.key = newKey);
	}

	/**
	 * @method setAlphabet
	 * @param {Object} newAlphabet [key:value]
	 */

	setAlphabet(newAlphabet) {
		return (this.alphabet = newAlphabet);
	}
	// ----------------------------------------------------Usefull methods----------------------------------------------------
	/**
	 * Based upod Caesar shift method, works for letter only, any other character like 0-9 or @ # $, etc. will be ignored.
	 *
	 * @method shiftCharacters
	 * @param {String} String to be shifted
	 * @param {Number} shift indicates the number of characters the alphabet is to be rotated
	 * @returns {String} shifted text
	 * */

	shiftCharacters = (str, shift = 1) => {	

		let amount = shift;
		Math.abs(amount) > 26 ? (amount %= 26) : null;
		amount < 0 ? (amount += 26) : amount;
		let output = '';
		for (let i = 0; i < str.length; i += 1) {
			let c = str[i];
			// If it's a letter...
			if (c.match(/[a-z]/i)) {
				const code = str.charCodeAt(i);
				if (code >= 65 && code <= 90) {
					// Uppercase letters
					const temp = c;
					c = String.fromCharCode(((code - 65 + amount) % 26) + 65);
					// console.log(temp, "->", c);
				} else if (code >= 97 && code <= 122) {
					// Lowercase letters
					c = String.fromCharCode(((code - 97 + amount) % 26) + 97);
				}
			}
			// Append
			output += c;
		}
		return output;
	};

	/**
	 * Transform a text into equally sized character blocks. Example: ABC DEFGH IJ KLM NOPQR S TUVW XYZ -(5)-> ABCDE FGHIJ KLMNO PQRST UVWXY Z
	 * @method text2block
	 * @param {String} text to be processed
	 * @param {Number} blockSize is the size of the chunks
	 * @returns {String} chunked text
	 */

	text2block = (text, blockSize = 1) => {

		let str = text;
		str = str.replace(/ /g, '');
		let temp = str[0];
		let index = 1;
		do {
			if (index % blockSize === 0) temp += ' ';
			temp += str[index];
			index += 1;
		} while (index < str.length);

		return temp;
	};

	// --------------------------------------------------Alphabet methods--------------------------------------------------

	/**
	 * Basic method for encoding using an alphabet Steps: 
	 * 1st: filter all chars not included on alphabet 
	 * 2nd: separate by word using the wordsplit separator 
	 * 3nd: lookup for key coresponding to value 
	 * 4th: after the convertion, add the char separator 
	 * 5th: repeat for all chars steps 3 & 4
	 * 
	 * @method encodeAlphabet
	 * @param {String} message text to encode using substitution alphabet
	 * @param {String} charSplit character to be placed after each character is processed
	 * @param {String} wordSplit character to be placed to indicate that a word is porocessed
	 * @returns {String} encoded message
	 */

	encodeAlphabet = (
		message = this.message,
		charSplit = '',
		wordSplit = ' '
	) => {
		let originalMessage = '';
		let encodedMessage = '';
		// originalMessage = this.message.toLowerCase().replace(/[^a-z]/g, "");
		originalMessage = message.toLowerCase();
		originalMessage.split(' ').map(word => {
			word.split('').map(letter => {
				const encodedChar = this.getKeyByValue(this.alphabet, letter);

				encodedChar !== undefined
					? (encodedMessage += encodedChar + charSplit)
					: null;
			});
			charSplit.length > 0
				? (encodedMessage = encodedMessage.slice(0, -charSplit.length))
				: null;
			encodedMessage += wordSplit;
		});
		wordSplit.length > 0
			? (encodedMessage = encodedMessage.slice(0, -wordSplit.length))
			: null;

		return encodedMessage;
	};

	/**
	 * Basic method for decoding when alphabet substitution method is used.
	 * @method decodeAlphabet
	 * @param {String} message text to be decoded
	 * @param {String} charSplit character that indicates encoded characters separation
	 * @param {String} wordSplit character that indicates encoded words separation
	 * @returns {String} decoded message
	 */

	decodeAlphabet = (
		message = this.message,
		charSplit = '',
		wordSplit = ' '
	) => {
		
		let messageDecoded = '';

		message.split(wordSplit).map(word => {
			word.split(charSplit).map(letter => {
				const encodedChar = this.alphabet[letter];
				encodedChar !== undefined ? (messageDecoded += encodedChar) : null;
			});
			messageDecoded += ' ';
		});
		messageDecoded = messageDecoded.slice(0, -1);

		return messageDecoded;
	};
	// --------------------------------------------------Aux methods--------------------------------------------------
	
	/**
	 * Auxiliary method for validating if the key passed is ok and if the message is not empty
	 * 
	 * @method validateEncoded 
	 * @returns {Boolean} true if everything is ok
	 */

	validateEncoded = () =>
		this.encoded === true &&
		typeof (this.message != null) &&
		this.message !== '';

	/**
	 * Sort values based on the first item on the row
	 * @method sortColumns
	 * @param {*} a 
	 * @param {*} b 
	 */

	sortColumns(a, b) {
		if (a[0] === b[0]) {
			return 0;
		}
		return a[0] < b[0] ? -1 : 1;
	}

	/**
	 * Receives a 2D matrix and transposes it
	 * @method transposeMatrix
	 * @param {Array} matrix receives a 2D matrix and transposes it
	 * @returns {Array} 
	 */

	transposeMatrix = array => array[0].map((col, i) => array.map(row => row[i]));

	/**
	 * Aux method to find a key by it's associated value
	 * @method getKeyByValue
	 * @param {Object} list An array of key:value pairs
	 * @param {String} value that we want to use as needle to find its key
	 * @returns {String} key
	 */

	getKeyByValue = (object, value) =>
		Object.keys(object).find(key => object[key] === value);

	/**
	 * Method for outputting messages into console, by default it is disabled
	 * @method logMessage 
	 * @param {String} text 
	 */

	logMessage = output => {
		if (this.debug) {
			// console.log(output);
		}
	};

	
	test = () => 'NigmaJS enabled';
}
