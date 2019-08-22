import { default as BasicCipher } from '../../basicCipher.js';

export default class baconian extends BasicCipher {
	/*
    https://en.wikipedia.org/wiki/Bacon%27s_cipher

    Bacon's cipher or the Baconian cipher is a method of steganography (a method of hiding a secret message as opposed to just a cipher) 
    devised by Francis Bacon in 1605.[1][2][3] A message is concealed in the presentation of text, rather than its content.

    Suitable length: 25 characters maximum

    */
	constructor(message, encoded = false, debug = false) {
		const alphabet = {
			// In some versions UV or IJ are together, if needed this can be adjusted.
			aaaaa: 'a',
			aaaab: 'b',
			aaaba: 'c',
			aaabb: 'd',
			aabaa: 'e',
			aabab: 'f',
			aabba: 'g',
			aabbb: 'h',
			abaaa: 'i',
			abaab: 'j',
			ababa: 'k',
			ababb: 'l',
			abbaa: 'm',
			abbab: 'n',
			abbba: 'o',
			abbbb: 'p',
			baaaa: 'q',
			baaab: 'r',
			baaba: 's',
			baabb: 't',
			babaa: 'u',
			babab: 'v',
			babba: 'w',
			babbb: 'x',
			bbaaa: 'y',
			bbaab: 'z'
		};
		super(message, encoded, 'baconian', '', alphabet, debug);
		// Parametros: message,encoded,method,key,alphabet
		// WE have no key but we do have an alphabet
		// this.decode.bind(this);
		// logMessage("constuctor",this);
		this.wordSep = '   ';
		this.characterSep = ' ';
	}

	encode = message =>
		this.encodeAlphabet(message, this.characterSep, this.wordSep);

	decode = message =>
		this.decodeAlphabet(message, this.characterSep, this.wordSep);
}

// export default baconian;
