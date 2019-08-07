//test script for parent and child documents.
import { default as Nigma, Enigma } from "./index.js";

const newMachine = new Enigma("Encode this text please");

function output(decrypted, encrypted) {
  console.log("log:", decrypted, encrypted);
  let container = document.getElementById("messages");
  let content = document.createElement("span");
  encrypted = newMachine.text2block(encrypted, 5);
  content.innerHTML = `<h3>Encoding Text: </h3> ${decrypted}<h4> -></h4>${encrypted}<br>`;
  container.appendChild(content);
}

output(newMachine.getMsg(), newMachine.encode());
