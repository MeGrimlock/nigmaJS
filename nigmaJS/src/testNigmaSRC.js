//test script for parent and child documents.
import { default as Nigma, Dictionary, Shift, Columnar } from "./bundle.js";

let nigma = new Nigma();

let key = 13;
let amscoKey = "234561";
const myKey = "Tyranosaurusrex";

const miTexto = new Dictionary.morse(nigma.getTestMessage(3), false);
const miTexto2 = new Shift.rot13(miTexto.getMsg(), key, false);
const miTexto3 = new Columnar.amsco(miTexto.getMsg(), amscoKey, false);

function output(decrypted, encrypted) {
  console.log("log:", decrypted, encrypted);
  let container = document.getElementById("messages");
  let content = document.createElement("span");
  content.innerHTML = `<h3>Encoding Text: </h3> ${decrypted}<h4> -> </h4>${encrypted}<br>`;
  container.appendChild(content);
}

output(miTexto.getMsg(), miTexto.encode());
output(miTexto2.getMsg(), miTexto2.encode());
output(miTexto3.getMsg(), miTexto3.encode());

miTexto3.encode();
//nigma.setMsg(miTexto2.getMsg());
/*
console.log("Reset Alphabet");
console.log(nigma.resetAlphabet());

nigma.setChar("m", "l");
nigma.setChar("b", "a");
nigma.setChar("s", "s");
nigma.setChar("e", "d");
nigma.setChar("c", "n");
nigma.setChar("f", "e");
nigma.setChar("h", "g");
nigma.setChar("d", "c");
nigma.setChar("j", "i");
nigma.setChar("k", "j");
nigma.setChar("n", "m");
nigma.setChar("g", "f");
nigma.setChar("i", "h");
*/
//console.log(nigma.setByFrequency());
