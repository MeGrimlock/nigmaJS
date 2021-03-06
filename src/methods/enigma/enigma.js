import { default as BasicCipher } from '../../basicCipher.js';
import { default as Rotors } from './rotors.js';

export default class Enigma extends BasicCipher {
	/* Enigma Machine - German WWII
    
    ttps://en.wikipedia.org/wiki/Enigma_machine

    The Enigma machine is an encryption device developed and used in the early- to mid-20th century to protect commercial, 
    diplomatic and military communication. It was employed extensively by Nazi Germany during World War II, in all branches of the German military.
    
    Enigma has an electromechanical rotor mechanism that scrambles the 26 letters of the alphabet. In typical use, 
    one person enters text on the Enigma’s keyboard and another person writes down which of 26 lights above the keyboard 
    lights up at each key press. If plain text is entered, the lit-up letters are the encoded ciphertext. 
    Entering ciphertext transforms it back into readable plaintext. 

    The rotor mechanism changes the electrical connections between the keys and the lights with each keypress.
    The security of the system depends on Enigma machine settings that were changed daily, based on secret key lists distributed in advance, 
    and on other settings that change for each message. 
    
    Additional info on rotors: https://en.wikipedia.org/wiki/Enigma_rotor_details
    
    The receiving station has to know and use the exact settings employed by the transmitting station to successfully decrypt a message.
    
    PS: One of the most famous encryption "methods" ever, it is my pleasure to enclude it in the module. 
    Disclaimer: All functions here were based on the works of :http://practicalcryptography.com/ciphers/enigma-cipher/ and adapted to ES6
    and CLass format. Thanks for your work, I couldn't have done this without your code :)

    */

	constructor(
		message,
		keySettings = 'AAA',
		ringSettings = 'AAA',
		plugboardSettings = 'PO ML IU KJ NH YT GB VF RE DC',
		rotorSettings = '123',
		encoded = false,
		debug = false
	) {
		// Enigma is a very complex system, no wonder it as so hard to crack during WWII. the rotors and plugs are responsible for the setup of the alphabet.

		super(message, encoded, 'enigma', '', '', debug);
		this.message = message.toUpperCase();
		this.keySettings = keySettings;
		this.ringSettings = ringSettings;
		this.plugboardSettings = plugboardSettings;
		this.rotorSettings = rotorSettings;
	}

	initialize = () => {
		this.rotorsettings = this.rotorSettings.replace(/[^1-9]/g, '');
		this.keysettings = this.keySettings.toUpperCase().replace(/[^A-Z]/g, '');
		this.ringsettings = this.ringSettings.toUpperCase().replace(/[^A-Z]/g, '');

		this.plugboardsettings = this.plugboardSettings
			.toUpperCase()
			.replace(/[^A-Z]/g, '');
	};

	setupPlugboard = () => {
		let plugboard = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		const parr = plugboard.split('');
		for (let i = 0, j = 1; i < this.plugboardsettings.length; i += 2, j += 2) {
			const ichar = plugboard.indexOf(this.plugboardsettings.charAt(i));
			const jchar = plugboard.indexOf(this.plugboardsettings.charAt(j));
			const temp = parr[jchar];
			parr[jchar] = parr[ichar];
			parr[ichar] = temp;
		}
		plugboard = parr.join('');
		return plugboard;
	};

	setupKey = () => {
		const key = this.keysettings.split('');
		key[0] = this.code(key[0]);
		key[1] = this.code(key[1]);
		key[2] = this.code(key[2]);
		return key;
	};

	setupCode = () => {
		const ring = this.ringsettings.split('');
		ring[0] = this.code(ring[0]);
		ring[1] = this.code(ring[1]);
		ring[2] = this.code(ring[2]);
		return ring;
	};

	getRotors = () => {
		const rotors = this.rotorsettings.split('');
		rotors[0] = rotors[0].valueOf() - 1;
		rotors[1] = rotors[1].valueOf() - 1;
		rotors[2] = rotors[2].valueOf() - 1;
		return rotors;
	};

	encode = () => {
		let ciphertext = '';
		const plaintext = this.message.replace(/[^A-Z]/g, '');
		this.initialize();
		if (this.validateSettings(plaintext)) {
			// interpret the rotor settings (strings 1-8 to int 0-7)
			const rotors = this.getRotors();
			// parse plugboard settings, store as a simple substitution key
			const plugboard = this.setupPlugboard();
			// interpret key and ring settings (convert from letters to numbers 0-25)
			let key = this.setupKey();
			const ring = this.setupCode();
			// do the actual enigma enciphering
			let ch = '';
			let echr = '';
			plaintext.split('').forEach(letter => {
				ch = letter;
				// if the current character is not a letter, pass it through unchanged
				if (!ch.match(/[A-Z]/)) {
					ciphertext += ch;
					// console.log(ch, " -> No change");
				} else {
					key = this.incrementSettings(key, rotors);
					echr = this.enigmaChar(ch, key, rotors, ring, plugboard);
					// console.log(ch, " -> ", echr);
					ciphertext += echr;
				}
			});
		}
		return ciphertext;
	};

