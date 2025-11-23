// test script for parent and child documents.

const nigma = require('../../src/index');

const message = 'Encode this text please';
describe('Test if JEST is working', () => {
  test(`Should return true if TEST runner is OK`, () => {
    expect(1 + 1).toBe(2);
  });
});

/*
Since I'm new to JS, I don't know how to implement this sort of testing. I keep it in comments so that this week I can take it and post it in stackoverflow or some other support site.
function cipherTest(cipherObject, message, encodedMessage) {
  return test(`Should Encode message Using ${cipherObject.getMethod()} module and return a perfect Match`, () => {
    console.log(`Running test ${cipherObject.getMethod()}`);
    expect(cipherObject.encode()).toBe(encodedMessage);
  });
}
*/

// -------------------------------------ENIGMA UNIT TEST-------------------------------------

/*
const method = "Enigma";
const encoded = "FOKXHYXLOPZMLMHZOMEF";
const generator = new nigma.Enigma(message);
test(`Should Encode message Using ${method} module and return a perfect Match`, () => {
  console.log(`Running test ${method}`);
  expect(generator.encode(message)).toBe(encoded);
});
*/
