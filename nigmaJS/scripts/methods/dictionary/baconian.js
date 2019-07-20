class baconian extends BasicCipher {
  /*
    https://en.wikipedia.org/wiki/Bacon%27s_cipher

    Bacon's cipher or the Baconian cipher is a method of steganography (a method of hiding a secret message as opposed to just a cipher) 
    devised by Francis Bacon in 1605.[1][2][3] A message is concealed in the presentation of text, rather than its content.

    Suitable length: 25 characters maximum

    */
  constructor(message, encoded, debug) {
    const alphabet = {
      //In some versions UV or IJ are together, if needed this can be adjusted.
      aaaaa: "a",
      aaaab: "b",
      aaaba: "c",
      aaabb: "d",
      aabaa: "e",
      aabab: "f",
      aabba: "g",
      aabbb: "h",
      abaaa: "i",
      abaab: "j",
      ababa: "k",
      ababb: "l",
      abbaa: "m",
      abbab: "n",
      abbba: "o",
      abbbb: "p",
      baaaa: "q",
      baaab: "r",
      baaba: "s",
      baabb: "t",
      babaa: "u",
      babab: "v",
      babba: "w",
      babbb: "x",
      bbaaa: "y",
      bbaab: "z"
    };
    super(message, encoded, "baconian", "", alphabet, debug);
    //Parametros: message,encoded,method,key,alphabet
    //WE have no key but we do have an alphabet
    //this.decode.bind(this);
    //logMessage("constuctor",this);
  }

  decode = () => {
    //To decode baconian i must take 5 letters at a time and analyze them.
    let messageDecoded = [];
    let n = 5;
    if (this.encoded === true) {
      //logMessage("Decoding...", this.alphabet);
      let tempAlphabet = this.alphabet;
      this.message.split("   ").map(function(word) {
        let auxString = word.match(new RegExp(".{1," + n + "}", "g"));
        //this.logMessage(auxString);
        auxString.map(function(letter) {
          messageDecoded.push(tempAlphabet[letter]);
        });
        messageDecoded.push(" ");
      });
      this.logMessage("Done decoding: ", messageDecoded);
    }
    return messageDecoded;
  };

  encode = () => {
    //logMessage("Encoding...",this);
    let originalMessage = "";
    let encodedMessage = "";
    if (this.encoded === false) {
      //logMessage("ok");
      originalMessage = this.message.toLowerCase().replace(/[^a-z]/g, "");
      let temp = originalMessage.split("");
      temp.forEach(element => {
        let encodedChar = this.getKeyByValue(this.alphabet, element);
        encodedMessage += encodedChar;
        this.logMessage("Conversion: ", element, encodedChar);
      });
    }
    return encodedMessage;
  };

  //encode = () => this.encodeAlphabet(" ", "");
  //decode = () => this.decodeAlphabet("", " ");
}

const mensaje1 =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dapibus suscipit velit vitae vulputate. Vivamus vel tempus lacus. Fusce dictum, leo id porttitor dapibus, leo diam rutrum nulla, ut feugiat";

const mensaje2 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const miTexto = new baconian(mensaje2, false, true);
const miTexto2 = new baconian(miTexto.encode(), true, true);

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
