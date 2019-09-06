// test script for parent and child documents.
const nigmajs = require('./src/index.js');

const sampleMessage = 'Encode this text please';

/**
 * Method for publishing on the page what we are encrypting
 *
 * @method output
 * @param {String}
 * @param {String}
 * @return {nothing}
 */
function output(cipher, section) {

	/*
	console.log(
		`[${cipher.getMethod()}]: Plaintext: ${cipher.getMsg()} Ciphertext: ${cipher.encode()} `
	); */
}
/*
function output(cipher, section) {
	/**
	 * Method for publishing on the page what we are encrypting
	 *
	 * @method output
	 * @param {String}
	 * @param {String}
	 * @return {nothing}

	//	console.log("log:", decrypted, encrypted);
	const container = document.getElementById(section);
	const content = document.createElement('div');
	content.setAttribute('id', cipher.getMethod());
	content.setAttribute('style', 'margin-left: 50px');
	content.innerHTML = `<h3>Encoding Text using: [${cipher.getMethod()}] encryption: </h3> <strong>Plaintext:</strong> ${cipher.getMsg()} <br> <strong>Ciphertext:</strong> ${cipher.encode()}<br>`;
	container.appendChild(content);
} */

// -----------------------------------------------------COLUMNAR-----------------------------------------------------

// Enigma sample code
const newAmsco = new nigmajs.Columnar.Amsco(sampleMessage, '321');
output(newAmsco, 'Columnar');

// -----------------------------------------------------DICTIONARY-----------------------------------------------------

const newAtbash = new nigmajs.Dictionary.Atbash(sampleMessage);
output(newAtbash, 'Dictionary');
newAtbash.setMsg('0r2q10 lxwm l0hl  pt04m0');
newAtbash.setEncoded(true);

const newAutokey = new nigmajs.Dictionary.Autokey(
	sampleMessage,
	'Tyranosaurus'
);
output(newAutokey, 'Dictionary');

const newBaconian = new nigmajs.Dictionary.Baconian(sampleMessage);
output(newBaconian, 'Dictionary');

const newBazeries = new nigmajs.Dictionary.Bazeries(
	'simple substitution plus transposition',
	'Eighty one thousand two hundred fifty seven'
);
output(newBazeries, 'Dictionary');

const newMorse = new nigmajs.Dictionary.Morse(sampleMessage);
output(newMorse, 'Dictionary');

const newSimpleSubstitution = new nigmajs.Dictionary.SimpleSubstitution(
	sampleMessage,
	'Tyranosaurus'
);
output(newSimpleSubstitution, 'Dictionary');

// -----------------------------------------------------ENIGMA-----------------------------------------------------

// Enigma sample code
const newMachine = new nigmajs.Enigma(sampleMessage);
output(newMachine, 'Enigma');

// -----------------------------------------------------SHIFT-----------------------------------------------------

const newCaesar = new nigmajs.Shift.CaesarShift(sampleMessage, 1);
output(newCaesar, 'Shift');

console.log(nigmajs);
module.exports = nigmajs;
