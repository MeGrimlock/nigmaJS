//test script for parent and child documents.
import { default as Nigma, Enigma } from "./nigma.js";

const miTexto4 = new Enigma("Encode this text please");

function output(decrypted, encrypted) {
  console.log("log:", decrypted, encrypted);
  let container = document.getElementById("messages");
  let content = document.createElement("span");
  encrypted = miTexto4.text2block(encrypted, 5);
  content.innerHTML = `<h3>Encoding Text: </h3> ${decrypted}<h4> -></h4>${encrypted}<br>`;
  container.appendChild(content);
}

output(miTexto4.getMsg(), miTexto4.encode());
