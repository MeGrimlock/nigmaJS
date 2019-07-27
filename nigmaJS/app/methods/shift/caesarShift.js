import { default as BasicCipher } from "../../basicCipher.js.js";

export default class caesarShift extends BasicCipher {
  /*
   
   Caesar cipher, also known as Caesar's cipher, the shift cipher, Caesar's code or Caesar shift, 
   is one of the simplest and most widely known encryption techniques. 
   
   It is a type of substitution cipher in which each letter in the plaintext is replaced by a letter 
   some fixed number of positions down the alphabet. 
   For example, with a left shift of 3, D would be replaced by A, E would become B, and so on. 
   The method is named after Julius Caesar, who used it in his private correspondence.

    The encryption step performed by a Caesar cipher is often incorporated as part of more complex schemes, 
    such as the Vigenère cipher, and still has modern application in the ROT13 system. 

    As with all single-alphabet substitution ciphers, the Caesar cipher is easily broken and in modern practice 
    offers essentially no communications security.
   
   https://en.wikipedia.org/wiki/Caesar_cipher
   
   Note: Since this is a really basic encryption method, it is included in basicCipher class
   */

  constructor(message, key, encoded = false, debug = false) {
    /*console.log(
      `AMSCO Constructor> KEY :${key} Encoded:${encoded} DEBUG:${debug}\n Msg: ${message} \n `
    );*/
    key === parseInt(key)
      ? super(message, encoded, "caesarShift", key, "", debug)
      : console.log("invalid key");
    //Parametros: message,encoded,method,key,alphabet
    //this.decode.bind(this);
    //logMessage("constuctor",this);
  }

  encode = () => this.shiftCharacters(this.message, this.key);

  decode = () => this.shiftCharacters(this.message, -this.key);
}

// export default caesarShift;
