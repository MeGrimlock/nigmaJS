class amsco extends BasicCipher {
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

	constructor(message, encoded, key) {
		const alphabet = {};
		super(message, encoded, "amsco", key, "");
		//Parametros: message,encoded,method,key,alphabet
		//WE have no key but we do have an alphabet
		//this.decode.bind(this);
		//console.log("constuctor",this);
	}

	validateKey = () => {
		let validated = true;
		let explodedKey = this.key.split("").sort();
		let pattern = /^\d+$/;
		//console.log(`Check for [0-9] chars only: ${pattern.test(this.key)} key analyzed : ${this.key}`);
		if (pattern.test(this.key)) {
			console.log(`Numbers only Key: ${explodedKey} `);
			let index = 0;
			do {
				const element = explodedKey[index];
				//console.log(`Validating ... Char ${element} of type ${typeof element} at ${index}` );
				if (element === (1 + index).toString()) {
					validated = true;
					index++;
				} else {
					validated = false;
					console.log("Sequence not validated");
				}
			} while (validated === true && index < explodedKey.length);
			if (validated) {
				console.log("Key Validated");
			} else {
				console.log("Invalid Key sequence");
			}
			return validated;
		} else {
			console.log("Invlaid key, Non numbers detected");
			validated = false;
		}

		return validated;
	};

	decode = () => {
		//To decode baconian i must take 5 letters at a tim and analyze them.
		let messageDecoded = [];
		console.log(this.message);

		//In order to encode a message first we validate that the message is encoded, that it's not null and that the string is not empty.
		if (
			this.encoded === true &&
			typeof (this.message != null) &&
			this.message != "" &&
			this.validateKey()
		) {
			//console.log("Decoding...", this.alphabet);
			let tempAlphabet = this.alphabet;
			//Process Key before we can decrypt, odd: 2 chars even 1 char only
			console.log("Decoding... ", this.message, " processing key: ", this.key);

			console.log("Done decoding: ", messageDecoded);
		}
		return messageDecoded;
	};

	encode = () => {
		console.log("Encoding...", this);
		let originalMessage = "";
		let encodedMessage = "";
		let encodingMatrix = [];

		if (this.encoded === false && this.validateKey()) {
			//Analyze key
			let keys = this.key.split("");
			keys.forEach(element => {
				encodingMatrix.push([element]);
			});
			//Eliminate non usable chars
			originalMessage = this.message.replace(/\s+/g, "").toLocaleUpperCase();
			let limit = originalMessage.length;
			let index = 0;
			let extraChars = 1;
			let columns = this.key.length;
			let subIndex = 0;

			do {
				let tempValue = originalMessage.slice(index, index + extraChars);
				encodingMatrix[subIndex].push(tempValue);
				index = index + extraChars;
				extraChars = extraChars == 1 ? 2 : 1; //Toggle between 1 and 0 extra chars
				if (subIndex === columns - 1) {
					subIndex = 0;
				} else {
					subIndex++;
				}
			} while (index < limit);
			encodingMatrix.sort(this.sortFunction);
			//Now that the matrix is ready, time to make the final step... generate the message :)
			//console.log("Sorted Matrix: ", encodingMatrix);
			encodingMatrix.forEach(element => {
				element.shift(); //Remove the first item since it contains key value
				encodedMessage += element.join("");
			});
		}
		console.log(encodedMessage);
		return encodedMessage;
	};
}

const miTexto = new amsco(
	"On the other side of the screen it all looks so easy",
	false,
	"4123"
);

const miTexto2 = new amsco(
	"On the other side of the screen it all looks so easy",
	false,
	"456123"
);

const miTexto3 = new amsco(miTexto2.encode(), true, "456a123");

document.write(
	"Encoding: <br>",
	miTexto.getMsg(),
	"->",
	miTexto.encode() + "<br>"
);

document.write(
	"<br>Encoding: <br>",
	miTexto2.getMsg(),
	"->",
	miTexto2.encode() + "<br>"
);

document.write(
	"<br>Decoding: <br>",
	miTexto3.getMsg(),
	"->",
	miTexto3.decode() + "<br>"
);
