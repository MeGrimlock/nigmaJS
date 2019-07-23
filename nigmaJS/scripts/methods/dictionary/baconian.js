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
    this.wordSep = "   ";
    this.characterSep = " ";
  }

  encode = () => this.encodeAlphabet(this.characterSep, this.wordSep);
  decode = () => this.decodeAlphabet(this.characterSep, this.wordSep);
}

const mensaje1 =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dapibus suscipit velit vitae vulputate. Vivamus vel tempus lacus. Fusce dictum, leo id porttitor dapibus, leo diam rutrum nulla, ut feugiat";

const mensaje2 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const miTexto = new baconian(mensaje1, false, true);
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
