// test script for parent and child documents.
import {
	default as Nigma,
	Enigma,
	Dictionary,
	Columnar,
	Shift
} from "./src/index.js";

function output(decrypted, encrypted) {
	//	console.log("log:", decrypted, encrypted);
	const container = document.getElementById("messages");
	const content = document.createElement("span");
	content.innerHTML = `<h3>Encoding Text: </h3> ${decrypted}<h4> -></h4>${encrypted}<br>`;
	container.appendChild(content);
}

const sampleMessage = "Encode this text please";
// Enigma sample code
const newMachine = new Enigma(sampleMessage);
output(newMachine.getMsg(), newMachine.encode());

// morse sample code
const newMorse = new Dictionary.Morse(sampleMessage);
output(newMorse.getMsg(), newMorse.encode());

// New Bazeries
const newBazeries = new Dictionary.Bazeries(
	"simple substitution plus transposition",
	"Eighty one thousand two hundred fifty seven"
);
output(newBazeries.getMsg(), newBazeries.encode());

// morse sample code
const newAtbash = new Dictionary.Atbash(sampleMessage);
output(newAtbash.getMsg(), newAtbash.encode());
newAtbash.setMsg("0r2q10 lxwm l0hl  pt04m0");
newAtbash.setEncoded(true);
