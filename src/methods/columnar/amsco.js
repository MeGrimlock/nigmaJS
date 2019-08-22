import { default as BasicCipher } from "../../basicCipher.js";

export default class amsco extends BasicCipher {
	/*
      http://ericbrandel.com/2016/10/09/the-amsco-cipher/
  
      AMSCO is an incomplete columnar transposition cipher. A bit to unpack there, but basically that means that you’re putting 
      the message into columns and those columns may not have equal lengths. It was invented by an A.M. Scott in the 19th century, 
      but strangely there is almost nothing online about him.
  -
      Suitable length: 8 to 12 lines  maximum

      The key can be a max length of 9 and must contain the numbers 1-n, with n being the length of the key. 
      1234 and 4132 would both be valid keys, but 1245 would not.
  
      */

	constructor(message, key, encoded = false, debug = false) {
		/* console.log(
      `AMSCO Constructor> KEY :${key} Encoded:${encoded} DEBUG:${debug}\n Msg: ${message} \n `
    ); */
		super(message, encoded, "amsco", key, "", debug);
		// Parametros: message,encoded,method,key,alphabet
		// this.decode.bind(this);
		// logMessage("constuctor",this);
	}

	decodingConstructor = (message, key) => {
		// Support method that generates both the template for the decoded message and the decoding matrix to be used.
		// It's important to notice that the key is placed inside of the template message and must be removed once the columns are sorted.
		const explodedKey = key.split("").map(myval => myval - 1);
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

	validateKey = () => {
		// /Aux method that verifies if no columns in [1,2...n] are present and if all 1-9 digits are there
		let validated = true;
		const explodedKey = this.key.split("").sort();
		const pattern = /^\d+$/;
		this.logMessage(
			`Check for [0-9] chars only: ${pattern.test(this.key)} key analyzed : ${
				this.key
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
					: ((validated = false), this.logMessage("Sequence not validated"));
			} while (validated === true && index < explodedKey.length);
			validated ? console.log("") : this.logMessage("Invalid Key sequence");
		} else {
			this.logMessage("Invlaid key, Non numbers detected");
			validated = false;
		}
		return validated;
	};

	generateDecodingMatrix = (totalChars, splitKey, initChar, alternateChar) => {
		const decodingMatrix = [];
		let numChars = initChar || 1;
		const alternate = alternateChar || 2;

		const explodedKey = splitKey;
		explodedKey.map(value => {
			decodingMatrix.push(new Array());
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

	processMatrixDecoding = (message, matrix, splitKey) => {
		// Using the key and matrix, the encoded text is processed into the matrix format.
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

	decode = () => {
		// To decode baconian i must take 5 letters at a tim and analyze them.
		let messageDecoded = [];
		// In order to encode a message first we validate that the message is encoded, that it's not null and that the string is not empty.
		if (this.validateKey()) {
			const decodingAux = this.decodingConstructor(this.message, this.key);
			messageDecoded = this.processMatrixDecoding(
				decodingAux[0],
				decodingAux[1],
				decodingAux[2]
			);
			// Now all the text is ordered but in separate colums/rows
			messageDecoded = this.transposeMatrix(messageDecoded);
			messageDecoded.shift();
			messageDecoded = messageDecoded.map(row => row.join(""));
			messageDecoded = messageDecoded.join("");
			// messageDecoded.sort(this.sortFunction);
			this.logMessage(`Done decoding: ${messageDecoded}`);
		} else {
			// console.log("Unable to decode, verify if message was already encrypted");
		}
		return messageDecoded;
	};

	encode = () => {
		let originalMessage = "";
		let encodedMessage = [];
		let encodingMatrix = [];
		let output = "";

		if (this.validateKey()) {
			// Eliminate non usable chars
			originalMessage = this.message.replace(/\s+/g, "").toLocaleUpperCase();
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
				output += element.join("");
			});
		}
		// this.encoded = true;
		return output;
	};
}

// export default amsco;
