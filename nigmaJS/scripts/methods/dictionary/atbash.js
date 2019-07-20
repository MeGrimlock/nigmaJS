class atbash extends BasicCipher {
  constructor(message, encoded = false, debug = false) {
    /*console.log(
          `AMSCO Constructor> KEY :${key} Encoded:${encoded} DEBUG:${debug}\n Msg: ${message} \n `
        );*/

    const alphabet = {
      "4": "a",
      "3": "b",
      "2": "c",
      "1": "d",
      "0": "e",
      z: "f",
      y: "g",
      x: "h",
      w: "i",
      v: "j",
      u: "k",
      t: "l",
      s: "m",
      r: "n",
      q: "o",
      p: "p",
      o: "q",
      n: "r",
      m: "s",
      l: "t",
      k: "u",
      j: "v",
      i: "w",
      h: "x",
      g: "y",
      f: "z",
      e: "0",
      d: "1",
      c: "2",
      b: "3",
      a: "4",
      "!": "5",
      "?": "6",
      ",": "7",
      ".": "8",
      " ": "9",
      "9": " ",
      "8": ".",
      "7": ",",
      "6": "?",
      "5": "!"
    };

    super(message, encoded, "atbash", "", alphabet, debug);
    //Parametros: message,encoded,method,key,alphabet
    // constructor(message, encoded, method, key, alphabet, debug)
    //logMessage("constuctor",this);
  }

  encode = () => this.encodeAlphabet("", " ");
  decode = () => this.decodeAlphabet("", " ");
}

const mensaje1 =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dapibus suscipit velit vitae vulputate. Vivamus vel tempus lacus. Fusce dictum, leo id porttitor dapibus, leo diam rutrum nulla, ut feugiat";

const mensaje2 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const miTexto = new atbash(mensaje1, false, true);

document.write(
  "Encoding Text1: <br>",
  miTexto.getMsg(),
  "<br>-><br>",
  miTexto.encode() + "<br>"
);

const miTexto2 = new atbash(miTexto.encode(), true, true);
document.write(
  "<br>Decoding Text2: <br>",
  miTexto2.getMsg(),
  "<br>-><br>",
  miTexto2.decode() + "<br>"
);

miTexto.frecuencyAnalysis();
