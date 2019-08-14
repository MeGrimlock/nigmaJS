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
	}

	encode = message =>
		this.encodeAlphabet(message, this.characterSep, this.wordSep);
	decode = message =>
		this.decodeAlphabet(message, this.characterSep, this.wordSep);
}
