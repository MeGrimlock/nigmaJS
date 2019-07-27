import { default as BasicCipher } from "../../basicCipher.js.js";

export default class atbash extends BasicCipher {
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

    this.wordSep = " ";
    this.characterSep = "";
    //Parametros: message,encoded,method,key,alphabet
    // constructor(message, encoded, method, key, alphabet, debug)
    //logMessage("constuctor",this);
  }

  encode = () => this.encodeAlphabet(this.characterSep, this.wordSep);
  decode = () => this.decodeAlphabet(this.characterSep, this.wordSep);
}

// export default atbash;
