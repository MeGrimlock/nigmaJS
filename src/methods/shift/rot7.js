import { default as BasicCipher } from "../../basicCipher.js";

export default class Rot7 extends BasicCipher {
  constructor(message, encoded = false, debug = false) {
    super(message, encoded, "rot7", 7, "", debug);
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
