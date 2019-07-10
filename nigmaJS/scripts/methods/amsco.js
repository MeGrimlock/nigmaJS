class amsco extends Nigma {
  /*
      http://ericbrandel.com/2016/10/09/the-amsco-cipher/
  
      AMSCO is an incomplete columnar transposition cipher. A bit to unpack there, but basically that means that you’re putting 
      the message into columns and those columns may not have equal lengths. It was invented by an A.M. Scott in the 19th century, 
      but strangely there is almost nothing online about him.
  -
      Suitable length: 8 to 12 lines  maximum

      The key can be a max length of 9 and must contain the numbers 1-n, with n being the length of the key. 
      1234 and 4132 would both be valid keys, but 1245 would not.
  
      */
  constructor(message, encoded, key) {
    const alphabet = {};
    super(message, encoded, "amsco", key, "");
    //Parametros: message,encoded,method,key,alphabet
    //WE have no key but we do have an alphabet
    //this.decode.bind(this);
    //console.log("constuctor",this);
  }

  validateKey = () => {};

  decode = () => {
    //To decode baconian i must take 5 letters at a tim and analyze them.
    let messageDecoded = [];
    let n = 2;
    console.log(this.message);
    //In order to encode a message first we validate that the message is encoded, that it's not null and that the string is not empty.
    if (
      this.encoded === true &&
      typeof (this.message != null) &&
      this.message != ""
    ) {
      //console.log("Decoding...", this.alphabet);
      let tempAlphabet = this.alphabet;
      this.message.split("   ").map(function(word) {
        let auxString = word.match(new RegExp(".{1," + n + "}", "g"));
        console.log(auxString);
        auxString.map(function(letter) {
          messageDecoded.push(tempAlphabet[letter]);
        });
        messageDecoded.push(" ");
      });
      console.log("Done decoding: ", messageDecoded);
    }
    return messageDecoded;
  };

  encode = () => {
    console.log("Encoding...", this);
    let originalMessage = "";
    let encodedMessage = "";
    if (this.encoded === false) {
      //console.log("ok");
      originalMessage = this.message.replace(/\s+/g, "").toLocaleUpperCase();
      encodedMessage = originalMessage;
    }

    return encodedMessage;
  };
}

//const miMorse = new morse(".-- --- .-. -..   .-- --- .-. -..",true);
const miTexto = new amsco(
  "On the other side of the screen it all looks so easy",
  false,
  "4123"
);

document.write(
  "Encoded: <br>",
  miTexto.getMsg(),
  "->",
  miTexto.encode() + "<br>"
);
miTexto.setMsg("Cambie el mensaje");
document.write(
  "Encoded: <br>",
  miTexto.getMsg(),
  "->",
  miTexto.encode() + "<br>"
);

const miTexto2 = new amsco("", true);
document.write("Decoded:", miTexto2.decode());
