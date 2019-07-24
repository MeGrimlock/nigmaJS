class Nigma {
  constructor(message = "") {
    this.testMessages = [
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      "Las dos jornadas tuvieron un denominador común: insistir, y mucho, en educar en temas financieros, a los efectos de que la gente tenga claro cuáles son las ventajas y riesgos a los que se enfrenta.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dapibus suscipit velit vitae vulputate. Vivamus vel tempus lacus. Fusce dictum, leo id porttitor dapibus, leo diam rutrum nulla, ut feugiat",
      "La posición de Washington hacia las elecciones en Palestina ha sido coherente. Las elecciones fueron postergadas hasta la muerte de Yasser Arafat, que fue recibida como una oportunidad para la realización  "
    ];

    const spanishLetterFrequencies = {
      A: 12.5,
      K: 0.08,
      T: 4.42,
      B: 1.27,
      L: 5.84,
      U: 4.0,
      C: 4.43,
      M: 2.61,
      V: 0.98,
      D: 5.14,
      N: 7.09,
      W: 0.03,
      E: 13.24,
      Ñ: 0.22,
      X: 0.19,
      F: 0.79,
      O: 8.98,
      Y: 0.79,
      G: 1.17,
      P: 2.75,
      Z: 0.42,
      H: 0.81,
      Q: 0.83,
      I: 6.91,
      R: 6.62,
      J: 0.45,
      S: 7.44
    };

    const spanishBigramFrequencies = {
      DE: 2.57,
      AD: 1.43,
      TA: 1.09,
      ES: 2.31,
      AR: 1.43,
      TE: 1.0,
      EN: 2.27,
      RE: 1.42,
      OR: 0.98,
      EL: 2.01,
      AL: 1.33,
      DO: 0.98,
      LA: 1.8,
      AN: 1.24,
      IO: 0.98,
      OS: 1.79,
      NT: 1.22,
      AC: 0.96,
      ON: 1.61,
      UE: 1.21,
      ST: 0.95,
      AS: 1.56,
      CI: 1.15,
      NA: 0.92,
      ER: 1.52,
      CO: 1.13,
      RO: 0.85,
      RA: 1.47,
      SE: 1.11,
      UN: 0.84
    };

    const spanishTrigramFrequencies = {
      DEL: 0.75,
      EST: 0.48,
      PAR: 0.32,
      QUE: 0.74,
      LOS: 0.47,
      DES: 0.31,
      ENT: 0.67,
      ODE: 0.47,
      ESE: 0.3,
      ION: 0.56,
      ADO: 0.45,
      IEN: 0.3,
      ELA: 0.55,
      RES: 0.4,
      ALA: 0.29,
      CON: 0.54,
      STA: 0.38,
      POR: 0.29,
      SDE: 0.52,
      ACI: 0.36,
      ONE: 0.29,
      ADE: 0.51,
      LAS: 0.35,
      NDE: 0.29,
      CIO: 0.5,
      ARA: 0.34,
      TRA: 0.28,
      NTE: 0.49,
      ENE: 0.32,
      NES: 0.27
    };

    const spanishQuadgramFrequencies = {
      CION: 0.42,
      MENT: 0.16,
      NCIA: 0.14,
      DELA: 0.33,
      IONE: 0.16,
      AQUE: 0.14,
      ACIO: 0.27,
      ODEL: 0.16,
      SQUE: 0.14,
      ENTE: 0.25,
      ONDE: 0.16,
      ENCI: 0.13,
      ESTA: 0.22,
      OQUE: 0.15,
      ENLA: 0.13,
      ESDE: 0.22,
      IDAD: 0.15,
      ENTR: 0.13,
      PARA: 0.19,
      ELOS: 0.15,
      IENT: 0.12,
      ONES: 0.17,
      ADEL: 0.15,
      ASDE: 0.12,
      SDEL: 0.17,
      ANTE: 0.15,
      ENEL: 0.12,
      OSDE: 0.17,
      ENTO: 0.14,
      DELO: 0.12
    };

    const englishLetterFrequencies = {
      A: 8.55,
      K: 0.81,
      U: 2.68,
      B: 1.6,
      L: 4.21,
      V: 1.06,
      C: 3.16,
      M: 2.53,
      W: 1.83,
      D: 3.87,
      N: 7.17,
      X: 0.19,
      E: 12.1,
      O: 7.47,
      Y: 1.72,
      F: 2.18,
      P: 2.07,
      Z: 0.11,
      G: 2.09,
      Q: 0.1,
      H: 4.96,
      R: 6.33,
      I: 7.33,
      S: 6.73,
      J: 0.22,
      T: 8.94
    };

    this.message = message;
    this.alphabet = {
      /* The alphabet works the following way: 

        KEY: is the representation of the encrypted character.
        VALUE: is the value of the unencrypted character and can be adjusted as we try to break the code.
      
        */
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
  }

  // -------------------------------------------Dictionary Methods -------------------------------------------

  getTestMessage = number => this.testMessages[number];

  setMsg = msg => (this.message = msg);

  getMsg = () => this.message;

  getAlphabet = () => this.alphabet;

  getChar = cipheredChar => this.alphabet[cipheredChar];

  setChar = (cipheredChar, decodedChar) => {
    this.alphabet[cipheredChar] = decodedChar;
    console.log(
      `Derypting "${cipheredChar}" as  "${decodedChar}" :\n ${this.processMessage()}\n`
    );
    return this.processMessage();
  };

  resetAlphabet = () => {
    Object.keys(this.alphabet).map((key, index) => (this.alphabet[key] = key));
    return this.processMessage();
  };

  swapChar = (char1, char2) => {
    //Receives 2 keys and swaps their values in the alphabet, since we are testing the script it also updates the text.
    let tempChar = this.alphabet[char1];
    this.alphabet[char1] = this.alphabet[char2];
    this.alphabet[char2] = tempChar;
    return this.processMessage();
  };

  setByFrequency = () => {
    /*The method takes the analyzed text alphabet and compares it with the default language frequency reference. 
    This way we have a start but notice that it works in a very unefficient way */

    let sortedRefFreq = this.sortProperties(this.freqAnalysis(this.message));
    let sortedMsgFreq = this.sortProperties(this.getSLFreq());

    let index = 0;
    do {
      //sortedMsgFreq[index][0] = sortedRefFreq[index][0];
      this.setChar(
        String(sortedMsgFreq[index][0]).toLowerCase(),
        String(sortedRefFreq[index][0]).toLowerCase()
      );
      index++;
    } while (index < sortedRefFreq.length - 1);
    //console.table(sortedMsgFreq);
    return this.processMessage();
  };

  processMessage = () => {
    //Using the generated alphabet, the ciphered text is processed in an anttempt to decode it.
    let decodedMessage = "";
    let temp = this.message.split("");
    temp.forEach(element => {
      let decodedChar = this.alphabet[element];
      decodedChar !== ""
        ? (decodedMessage += decodedChar)
        : (decodedMessage += "?");
    });
    return decodedMessage;
  };
  // ---------------------------------------Frequency Analysis Methods ---------------------------------------

  getSLFreq = () => spanishLetterFrequencies;
  getS2Freq = () => spanishBigramFrequencies;
  getS3Freq = () => spanishTrigramFrequencies;
  getS4req = () => spanishQuadgramFrequencies;

  freqAnalysis = (message = "") => {
    //Take all of the characters inside of a text and return an array with this characters as a % of the total
    let pseudoAlphabet = {};
    let auxText = message.split("");

    //console.log("Frec. analysis");
    auxText.forEach(charElement => {
      if (charElement in pseudoAlphabet) {
        pseudoAlphabet[charElement] = pseudoAlphabet[charElement] + 1;
      } else {
        pseudoAlphabet[charElement] = 1;
      }
    });
    let totalChars = auxText.length;

    for (let [key, value] of Object.entries(pseudoAlphabet)) {
      //Convert the number of repetitions into a %
      pseudoAlphabet[key] = parseFloat(((value / totalChars) * 100).toFixed(3));
    }
    //console.log(pseudoAlphabet);
    return pseudoAlphabet;
  };

  // ---------------------------------------Auxiliary Analysis Methods ---------------------------------------

  sortProperties = (myArray, order = "desc") => {
    //Take an Object with Key:vlaue pairs and return an array ordered according to the order parameter
    let sortable = [];
    for (let element in myArray) {
      sortable.push([element, myArray[element]]);
    }

    order === "asc"
      ? sortable.sort((a, b) => a[1] - b[1])
      : sortable.sort((a, b) => b[1] - a[1]);
    return sortable;
  };
}

let nigma = new Nigma();

const myKey = "Tyranosaurusrex";

const miTexto = new simpleSubstitution(
  nigma.getTestMessage(3),
  myKey,
  false,
  true
);

const miTexto2 = new simpleSubstitution(miTexto.encode(), myKey, true, true);
/*
document.write(
  "<h3>Encoding Text1: </h3>",
  miTexto.getMsg(),
  "<h4> -></h4>",
  miTexto.encode() + "<br>"
);

document.write(
  "<h3><br>Decoding Text2: </h3>",
  miTexto2.getMsg(),
  "<h4>-></h4>",
  miTexto2.decode() + "<br>"
);*/

nigma.setMsg(miTexto2.getMsg());

console.log("Reset Alphabet");
console.log(nigma.resetAlphabet());

nigma.setChar("m", "l");
nigma.setChar("b", "a");
nigma.setChar("s", "s");
nigma.setChar("e", "d");
nigma.setChar("c", "n");
nigma.setChar("f", "e");
nigma.setChar("h", "g");
nigma.setChar("d", "c");
nigma.setChar("j", "i");
nigma.setChar("k", "j");
nigma.setChar("n", "m");
nigma.setChar("g", "f");
nigma.setChar("i", "h");

console.log(nigma.setByFrequency());
