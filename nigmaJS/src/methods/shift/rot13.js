import { default as BasicCipher } from "../../basicCipher.js";

export default class rot13 extends BasicCipher {
  constructor(message, encoded = false, debug = false) {
    super(message, encoded, "rot13", 13, "", debug);
  }

  encode = () => this.shiftCharacters(this.message, this.key);
  decode = () => this.shiftCharacters(this.message, -this.key);
}

// export default rot13;
