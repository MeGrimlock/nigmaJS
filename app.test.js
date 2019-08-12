//test script for parent and child documents.
const nigma = require("./src/index");
const message = "Encode this text please";

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
const method1 = "Enigma";
const encoded1 = "FOKXHYXLOPZMLMHZOMEF";
const generator1 = new nigma.Enigma(message);
test(`Should Encode message Using ${method1} module and return a perfect Match`, () => {
  console.log(`Running test ${method1}`);
  expect(generator1.encode(message)).toBe(encoded1);
});

//-------------------------------------ATBASH UNIT TEST-------------------------------------
const method2 = "Atbash";
const encoded2 = "0r2q10 lxwm l0hl pt04m0";
const generator2 = new nigma.Dictionary.atbash(message);
test(`Should Encode message Using ${method2} module and return a perfect Match`, () => {
  console.log(`Running test ${method2}`);
  expect(generator2.encode()).toBe(encoded2);
});
//-------------------------------------AUTOKEY UNIT TEST-------------------------------------
const method3 = "Autokey";
const key3 = "Tyranosaurus";
const encoded3 = "xltoqslhcjnwbgrzhell";
const generator3 = new nigma.Dictionary.autokey(message, key3);
test(`Should Encode message Using ${method3} module and return a perfect Match`, () => {
  console.log(`Running test ${method3}`);
  expect(generator3.encode()).toBe(encoded3);
});
//-------------------------------------BACONIAN UNIT TEST-------------------------------------
const method4 = "Baconian";
const encoded4 =
  "aabaa abbab aaaba abbba aaabb aabaa   baabb aabbb abaaa baaba   baabb aabaa babbb baabb   abbbb ababb aabaa aaaaa baaba aabaa";
const generator4 = new nigma.Dictionary.baconian(message);
test(`Should Encode message Using ${method4} module and return a perfect Match`, () => {
  console.log(`Running test ${method4}`);
  expect(generator4.encode()).toBe(encoded4);
});
//-------------------------------------MORSE UNIT TEST-------------------------------------
const generator5 = new nigma.Dictionary.morse(message);
const encoded5 =
  ". -. -.-. --- -.. .   - .... .. ...   - . -..- -   .--. .-.. . .- ... .";
const method5 = "Morse";
test(`Should Encode message Using ${method5} module and return a perfect Match`, () => {
  console.log(`Running test ${method5}`);
  expect(generator5.encode()).toBe(encoded5);
});
//-------------------------------------SIMPLE SUBSTITUTION UNIT TEST-------------------------------------
const method6 = "Simple Substitution";
const key6 = "Tyranosaurus";
const encoded6 = "lejfkl wopg wlzw usldgl";

const generator6 = new nigma.Dictionary.simpleSubstitution(message, key6);
test(`Should Encode message Using ${method6} module and return a perfect Match`, () => {
  console.log(`Running test ${method6}`);
  expect(generator6.encode()).toBe(encoded6);
});
