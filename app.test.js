//test script for parent and child documents.
const nigma = require("./src/index");
const message = "Encode this text please";

const enigmaEncoded = "FOKXHYXLOPZMLMHZOMEF";
const enigmaMachine = new nigma.Enigma(message);

test("Should Encode message Using ENIGMA module and return a perfect Match", () => {
  console.log("Running test ENIGMA");
  expect(enigmaEncoded).toBe(enigmaMachine.encode(message));
});

const morseGenerator = new nigma.Dictionary.morse(message);
const morseEncoded = "abs";
const temp =
  ". -. -.-. --- -.. . / - .... .. ... / - . -..- - / .--. .-.. . .- ... .";

function cipherTest(cipherObject, message, encodedMessage) {
  return test("Should Encode message Using `$MORSE module and return a perfect Match", () => {
    console.log("Running test MORSE");
    expect(morseEncoded).toBe(morseGenerator.encode(message));
  });
}
