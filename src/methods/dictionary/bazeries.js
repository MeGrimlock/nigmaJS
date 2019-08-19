import simpleSubstitution from "./simpleSubstitution.js";

export default class Bazeries extends simpleSubstitution {
	/*
    https://en.wikipedia.org/wiki/Bacon%27s_cipher

    Bacon's cipher or the Baconian cipher is a method of steganography (a method of hiding a secret message as opposed to just a cipher) 
    devised by Francis Bacon in 1605.[1][2][3] A message is concealed in the presentation of text, rather than its content.

    Suitable length: 25 characters maximum

    */
	constructor(message, key, encoded = false, debug = false) {
		const alphabet = {
			//In some versions IJ are together, if needed this can be adjusted.
		};
		super(message, key, true, false, encoded, "", alphabet, debug);
		//Parametros: message,encoded,method,key,alphabet
		this.method = "bazeries";
		this.wordSep = "   ";
		this.characterSep = " ";
		this.transpositionAlphabet(5, 5);
	}

	deleteCharacters = () => {
		delete alphabet[String.fromCharCode(alphabetKey)];
	};

	transpositionAlphabet = (rows, columns) => {
		/*
		Bazeries is a 5x5 substitution matrix, the simple substitution must be transpositioned before it can be used.
		For this, after different tests, i decided to go for List -> matrix -> transposition -> List.
		At first it seemed awfull but it turned out to be the most scalable solution.
		*/
		let rotatedAlphabet = this.alphabet;
		let alphabetMatrix = [];
		let row = [];
		//Create the matrix
		Object.keys(rotatedAlphabet).forEach(key => {
			let tempChar = key.charCodeAt(0);
			//wE ONLY CARE for chars Between A-Z, ignore all others
			if (97 <= tempChar && key.charCodeAt(0) <= 123) {
				row.push(rotatedAlphabet[key]);
				if (tempChar === "j") console.log("bug");
			}
			//Check if the row is complete and append into matrix
			if (row.length === columns) {
				alphabetMatrix.push(row);
				row = [];
			}
		});
		//Transpose
		alphabetMatrix = this.transposeMatrix(alphabetMatrix);
		//Merge into 1 array
		alphabetMatrix = alphabetMatrix.join();
		//Put values back into the alphabet as {key:value}
		let asciiCode = 97;
		alphabetMatrix.split(",").forEach(letter => {
			rotatedAlphabet[String.fromCharCode(asciiCode)] = letter;
			asciiCode++;
		});

		this.setAlphabet(rotatedAlphabet);
	};

	encode = message =>
		this.encodeAlphabet(message, this.characterSep, this.wordSep);
	decode = message =>
		this.decodeAlphabet(message, this.characterSep, this.wordSep);
}
