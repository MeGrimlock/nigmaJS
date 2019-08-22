/* eslint-disable no-unused-expressions */
/* eslint-disable no-return-assign */
export default class BasicCipher {
	/*
	 
	In cryptography, a cipher (or cypher) is an algorithm for performing encryption or decryption—a series of 
	well-defined steps that can be followed as a procedure. An alternative, less common term is encipherment. 
	 
	To encipher or encode is to convert information into cipher or code. 
	In common parlance, "cipher" is synonymous with "code", 
	as they are both a set of steps that encrypt a message; 
	 
	However, the concepts are distinct in cryptography, especially classical cryptography.

	Codes generally substitute different length strings of character in the output, 
	while ciphers generally substitute the same number of characters as are input. 
	
	There are exceptions and some cipher systems may use slightly more, or fewer, 
	characters when output versus the number that were input.

	 https://en.wikipedia.org/wiki/Cipher

	 */

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
	setMsg(newMessage) {
		return (this.message = newMessage);
	}

	setEncoded(newEncoded) {
		return (this.encoded = newEncoded);
	}

	setMethod(newMethod) {
		return (this.method = newMethod);
	}

	setKey(newKey) {
		return (this.key = newKey);
	}

	setAlphabet(newAlphabet) {
		return (this.alphabet = newAlphabet);
	}
	// ----------------------------------------------------Usefull methods----------------------------------------------------

	shiftCharacters = (str, shift = 1) => {
		// Based upond Caesar shift method, works for letter only, any other character like 0-9 or @ # $, etc. will be ignored.
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

	text2block = (text, blockSize = 1) => {
		// Transform a text into same sized character blocks.
		// Example: ABC DEFGH IJ KLM NOPQR S TUVW XYZ -(5)-> ABCDE FGHIJ KLMNO PQRST UVWXY Z
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
	encodeAlphabet = (
		message = this.message,
		charSplit = '',
		wordSplit = ' '
	) => {
		/*
    Steps: 

    1st: filter all chars not included on alphabet
    2nd: separate by word using the wordsplit separator
    3nd: lookup for key coresponding to value
    4th: after the convertion, add the char separator
    5th: repeat for all chars steps 3 & 4
    */

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

	validateEncoded = () =>
		this.encoded === true &&
		typeof (this.message != null) &&
		this.message !== '';

	sortColumns(a, b) {
		// Sort values based on the first item on the row
		if (a[0] === b[0]) {
			return 0;
		}
		return a[0] < b[0] ? -1 : 1;
	}

	transposeMatrix = array => array[0].map((col, i) => array.map(row => row[i]));

	getKeyByValue = (object, value) =>
		Object.keys(object).find(key => object[key] === value);

	logMessage = output => {
		if (this.debug) {
			// console.log(output);
		}
	};

	test = () => 'NigmaJS enabled';
}
