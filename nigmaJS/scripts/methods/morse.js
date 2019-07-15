import * as BasicCipher from "../basicCipher.js";

class morse extends BasicCipher {
	/*
  https://en.wikipedia.org/wiki/Morse_code

  Morse code is a character encoding scheme used in telecommunication that encodes text characters as standardized 
  sequences of two different signal durations called dots and dashes or dits and dahs. 
  Morse code is named for Samuel F. B. Morse, an inventor of the telegraph.

  There are 3 types of alphabets American (Morse), Continental (Gerke) and International (ITU)

  Suitable length: Any since it doesn't really encrypt
  
  */

	constructor(message, encoded) {
		const alphabet = {
			"-----": "0",
			".----": "1",
			"..---": "2",
			"...--": "3",
			"....-": "4",
			".....": "5",
			"-....": "6",
			"--...": "7",
			"---..": "8",
			"----.": "9",
			".-": "a",
			"-...": "b",
			"-.-.": "c",
			"-..": "d",
			".": "e",
			"..-.": "f",
			"--.": "g",
			"....": "h",
			"..": "i",
			".---": "j",
			"-.-": "k",
			".-..": "l",
			"--": "m",
			"-.": "n",
			"---": "o",
			".--.": "p",
			"--.-": "q",
			".-.": "r",
			"...": "s",
			"-": "t",
			"..-": "u",
			"...-": "v",
			".--": "w",
			"-..-": "x",
			"-.--": "y",
			"--..": "z",
			"/": " ",
			"-·-·--": "!",
			"·-·-·-": ".",
			"--··--": ","
		};
		super(message, encoded, "morse", "", alphabet);
		//Parametros: message,encoded,method,key,alphabet
		//WE have no key but we do have an alphabet
		//this.decode.bind(this);
		//console.log("constuctor",this);
	}

	decode = () => {
		let messageConverted = [];

		if (this.encoded === true) {
			console.log("Decoding...", this.alphabet);
			let tempAlphabet = this.alphabet;
			this.message.split("   ").map(function(word) {
				word.split(" ").map(function(letter) {
					messageConverted.push(tempAlphabet[letter]);
				});
				messageConverted.push(" ");
			});
			console.log("Done");
		}
		return messageConverted;
	};

	encode = () => {
		//console.log("Encoding...",this);
		let originalMessage = "";
		let encodedMessage = "";
		if (this.encoded === false) {
			//console.log("ok");
			originalMessage = this.message.toLowerCase().replace(/[^a-z]/g, "");
			let temp = originalMessage.split("");
			temp.forEach(element => {
				let encodedChar = this.getKeyByValue(this.alphabet, element);
				encodedMessage += encodedChar;
				console.log("Conversion: ", element, encodedChar);
			});
		}
		return encodedMessage;
	};
}

//const miMorse = new morse(".-- --- .-. -..   .-- --- .-. -..",true);
const miMorse = new morse("Codificar esta frase 1234 @1", false);

document.write(miMorse.encode() + "<br>");
miMorse.setMsg("Cambie el mensaje");
document.write(miMorse.encode() + "<br>");
//console.log("call method:",miMorse.getMsg());
