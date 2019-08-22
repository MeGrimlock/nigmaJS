import { default as BasicCipher } from "../../basicCipher.js";

export default class Rot18 extends BasicCipher {
	constructor(message, encoded = false, debug = false) {
		super(message, encoded, "rot18", 18, "", debug);
	}

	encode = () => this.shiftCharacters(this.message, this.key);

	decode = () => this.shiftCharacters(this.message, -this.key);
}

// export default rot18;
