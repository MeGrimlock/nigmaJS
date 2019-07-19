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
    this.alphabet = alphabet || [];
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

  //Aux methods

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
