//test script for parent and child documents.
const nigma = require("./src/index");
const message = "Encode this text please";
var method = "";

/*
Since I'm new to JS, I don't know how to implement this sort of testing. I keep it in comments so that this week I can take it and post it in stackoverflow or some other support site.
function cipherTest(cipherObject, message, encodedMessage) {
  return test(`Should Encode message Using ${cipherObject.getMethod()} module and return a perfect Match`, () => {
    console.log(`Running test ${cipherObject.getMethod()}`);
    expect(cipherObject.encode()).toBe(encodedMessage);
  });
}
*/

//-------------------------------------ENIGMA UNIT TEST-------------------------------------
const enigmaMachine = new nigma.Enigma(message);
const enigmaEncoded = "FOKXHYXLOPZMLMHZOMEF";
method = "Enigma";
test(`Should Encode message Using ${method} module and return a perfect Match`, () => {
  console.log("Running test ENIGMA");
  expect(enigmaMachine.encode(message)).toBe(enigmaEncoded);
});
//-------------------------------------MORSE UNIT TEST-------------------------------------
const morseGenerator = new nigma.Dictionary.morse(message);
const morseEncoded =
  ". -. -.-. --- -.. .   - .... .. ...   - . -..- -   .--. .-.. . .- ... .";
method = "Morse";
test(`Should Encode message Using ${method} module and return a perfect Match`, () => {
  console.log("Running test ENIGMA");
  expect(morseGenerator.encode()).toBe(morseEncoded);
});
