import { default as BasicCipher } from "../../basicCipher.js.js";

export default class simpleSubstitution extends BasicCipher {
  constructor(message, key, encoded = false, debug = false) {
    /*console.log(
            `AMSCO Constructor> KEY :${key} Encoded:${encoded} DEBUG:${debug}\n Msg: ${message} \n `
          );*/

    const alphabet = {
      // The keyword is what modifies the key of this alphabet by using the corresponding constructor
      a: "",
      b: "",
      c: "",
      d: "",
      e: "",
      f: "",
      g: "",
      h: "",
      i: "",
      j: "",
      k: "",
      l: "",
      m: "",
      n: "",
      o: "",
      p: "",
      q: "",
      r: "",
      s: "",
      t: "",
      u: "",
      v: "",
      w: "",
      x: "",
      y: "",
      z: "",
      "0": "0",
      "1": "1",
      "2": "2",
      "3": "3",
      "4": "4",
      "5": "5",
      "6": "6",
      "7": "7",
      "8": "8",
      "9": "9",
      " ": " ",
      ".": ".",
      ",": ",",
      "?": "?",
      "!": "!"
    };

    super(message, encoded, "simpleSubstitution", key, alphabet, debug);
    this.setAlphabet(this.alphabetConstructor(alphabet, key));

    this.wordSep = " ";
    this.characterSep = "";
    //Parametros: message,encoded,method,key,alphabet
    // constructor(message, encoded, method, key, alphabet, debug)
    //logMessage("constuctor",this);
  }

  alphabetConstructor = (alphabet, keyWord) => {
    let usedLetters = [];
    let keyIndex = 97; //lower case "a"
    keyWord.split("").forEach(keyWordChar => {
      //Filter repetitions of letters
      if (!usedLetters.includes(keyWordChar)) {
        alphabet[String.fromCharCode(keyIndex)] = keyWordChar;
        usedLetters.push(keyWordChar);
        keyIndex++;
      }
    });
    //continue assigning letters until lower case "z" 122d
    let letterIndex = 97;
    let letter = "";
    do {
      letter = String.fromCharCode(letterIndex);
      if (usedLetters.includes(letter)) {
      } else {
        alphabet[String.fromCharCode(keyIndex)] = letter;
        keyIndex++;
      }
      letterIndex++;
    } while (keyIndex < 123);
    return alphabet;
  };

  encode = () => this.encodeAlphabet(this.characterSep, this.wordSep);
  decode = () => this.decodeAlphabet(this.characterSep, this.wordSep);
}

// export default simpleSubstitution;
