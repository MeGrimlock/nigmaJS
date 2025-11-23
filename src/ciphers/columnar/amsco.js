import { default as BasicCipher } from '../../core/basicCipher.js';
import { CipherValidator } from '../../core/validation.js';

/** Class representation of the AMSCO method 
 * http://ericbrandel.com/2016/10/09/the-amsco-cipher/
 * AMSCO is an incomplete columnar transposition cipher. A bit to unpack there, but basically that means that you’re putting
 * the message into columns and those columns may not have equal lengths. It was invented by an A.M. Scott in the 19th century, 
 * but strangely there is almost nothing online about him.
 * Suitable length: 8 to 12 lines  maximum
 * The key can be a max length of 9 and must contain the numbers 1-n, with n being the length of the key. 
 * 1234 and 4132 would both be valid keys, but 1245 would not.
 * 
 * @method constructor
 * @param {String} message to be encoded/decoded
 * @param {String} key the order in which to sort columns
 * @param {Boolean} encoded indicating if the message passed is encoded
 * @param {Boolean} debug indicating if we need to print debug messages
*/

export default class Amsco extends BasicCipher {

	constructor(message, key, encoded = false, debug = false) {
		super(message, encoded, 'amsco', key, '', debug);
	}

	/**
	 * Method that returns all auxiliary info required in order to implement the decoding process.
	 * It generates both the template for the decoded message and the decoding matrix to be used.
	 * It's important to notice that the key is placed inside of the template message and must be removed once the columns are sorted.
	 * @method decodingConstructor
	 * @param {String} message the message to be encoded
	 * @param {String} key the order in which columnar transposition is to be made
	 * @returns {[String,Array,Array]} [decodedMessageTemplate, decodingMatrix, explodedKey]
	 */

	decodingConstructor = (message, key) => {

		const explodedKey = key.split('').map(myval => myval - 1);
		const decodedMessageTemplate = [];

		explodedKey.map(value => {
			decodedMessageTemplate.push([value]);
		});

		const decodingMatrix = this.generateDecodingMatrix(
			message.length,
			explodedKey,
			1,
			2
		);

		return [decodedMessageTemplate, decodingMatrix, explodedKey];
	};

	/**
	 * Method that returns all auxiliary info required in order to implement the decoding process.
	 * 
	 * @method validateKey 
	 * @returns {Boolean} validates if the key set into the Object follows the ciphers rules.
	 */

	validateKey = () => {
		// /Aux method that verifies if no columns in [1,2...n] are present and if all 1-9 digits are there
		let validated = true;
		const explodedKey = this.key.split('').sort();
		const pattern = /^\d+$/;
		this.logMessage(
			`Check for [0-9] chars only: ${pattern.test(this.key)} key analyzed : ${this.key
			}`
		);
		if (pattern.test(this.key)) {
			this.logMessage(`Numbers only Key: ${explodedKey} `);
			let index = 0;
			do {
				const element = explodedKey[index];
				this.logMessage(
					`Validating ... Char ${element} of type ${typeof element} at ${index}`
				);

				element === (1 + index).toString()
					? (index += 1)
					: ((validated = false), this.logMessage('Sequence not validated'));
			} while (validated === true && index < explodedKey.length);
			// validated ? console.log("") : this.logMessage("Invalid Key sequence");
		} else {
			this.logMessage('Invalid key, Non numbers detected');
			validated = false;
		}
		return validated;
	};

	/**
	 * Auxiliary method used by decodingConstructor
	 * 
	 * @method generateDecodingMatrix
	 * @param {String} totalChars receives message.length
	 * @param {[String]} splitKey receives explodedKey
	 * @param {[Number]} initChar receives 1
	 * @param {[Number]} alternateChar receives 2
	 * @returns {[String]} A matrix that represents the message reordered according to the key
	 * @see decodingConstructor
	 */

	generateDecodingMatrix = (totalChars, splitKey, initChar, alternateChar) => {
		const decodingMatrix = [];
		let numChars = initChar || 1;
		const alternate = alternateChar || 2;

		const explodedKey = splitKey;
		explodedKey.map(value => {
			decodingMatrix.push([]);
		});

		// Build decoding Matrix
		let index = 0;

		do {
			decodingMatrix.forEach(element => {
				if (index < totalChars) {
					totalChars - index > numChars
						? element.push(numChars)
						: element.push(totalChars - index);
				} else {
					element.push(0);
				}
				index += numChars;
				numChars = numChars === initChar ? alternate : initChar;
			});
			numChars = numChars === initChar ? alternate : initChar;
		} while (index < totalChars);

		return decodingMatrix;
	};

