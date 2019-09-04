// test script for parent and child documents.
import {
	default as Nigma,
	Enigma,
	Dictionary,
	Columnar,
	Shift
} from './src/index.js';

const sampleMessage = 'Encode this text please';

function output(cipher, section) {
	/**
	 * Method for publishing on the page what we are encrypting
	 *
	 * @method output
	 * @param {String}
	 * @param {String}
	 * @return {nothing}
	 */
	//	console.log("log:", decrypted, encrypted);
	const container = document.getElementById(section);
	const content = document.createElement('div');
	content.setAttribute('id', cipher.getMethod());
	content.setAttribute('style', 'margin-left: 50px');
	content.innerHTML = `<h3>Encoding Text using: [${cipher.getMethod()}] encryption: </h3> <strong>Plaintext:</strong> ${cipher.getMsg()} <br> <strong>Ciphertext:</strong> ${cipher.encode()}<br>`;
	container.appendChild(content);
}

// -----------------------------------------------------COLUMNAR-----------------------------------------------------

// Enigma sample code
const newAmsco = new Columnar.Amsco(sampleMessage, '321');
output(newAmsco, 'Columnar');

// -----------------------------------------------------DICTIONARY-----------------------------------------------------

const newAtbash = new Dictionary.Atbash(sampleMessage);
output(newAtbash, 'Dictionary');
newAtbash.setMsg('0r2q10 lxwm l0hl  pt04m0');
newAtbash.setEncoded(true);

const newAutokey = new Dictionary.Autokey(sampleMessage, 'Tyranosaurus');
output(newAutokey, 'Dictionary');

const newBaconian = new Dictionary.Baconian(sampleMessage);
output(newBaconian, 'Dictionary');

const newBazeries = new Dictionary.Bazeries(
	'simple substitution plus transposition',
	'Eighty one thousand two hundred fifty seven'
);
output(newBazeries, 'Dictionary');

const newMorse = new Dictionary.Morse(sampleMessage);
output(newMorse, 'Dictionary');

const newSimpleSubstitution = new Dictionary.SimpleSubstitution(
	sampleMessage,
	'Tyranosaurus'
);
output(newAutokey, 'Dictionary');

// -----------------------------------------------------ENIGMA-----------------------------------------------------

// Enigma sample code
const newMachine = new Enigma(sampleMessage);
output(newMachine, 'Enigma');

// -----------------------------------------------------SHIFT-----------------------------------------------------

const newCaesar = new Shift.CaesarShift(sampleMessage, 1);
output(newCaesar, 'Shift');
