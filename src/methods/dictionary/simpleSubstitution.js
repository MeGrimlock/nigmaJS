import { default as BasicCipher } from "../../basicCipher.js";

export default class simpleSubstitution extends BasicCipher {
	constructor(
		message,
		key,
		ij = false,
		uv = false,
		encoded = false,
		debug = false
	) {
		const alphabet = {
			// The keyword is what modifies the key of this alphabet by using the corresponding constructor
			a: "",
			b: "",
			c: "",
			d: "",
			e: "",
			f: "",
			g: "",
			h: "",
			i: "",
			j: "",
			k: "",
			l: "",
			m: "",
			n: "",
			o: "",
			p: "",
			q: "",
			r: "",
			s: "",
			t: "",
			u: "",
			v: "",
			w: "",
			x: "",
			y: "",
			z: "",
			"0": "0",
			"1": "1",
			"2": "2",
			"3": "3",
			"4": "4",
			"5": "5",
			"6": "6",
			"7": "7",
			"8": "8",
			"9": "9",
			" ": " ",
			".": ".",
			",": ",",
			"?": "?",
			"!": "!"
		};

		super(message, encoded, "simpleSubstitution", key, alphabet, debug);

		this.i = ij;
		this.v = uv;

		this.setAlphabet(this.alphabetConstructor(alphabet, key));

		this.wordSep = " ";
		this.characterSep = "";
	}

	getI = () => this.i;
	getV = () => this.v;

	validateRemovedChars = (index, i = this.i, v = this.v) =>
		(i === true && index == 106) || (v === true && index == 118);

	putLetter2Alphabet = (letter, usedLetters, alphabet, alphabetKey) => {
		if (!usedLetters.includes(letter)) {
			if (this.validateRemovedChars(alphabetKey, this.i, this.v)) {
				delete alphabet[String.fromCharCode(alphabetKey)];
				alphabetKey++;
			}
			alphabet[String.fromCharCode(alphabetKey)] = letter;
			//Make sure that the keyWordChar used is not used again in case of repettitions.
			usedLetters.push(letter);
			alphabetKey++;
		}
		return [letter, usedLetters, alphabet, alphabetKey];
	};

	alphabetConstructor = (alphabet, keyWord) => {
		let usedLetters = []; //letters already used from keyword
		let alphabetKey = 97; //lower case "a"

		//Filter repetitions of letters
		keyWord.split("").forEach(keyWordChar => {
			[
				keyWordChar,
				usedLetters,
				alphabet,
				alphabetKey
			] = this.putLetter2Alphabet(
				keyWordChar,
				usedLetters,
				alphabet,
				alphabetKey
			);
		});
		//continue assigning letters until lower case "z" 122d
		let letterIndex = 97; //restart with "a"
		let letter = "";
		do {
			letter = String.fromCharCode(letterIndex);
			[letter, usedLetters, alphabet, alphabetKey] = this.putLetter2Alphabet(
				letter,
				usedLetters,
				alphabet,
				alphabetKey
			);
			letterIndex++;
		} while (alphabetKey < 123); //ASCII for lower case z
		return alphabet;
	};

	encode = message =>
		this.encodeAlphabet(message, this.characterSep, this.wordSep);
	decode = message =>
		this.decodeAlphabet(message, this.characterSep, this.wordSep);
}

// export default simpleSubstitution;
