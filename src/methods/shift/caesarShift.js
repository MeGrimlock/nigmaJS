import { default as BasicCipher } from "../../basicCipher.js";

/**
 * Caesar cipher, also known as Caesar's cipher, the shift cipher, Caesar's code or Caesar shift, 
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
  @param {String} message this text is what we want to get encoded/decoded
  @param {number} key a number that is used to shift the alphabet
  @param {Boolean} encoded optional value that indicates if the message is already encoded
  @param {Boolean} debug optional value used to show/ debug messages
 */

export default class CaesarShift extends BasicCipher {
  constructor(message, key, encoded = false, debug = false) {
    super(message, encoded, "caesarShift", key, "", debug);
  }

  /**
   * @method encode
   * @param {String} message text to use for encoding, if empty use stored message
   * @param {number} key key to use for encoding, if empty use stored key
   */

  encode = (message = this.message, myKey = this.key) =>
    this.shiftCharacters(message, myKey);

  /**
   * @method decode
   * @param {String} message text to use for decoding, if empty use stored message
   * @param {number} key input the same key used for encoding, if empty method uses stored key
   */

  decode = (message = this.message, myKey = this.key) =>
    this.shiftCharacters(message, -myKey);
}
