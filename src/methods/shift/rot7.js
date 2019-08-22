import { default as BasicCipher } from '../../basicCipher.js';

export default class Rot7 extends BasicCipher {
	constructor(message, encoded = false, debug = false) {
		super(message, encoded, 'rot7', 7, '', debug);
	}

	encode = () => this.shiftCharacters(this.message, this.key);

	decode = () => this.shiftCharacters(this.message, -this.key);
}
