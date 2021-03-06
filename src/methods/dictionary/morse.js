import { default as BasicCipher } from "../../basicCipher.js";

/**
 * Morse code is a character encoding scheme used in telecommunication that encodes text characters as standardized
 * sequences of two different signal durations called dots and dashes or dits and dahs.
 * Morse code is named for Samuel F. B. Morse, an inventor of the telegraph.
 * There are 3 types of alphabets American (Morse), Continental (Gerke) and International (ITU)
 * Suitable length: Any since it doesn't really encrypt
 * https://en.wikipedia.org/wiki/Morse_code
 */

export default class morse extends BasicCipher {
  constructor(message, encoded = false) {
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
    this.wordSep = "   ";
    this.characterSep = " ";
    // Parametros: message,encoded,method,key,alphabet
    // WE have no key but we do have an alphabet
    // this.decode.bind(this);
    // console.log("constuctor",this);
  }

  /**
   * @method encode
   * @param {String} message text to use for encoding, if empty use stored message
   */
  encode = (message = this.message) =>
    this.encodeAlphabet(message, this.characterSep, this.wordSep);

  /**
   * @method decode
   * @param {String} message text to use for decoding, if empty use stored message
   */

  decode = (message = this.message) =>
    this.decodeAlphabet(message, this.characterSep, this.wordSep);
}

// export default morse;
