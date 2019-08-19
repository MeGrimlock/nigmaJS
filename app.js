//test script for parent and child documents.
import {
	default as Nigma,
	Enigma,
	Dictionary,
	Columnar,
	Shift
} from "./src/index.js";

const sampleMessage = "Encode this text please";
//Enigma sample code
const newMachine = new Enigma(sampleMessage);
output(newMachine.getMsg(), newMachine.encode());

//morse sample code
const newMorse = new Dictionary.morse(sampleMessage);
output(newMorse.getMsg(), newMorse.encode());

//New Bazeries
const newBazeries = new Dictionary.bazeries(
	"simple substitution plus transposition",
	"threethousandfiftytwo"
);
output(newBazeries.getMsg(), newBazeries.encode());

//morse sample code
const newAtbash = new Dictionary.atbash(sampleMessage);
output(newAtbash.getMsg(), newAtbash.encode());
newAtbash.setMsg("0r2q10 lxwm l0hl  pt04m0");
newAtbash.setEncoded(true);
console.log(newAtbash.decode());

function output(decrypted, encrypted) {
	console.log("log:", decrypted, encrypted);
	let container = document.getElementById("messages");
	let content = document.createElement("span");
	encrypted = newMachine.text2block(encrypted, 5);
	content.innerHTML = `<h3>Encoding Text: </h3> ${decrypted}<h4> -></h4>${encrypted}<br>`;
	container.appendChild(content);
}
