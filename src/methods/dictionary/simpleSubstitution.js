import { default as BasicCipher } from "../../basicCipher.js";
/** This class is the basis for all substitution ciphers. Right now it works with monoalphabetic substitution only.
 * In cryptography, a substitution cipher is a method of encrypting by which units of plaintext are replaced with ciphertext.
 * According to a fixed system; the "units" may be single letters (the most common), pairs of letters, triplets of letters, mixtures of the above, and so forth.
 * The receiver deciphers the text by performing the inverse substitution.
 * A monoalphabetic cipher uses fixed substitution over the entire message, whereas a polyalphabetic cipher uses a number of substitutions at different positions in the message, where a unit from the plaintext is mapped to one of several possibilities in the ciphertext and vice versa.
 * @param {String} message this text is what we want to get encoded/decoded
 * @param {String} key a text that is used to generate the alphabet
 * @param {Boolean} ij Indicates if "i" and "j" are to be encoded/decoded as the same letter
 * @param {Boolean} uv Indicates if "u" and "v" are to be encoded/decoded as the same letter
 * @param {Boolean} encoded optional value that indicates if the message is already encoded
 * @param {Boolean} debug optional value used to show/ debug messages
 */
export default class SimpleSubstitution extends BasicCipher {
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

    this.key = this.validateKey(key);
    this.setAlphabet(this.alphabetConstructor(alphabet, this.key));

    this.wordSep = " ";
    this.characterSep = "";
  }

  getI = () => this.i;

  getV = () => this.v;

  /**
   * @method validateKey
   * @param {String} key string for alphabet substitution generation
   * @returns {String} parsedKey that complies with all corresponding rules.
   */
  validateKey = key => {
    let parsedKey = key.replace(/\s/g, "");
    parsedKey = parsedKey.toLowerCase();
    return parsedKey;
  };

  /**
   * Auxiliary method
   * @method validateRemovedChars
   * @param {number} index character ASCII code
   * @param {Boolean} i Indicates if "i" and "j" are to be encoded/decoded as the same letter
   * @param {Boolean} v Indicates if "u" and "v" are to be encoded/decoded as the same letter
   * @returns {Boolean} validated true if everythings ok
   */
  validateRemovedChars = (index, i = this.i, v = this.v) =>
    (i === true && index === 106) || (v === true && index === 118);

  /**
   * Auxiliary method for alphabetConstructor
   * @method putLetter2Alphabet
   * @param {String} letter that we want to see if is not already used
   * @param {[String]} usedLetters Array containing all used letters
   * @param {[Object]} refAlphabet array of key:value pairs containg the substitution alphabet
   * @param {number} refAlphabetKey the indicator of the last processed character
   * @returns {[String,String,Object,number]} the same as the header since it is designed to be used recursively.
   * @see alphabetConstructor
   */
  putLetter2Alphabet = (letter, usedLetters, refAlphabet, refAlphabetKey) => {
    const alphabet = refAlphabet;
    let alphabetKey = refAlphabetKey;
    if (
      !usedLetters.includes(letter) &&
      !this.validateRemovedChars(letter.charCodeAt(0))
    ) {
      if (this.validateRemovedChars(alphabetKey, this.i, this.v)) {
        delete alphabet[String.fromCharCode(alphabetKey)];
        alphabetKey += 1;
      }
      alphabet[String.fromCharCode(alphabetKey)] = letter;
      // Make sure that the keyWordChar used is not used again in case of repettitions.
      usedLetters.push(letter);
      alphabetKey += 1;
    }
    return [letter, usedLetters, alphabet, alphabetKey];
  };

  /**
   * @method alphabetKey
   * @param {[Object]} alphabet array of key:value pairs containg the substitution alphabet
   * @param {String} keyword the keyword used for generating the substitution alphabet
   * @returns {[Object]} alphabet
   */
  alphabetConstructor = (alphabet, keyWord) => {
    let usedLetters = []; // letters already used from keyword
    let alphabetKey = 97; // lower case "a"

    // Filter repetitions of letters
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
    // continue assigning letters until lower case "z" 122d
    let letterIndex = 97; // restart with "a"
    let letter = "";
    do {
      letter = String.fromCharCode(letterIndex);
      [letter, usedLetters, alphabet, alphabetKey] = this.putLetter2Alphabet(
        letter,
        usedLetters,
        alphabet,
        alphabetKey
      );
      letterIndex += 1;
    } while (alphabetKey < 123); // ASCII for lower case z
    return alphabet;
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

