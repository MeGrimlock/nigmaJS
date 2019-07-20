class caesarShift extends BasicCipher {
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

const newKey = 50;

const mensaje1 =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dapibus suscipit velit vitae vulputate. Vivamus vel tempus lacus. Fusce dictum, leo id porttitor dapibus, leo diam rutrum nulla, ut feugiat";

const mensaje2 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const miTexto = new caesarShift(mensaje2, newKey);
const miTexto2 = new caesarShift(miTexto.encode(), newKey, true);

document.write(
  "Encoding Text1: <br>",
  miTexto.getMsg(),
  "<br>-><br>",
  miTexto.encode() + "<br>"
);

document.write(
  "<br>Decoding Text2: <br>",
  miTexto2.getMsg(),
  "<br>-><br>",
  miTexto2.decode() + "<br>"
);