	validateSettings = plaintext => {
		// do some error checking
		let retorno = true;
		if (plaintext.length < 1) {
			// alert("please enter some plaintext (letters and numbers only)");
			retorno = false;
		}
		if (this.keysettings.length !== 3) {
			// alert("Key settings must consist of 3 uppercase characters.");
			retorno = false;
		}
		if (this.ringsettings.length !== 3) {
			// alert("Ring settings must consist of 3 uppercase characters.");
			retorno = false;
		}
		if (this.plugboardsettings.length > 26) {
			// alert("There cannot be more than 13 pairs in the plugboard settings.");
			retorno = false;
		}
		if (this.plugboardsettings.length % 2 !== 0) {
			// alert("There must be an even number of characters in the plugboard settings.");
			retorno = false;
		}
		if (this.rotorsettings.length !== 3) {
			// alert("Rotor settings must consist of 3 numbers 1-9.");
			retorno = false;
		}
		return retorno;
	};

	enigmaChar = (channel, key, rotors, ring, plugboard) => {
		let ch = channel;
		// apply plugboard transformation
		ch = this.simplesub(ch, plugboard);
		// apply rotor transformations from right to left
		ch = this.rotor(ch, rotors[2], key[2] - ring[2]);
		ch = this.rotor(ch, rotors[1], key[1] - ring[1]);
		ch = this.rotor(ch, rotors[0], key[0] - ring[0]);
		// use reflector B
		ch = this.simplesub(ch, 'YRUHQSLDPXNGOKMIEBFZCWVJAT');
		// apply inverse rotor transformations from left to right
		ch = this.rotor(ch, rotors[0] + 8, key[0] - ring[0]);
		ch = this.rotor(ch, rotors[1] + 8, key[1] - ring[1]);
		ch = this.rotor(ch, rotors[2] + 8, key[2] - ring[2]);
		// apply plugboard transformation again
		ch = this.simplesub(ch, plugboard);
		return ch;
	};

	incrementSettings = (refKey, r) => {
		// notch = [['Q','Q'],['E','E'],['V','V'],['J','J'],['Z','Z'],['Z','M'],['Z','M'],['Z','M']];
		// The notch array stores the positions at which each rotor kicks over the rotor to its left
		const key = refKey;
		const notch = [
			[16, 16],
			[4, 4],
			[21, 21],
			[9, 9],
			[25, 25],
			[25, 12],
			[25, 12],
			[25, 12]
		];
		if (key[1] === notch[r[1]][0] || key[1] === notch[r[1]][1]) {
			key[0] = (key[0] + 1) % 26;
			key[1] = (key[1] + 1) % 26;
		}
		if (key[2] === notch[r[2]][0] || key[2] === notch[r[2]][1]) {
			key[1] = (key[1] + 1) % 26;
		}
		key[2] = (key[2] + 1) % 26;
		return key;
	};

	// perform a simple substitution cipher
	simplesub = (ch, key) => key.charAt(this.code(ch));

	rotor = (ch, r, offset) => {
		/* 
    There are many versions of the rotors, in a future update I'll include this so that you can recreate other versions of enigma machines.
    The first eight strings represent the rotor substitutions I through VIII (see wiki article for more info), what's instresting is that
    once this class is reworked for better code recycling, you will be able to create your own rotors. 
    
    The second 8 are the inverse transformations 
    
    */
		const key = [
			'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
			'AJDKSIRUXBLHWTMCQGZNPYFVOE',
			'BDFHJLCPRTXVZNYEIWGAKMUSQO',
			'ESOVPZJAYQUIRHXLNFTGKDCMWB',
			'VZBRGITYUPSDNHLXAWMJQOFECK',
			'JPGVOUMFYQBENHZRDKASXLICTW',
			'NZJHGRCXMYSWBOUFAIVLPEKQDT',
			'FKQHTLXOCBJSPDZRAMEWNIUYGV',
			// inverses
			'UWYGADFPVZBECKMTHXSLRINQOJ',
			'AJPCZWRLFBDKOTYUQGENHXMIVS',
			'TAGBPCSDQEUFVNZHYIXJWLRKOM',
			'HZWVARTNLGUPXQCEJMBSKDYOIF',
			'QCYLXWENFTZOSMVJUDKGIARPHB',
			'SKXQLHCNWARVGMEBJPTYFDZUIO',
			'QMGYVPEDRCWTIANUXFKZOSLHJB',
			'QJINSAYDVKBFRUHMCPLEWZTGXO'
		];
		/* the following code looks a bit horrible, but it is essentially just doing a simple substitution
      taking into account 16 possible keys (8 rotors and their inverses) and the offset (which is calculated
      from the indicator and ring settings). The offset essentially shifts the rotor key to the left or right
    */
		const chcode = (this.code(ch) + 26 + offset) % 26;
		const mapch = ((this.code(key[r].charAt(chcode)) + 26 - offset) % 26) + 65;
		// console.log("Rotor > char: ", ch, "->", mapch);
		return String.fromCharCode(mapch);
	};

	// return the number 0-25 given a letter [A-Za-z]
	code = ch => ch.toUpperCase().charCodeAt(0) - 65;
}
