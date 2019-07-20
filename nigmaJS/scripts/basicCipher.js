class BasicCipher {
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

  shiftCharacters = (str, amount) => {
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
          c = String.fromCharCode(((code - 65 + amount) % 26) + 65);
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
        encodedMessage = encodedMessage.slice(0, -charSplit.length);
        encodedMessage += wordSplit;
      });
      encodedMessage = encodedMessage.slice(0, -wordSplit.length);
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
        messageDecoded += wordSplit;
      });
      messageDecoded = messageDecoded.slice(0, -wordSplit.length);
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

// const mensaje =  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dapibus suscipit velit vitae vulputate. Vivamus vel tempus lacus. Fusce dictum, leo id porttitor dapibus, leo diam rutrum nulla, ut feugiat";

/*Original function for transpose:

var newArray = array[0].map(function(col, i){
    return array.map(function(row){
        return row[i];
    });
});

*/
