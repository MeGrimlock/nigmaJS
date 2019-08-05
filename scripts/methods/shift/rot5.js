import { default as BasicCipher } from "../../basicCipher.js";

export default class rot5 extends BasicCipher {
  constructor(message, encoded = false, debug = false) {
    super(message, encoded, "rot5", 5, "", debug);
  }

  encode = () => this.shiftCharacters(this.message, this.key);
  decode = () => this.shiftCharacters(this.message, -this.key);
}