	/**
	 * Auxiliary method used by decode() 
	 * Using the key and matrix, the encoded text is processed into the matrix format.
	 * 
	 * @method processMatrixDecoding
	 * @param {String} message receives message to decode
	 * @param {String} matrix receives message to decode
	 * @param {[String]} splitKey receives explodedKey
	 * @returns {[String]} A matrix that represents the message reordered according to the key
	 * @see decode
	 */

	processMatrixDecoding = (message, matrix, splitKey) => {
		let index = 0;
		let extraChars = 1;
		let keys = 0;

		const messageDecoded = message;
		const decodingMatrix = matrix;
		const explodedKey = splitKey;

		do {
			let subIndex = 0;
			const key = explodedKey.indexOf(keys);
			do {
				extraChars = index + decodingMatrix[key][subIndex];
				const element = this.message.slice(index, extraChars);
				messageDecoded[key].push(element);
				index = extraChars;
				subIndex += 1;
			} while (subIndex < decodingMatrix[key].length);
			keys += 1;
		} while (keys < decodingMatrix.length);

		return messageDecoded;
	};

	/**
	 * Decode method, one of the 3 main methods from this and all classes (asides from constructor and encode)
	 * By default it takes the message and key that have been set into the object and decode the message
	 * @method decode
	 * @returns {String} decoded message
	 */

	decode = () => {
		CipherValidator.validateMessage(this.message);
		let messageDecoded = [];
		// In order to encode a message first we validate that the message is encoded, that it's not null and that the string is not empty.
		if (!this.validateKey()) {
			throw new Error('Invalid key format for AMSCO cipher. Key must contain sequential numbers 1-n.');
		}
		const decodingAux = this.decodingConstructor(this.message, this.key);
		messageDecoded = this.processMatrixDecoding(
			decodingAux[0],
			decodingAux[1],
			decodingAux[2]
		);
		// Now all the text is ordered but in separate colums/rows
		messageDecoded = this.transposeMatrix(messageDecoded);
		messageDecoded.shift();
		messageDecoded = messageDecoded.map(row => row.join(''));
		messageDecoded = messageDecoded.join('');
		// messageDecoded.sort(this.sortFunction);
		this.logMessage(`Done decoding: ${messageDecoded}`);
		return messageDecoded;
	};

	/**
	 * Encode method, one of the 3 main methods from this and all classes (asides from constructor and decode)
	 * By default it takes the message and key that have been set into the object and ecodes the message
	 * @method encode()
	 * @returns {String} encoded message
	 */

	encode = () => {
		CipherValidator.validateMessage(this.message);
		let originalMessage = '';
		let encodedMessage = [];
		let encodingMatrix = [];
		let output = '';

		if (!this.validateKey()) {
			throw new Error('Invalid key format for AMSCO cipher. Key must contain sequential numbers 1-n.');
		}
		// Eliminate non usable chars
		originalMessage = this.message.replace(/\s+/g, '').toLocaleUpperCase();
		// Call the constructor
		const decodingAux = this.decodingConstructor(this.message, this.key); // Returns > [messageTemplate,matrix,splitKey]
		// Use the values from the constructor
		[encodedMessage] = decodingAux;
		encodingMatrix = this.transposeMatrix(decodingAux[1]);

		// Using the matrix split the original message into chunks
		let textIndex = 0;
		let colIndex = 0;

		encodingMatrix.forEach(row => {
			row.forEach(column => {
				encodedMessage[colIndex].push(
					originalMessage.slice(textIndex, textIndex + column)
				);
				textIndex += column;
				colIndex < row.length - 1 ? (colIndex += 1) : (colIndex = 0);
			});
		});

		encodedMessage.sort(this.sortFunction);
		encodedMessage.forEach(element => {
			element.shift(); // Remove the first item since it contains key value
			output += element.join('');
		});
		// this.encoded = true;
		return output;
	};
}
