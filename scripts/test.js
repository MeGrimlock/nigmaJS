//test script for parent and child documents.
import {
  default as Nigma,
  Dictionary,
  Shift,
  Columnar,
  Enigma
} from "./nigma.js";

let nigma = new Nigma();

let key = 13;
let amscoKey = "234561";
const myKey = "Tyranosaurusrex";

const miTexto = new Dictionary.morse(nigma.getTestMessage(3), false);
const miTexto2 = new Shift.rot13(miTexto.getMsg(), key, false);
const miTexto3 = new Columnar.amsco(miTexto.getMsg(), amscoKey, false);
const miTexto4 = new Enigma(nigma.getTestMessage(3));

function output(decrypted, encrypted) {
  console.log("log:", decrypted, encrypted);
  let container = document.getElementById("messages");
  let content = document.createElement("span");
  content.innerHTML = `<h3>Encoding Text: </h3> ${decrypted}<h4> -></h4>${encrypted}<br>`;
  container.appendChild(content);
}
/*
output(miTexto.getMsg(), miTexto.encode());
output(miTexto2.getMsg(), miTexto2.encode());
output(miTexto3.getMsg(), miTexto3.encode());*/
output(miTexto4.getMsg(), miTexto4.encode());
console.log(miTexto4.getMsg());
