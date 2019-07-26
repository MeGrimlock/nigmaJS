import { default as BasicCipher } from "../../basicCipher.js";

export default class rot13 extends BasicCipher {
  constructor(message, encoded = false, debug = false) {
    key === parseInt(key)
      ? super(message, encoded, "rot13", 13, "", debug)
      : console.log("invalid key");
  }

  encode = () => this.shiftCharacters(this.message, this.key);
  decode = () => this.shiftCharacters(this.message, -this.key);
}

// export default rot13;
