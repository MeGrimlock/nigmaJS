class morse extends BasicCipher {
  /*
  https://en.wikipedia.org/wiki/Morse_code

  Morse code is a character encoding scheme used in telecommunication that encodes text characters as standardized 
  sequences of two different signal durations called dots and dashes or dits and dahs. 
  Morse code is named for Samuel F. B. Morse, an inventor of the telegraph.

  There are 3 types of alphabets American (Morse), Continental (Gerke) and International (ITU)

  Suitable length: Any since it doesn't really encrypt
  
  */

  constructor(message, encoded) {
    const alphabet = {
      "-----": "0",
      ".----": "1",
      "..---": "2",
      "...--": "3",
      "....-": "4",
      ".....": "5",
      "-....": "6",
      "--...": "7",
      "---..": "8",
      "----.": "9",
      ".-": "a",
      "-...": "b",
      "-.-.": "c",
      "-..": "d",
      ".": "e",
      "..-.": "f",
      "--.": "g",
      "....": "h",
      "..": "i",
      ".---": "j",
      "-.-": "k",
      ".-..": "l",
      "--": "m",
      "-.": "n",
      "---": "o",
      ".--.": "p",
      "--.-": "q",
      ".-.": "r",
      "...": "s",
      "-": "t",
      "..-": "u",
      "...-": "v",
      ".--": "w",
      "-..-": "x",
      "-.--": "y",
      "--..": "z",
      "/": " ",
      "-·-·--": "!",
      "·-·-·-": ".",
      "--··--": ","
    };
    super(message, encoded, "morse", "", alphabet);
    //Parametros: message,encoded,method,key,alphabet
    //WE have no key but we do have an alphabet
    //this.decode.bind(this);
    //console.log("constuctor",this);
  }

  decode = () => this.decodeAlphabet(" ", "   ");

  encode = () => this.encodeAlphabet(" ", "   ");
}

const mensaje1 =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dapibus suscipit velit vitae vulputate.";

const mensaje2 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const miTexto = new morse(mensaje1, false, true);
const miTexto2 = new morse(miTexto.encode(), true, true);

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
