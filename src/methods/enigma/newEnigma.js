/* eslint-disable no-alert */
import { default as BasicCipher } from '../../basicCipher.js';
import { default as Rotors } from './rotors.js';

/*

This code is intended to further develop the enigma.js file while enhencing it's functionality and customization.
Right now this is a Work in Progress and should not be used for actual coding / decoding
*/

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
		rotorVersion = 4,
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
		this.notch1 = '';
		this.notch2 = '';
		this.notch3 = '';
		this.initialize();
		this.selectRotors();
	}

	initialize = () => {
		// Function to be called at any point before we start to work with the code, I prefer to use it in the constructor and forget about it.
		this.rotorSettings = this.rotorSettings.replace(/[^1-9]/g, '');
		this.keySettings = this.keySettings.toUpperCase().replace(/[^A-Z]/g, '');
		this.ringSettings = this.ringSettings.toUpperCase().replace(/[^A-Z]/g, '');

		this.plugboardSettings = this.plugboardSettings
			.toUpperCase()
			.replace(/[^A-Z]/g, '');
	};

	selectRotors = () => {
		// Needs to include the split for appropiate rotor selection, right now it takes the first 3 of the set
		const rotorOptions = new Rotors();
		switch (this.rotorSet) {
			case 1:
				this.rotorSets = rotorOptions.rotorSet1;
				break;
			case 2:
				this.rotorSets = rotorOptions.rotorSet2;
				break;
			case 3:
				this.rotorSets = rotorOptions.rotorSet3;
				break;
			case 4:
				this.rotorSets = rotorOptions.rotorSet4;
				break;
			case 5:
				this.rotorSets = rotorOptions.rotorSet5;
				break;
			default:
				this.rotorSets = rotorOptions.rotorSet4;
				break;
		}
		const rotors = this.rotorSettings.split('');
		// Right (fast) rotor
		rotors[0] = this.rotorSets[rotors[0]].join();
		[[this.notch1]] = rotors;
		// MIddle rotor
		rotors[1] = this.rotorSets[rotors[1]].join();
		[, [this.notch1]] = rotors;
		// Left (slow) rotor
		rotors[2] = this.rotorSets[rotors[2]].join();
		[, , [this.notch1]] = rotors;
		// Pass rotors to the object
		this.rotors = rotors;
		return rotors;
	};

	validateSettings = plaintext => {
		// do some error checking
		let retorno = true;
		if (plaintext.length < 1) {
			alert('please enter some plaintext (letters and numbers only)');
			retorno = false;
		}
		if (this.keySettings.length !== 3) {
			alert('Key settings must consist of 3 uppercase characters.');
			retorno = false;
		}
		if (this.ringSettings.length !== 3) {
			alert('Ring settings must consist of 3 uppercase characters.');
			retorno = false;
		}
		if (this.plugboardSettings.length > 26) {
			alert('There cannot be more than 13 pairs in the plugboard settings.');
			retorno = false;
		}
		if (this.plugboardSettings.length % 2 !== 0) {
			alert(
				'There must be an even number of characters in the plugboard settings.'
			);
			retorno = false;
		}
		if (this.rotorSettings.length !== 3) {
			alert('Rotor settings must consist of 3 numbers 1-9.');
			retorno = false;
		}
		return retorno;
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

	getRotors = () => this.rotors;

	getRotorSets = () => this.rotorSets;

	shiftRotor = (rotor, steps = 1) =>
		// Simply shift the rotor 1 space
		rotor.slice(steps) + rotor.substr(0, steps);

	shiftRotors = () => {
		/*
      This method is used so that ALL rotors move after typing a character.
      It simulates the actual steps of the rotors with their notchs.
    */
		this.rotors[0] = this.shiftRotor(this.rotors[0], 1);
		if (this.rotors[0][0] === this.notch1) {
			this.rotors[1] = this.shiftRotor(this.rotors[1], 1);
			if (this.rotors[1][0] === this.notch2) {
				this.rotors[2] = this.shiftRotor(this.rotors[2], 1);
			}
		}
	};

	encode = () => {
		let ciphertext = '';
		const plaintext = this.message.replace(/[^A-Z]/g, '');
		this.initialize();
		if (this.validateSettings(plaintext)) {
			ciphertext = 'Valid Settings';
			// Encode text
			plaintext.split('').forEach(c => {
				// console.log(c, this.rotors);
				/* All thats's missing now is to process the simple substitition in order: 
        1) Plugboard
        2) First rotor
        3) Second Rotor
        4) third Rotor
        5) reflector
        6) third rotor
        7) second rotor
        8) first rotor
        */
				this.shiftRotors();
			});
		}
		return ciphertext;
	};
}
