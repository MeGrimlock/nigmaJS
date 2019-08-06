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
    this.key = key || "";
    this.alphabet = alphabet;
    this.debug = debug;
  }
  //GETs
  getMsg = () => this.message;

  getEncoded = () => this.encoded;

  getMethod = () => this.method;

  getKey = () => this.key;

  getAlphabet = () => this.alphabet;

  //SETs
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

  //----------------------------------------------------Usefull methods----------------------------------------------------

  shiftCharacters = (str, amount = 1) => {
    //Based upond Caesar shift method, works for letter only, any other character like 0-9 or @ # $, etc. will be ignored.
    Math.abs(amount) > 26 ? (amount = amount % 26) : null;
    amount < 0 ? (amount += 26) : amount;
    var output = "";
    for (var i = 0; i < str.length; i++) {
      var c = str[i];
      // If it's a letter...
      if (c.match(/[a-z]/i)) {
        var code = str.charCodeAt(i);
        if (code >= 65 && code <= 90) {
          // Uppercase letters
          let temp = c;
          c = String.fromCharCode(((code - 65 + amount) % 26) + 65);
          console.log(temp, "->", c);
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

  text2block = (str, blockSize = 1) => {
    //Transform a text into same sized character blocks.
    //Example: ABC DEFGH IJ KLM NOPQR S TUVW XYZ -(5)-> ABCDE FGHIJ KLMNO PQRST UVWXY Z
    str = str.replace(/ /g, "");
    let temp = str[0];
    let index = 1;
    do {
      temp += str[index];
      if (index % blockSize === 0) temp += " ";
      index++;
    } while (index < str.length - 1);
    return temp;
  };

  //--------------------------------------------------Alphabet methods--------------------------------------------------

  encodeAlphabet = (charSplit, wordSplit) => {
    /*
    Steps: 

    1st: filter all chars not included on alphabet
    2nd: separate by word using the wordsplit separator
    3nd: lookup for key coresponding to value
    4th: after the convertion, add the char separator
    5th: repeat for all chars steps 3 & 4
    */

    let originalMessage = "";
    let encodedMessage = "";

    if (this.encoded === false) {
      //originalMessage = this.message.toLowerCase().replace(/[^a-z]/g, "");
      originalMessage = this.message.toLowerCase();
      originalMessage.split(" ").map(word => {
        word.split("").map(letter => {
          let encodedChar = this.getKeyByValue(this.alphabet, letter);

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
    }
    return encodedMessage;
  };

  decodeAlphabet = (charSplit, wordSplit) => {
    let messageDecoded = "";
    if (this.encoded === true) {
      this.message.split(wordSplit).map(word => {
        word.split(charSplit).map(letter => {
          let encodedChar = this.alphabet[letter];
          encodedChar !== undefined ? (messageDecoded += encodedChar) : null;
        });
        messageDecoded += " ";
      });
      messageDecoded = messageDecoded.slice(0, -1);
    }
    return messageDecoded;
  };

  //--------------------------------------------------Aux methods--------------------------------------------------

  validateEncoded = () =>
    this.encoded === true &&
    typeof (this.message != null) &&
    this.message != "";

  sortColumns(a, b) {
    //Sort values based on the first item on the row
    if (a[0] === b[0]) {
      return 0;
    } else {
      return a[0] < b[0] ? -1 : 1;
    }
  }

  transposeMatrix = array => array[0].map((col, i) => array.map(row => row[i]));

  getKeyByValue = (object, value) =>
    Object.keys(object).find(key => object[key] === value);

  logMessage = output => {
    if (this.debug) {
      console.log(output);
    }
  };

  test = () => "NigmaJS enabled";
}

export const spanishLetterFrequencies = {
  A: 12.5,
  K: 0.08,
  T: 4.42,
  B: 1.27,
  L: 5.84,
  U: 4.0,
  C: 4.43,
  M: 2.61,
  V: 0.98,
  D: 5.14,
  N: 7.09,
  W: 0.03,
  E: 13.24,
  Ñ: 0.22,
  X: 0.19,
  F: 0.79,
  O: 8.98,
  Y: 0.79,
  G: 1.17,
  P: 2.75,
  Z: 0.42,
  H: 0.81,
  Q: 0.83,
  I: 6.91,
  R: 6.62,
  J: 0.45,
  S: 7.44
};

export const spanishBigramFrequencies = {
  DE: 2.57,
  AD: 1.43,
  TA: 1.09,
  ES: 2.31,
  AR: 1.43,
  TE: 1.0,
  EN: 2.27,
  RE: 1.42,
  OR: 0.98,
  EL: 2.01,
  AL: 1.33,
  DO: 0.98,
  LA: 1.8,
  AN: 1.24,
  IO: 0.98,
  OS: 1.79,
  NT: 1.22,
  AC: 0.96,
  ON: 1.61,
  UE: 1.21,
  ST: 0.95,
  AS: 1.56,
  CI: 1.15,
  NA: 0.92,
  ER: 1.52,
  CO: 1.13,
  RO: 0.85,
  RA: 1.47,
  SE: 1.11,
  UN: 0.84
};

export const spanishTrigramFrequencies = {
  DEL: 0.75,
  EST: 0.48,
  PAR: 0.32,
  QUE: 0.74,
  LOS: 0.47,
  DES: 0.31,
  ENT: 0.67,
  ODE: 0.47,
  ESE: 0.3,
  ION: 0.56,
  ADO: 0.45,
  IEN: 0.3,
  ELA: 0.55,
  RES: 0.4,
  ALA: 0.29,
  CON: 0.54,
  STA: 0.38,
  POR: 0.29,
  SDE: 0.52,
  ACI: 0.36,
  ONE: 0.29,
  ADE: 0.51,
  LAS: 0.35,
  NDE: 0.29,
  CIO: 0.5,
  ARA: 0.34,
  TRA: 0.28,
  NTE: 0.49,
  ENE: 0.32,
  NES: 0.27
};

export const spanishQuadgramFrequencies = {
  CION: 0.42,
  MENT: 0.16,
  NCIA: 0.14,
  DELA: 0.33,
  IONE: 0.16,
  AQUE: 0.14,
  ACIO: 0.27,
  ODEL: 0.16,
  SQUE: 0.14,
  ENTE: 0.25,
  ONDE: 0.16,
  ENCI: 0.13,
  ESTA: 0.22,
  OQUE: 0.15,
  ENLA: 0.13,
  ESDE: 0.22,
  IDAD: 0.15,
  ENTR: 0.13,
  PARA: 0.19,
  ELOS: 0.15,
  IENT: 0.12,
  ONES: 0.17,
  ADEL: 0.15,
  ASDE: 0.12,
  SDEL: 0.17,
  ANTE: 0.15,
  ENEL: 0.12,
  OSDE: 0.17,
  ENTO: 0.14,
  DELO: 0.12
};
// export default BasicCipher;
