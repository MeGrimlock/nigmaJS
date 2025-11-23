import simpleSubstitution from "./simpleSubstitution.js";

/**
 * Bazeries is a 5x5 substitution matrix, the simple substitution must be transpositioned before it can be used.
 * For this, after different tests, i decided to go for List -> matrix -> transposition -> List.
 * At first it seemed awfull but it turned out to be the most scalable solution.
 * @method constructor
 * @param {String} message this text is what we want to get encoded/decoded
 * @param {String} key a text that is used to generate the alphabet
 * @param {Boolean} encoded optional value that indicates if the message is already encoded
 * @param {Boolean} debug optional value used to show/ debug messages
 */

export default class Bazeries extends simpleSubstitution {
  constructor(message, key, encoded = false, debug = false) {
    const alphabet = {
      // In some versions IJ are together, if needed this can be adjusted.
    };
    super(message, key, true, false, encoded, "", alphabet, debug);
    // Parametros: message,encoded,method,key,alphabet
    this.method = "bazeries";
    this.wordSep = " ";
    this.characterSep = "";
    this.transpositionAlphabet(5, 5);
  }

  /**
   * Since Bazeries is basically a substitution cipher with a 90deg rotation, we need to rotate the alphabet.
   * This is an auxiliary method that is called only with the constructor.
   * If the alphabet is changed, we might have to use it again.
   * @method transposeMatrix
   * @param {!number} rows number of rows
   * @param {!number} columns number of columns
   */

  transpositionAlphabet = (rows, columns) => {
    const rotatedAlphabet = this.alphabet;
    let alphabetMatrix = [];
    let row = [];
    // Create the matrix
    Object.keys(rotatedAlphabet).forEach(key => {
      const tempChar = key.charCodeAt(0);
      // wE ONLY CARE for chars Between A-Z, ignore all others
      if (tempChar >= 97 && key.charCodeAt(0) <= 123) {
        row.push(rotatedAlphabet[key]);
        // if (tempChar === "j") console.log("bug");
      }
      // Check if the row is complete and append into matrix
      if (row.length === columns) {
        alphabetMatrix.push(row);
        row = [];
      }
    });
    // Transpose
    alphabetMatrix = this.transposeMatrix(alphabetMatrix);
    // Merge into 1 array
    alphabetMatrix = alphabetMatrix.join();
    // Put values back into the alphabet as {key:value}
    let asciiCode = 97;
    alphabetMatrix.split(",").forEach(letter => {
      rotatedAlphabet[String.fromCharCode(asciiCode)] = letter;
      asciiCode += 1;
    });

    this.setAlphabet(rotatedAlphabet);
  };

  /**
   * @method encode
   * @param {String} message text to use for encoding, if empty use stored message
   */

  encode = (message = this.message) =>
    this.encodeAlphabet(message, this.characterSep, this.wordSep);

  /**
   * @method decode
   * @param {String} message text to use for decoding, if empty use stored message
   */

  decode = (message = this.message) =>
    this.decodeAlphabet(message, this.characterSep, this.wordSep);
}
