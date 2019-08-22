const nigma = require('../../index');

const message = 'Encode this text please';

/*
Since I'm new to JS, I don't know how to implement this sort of testing. I keep it in comments so that this week I can take it and post it in stackoverflow or some other support site.
function cipherTest(cipherObject, message, encodedMessage) {
  return test(`Should Encode message Using ${cipherObject.getMethod()} module and return a perfect Match`, () => {
    console.log(`Running test ${cipherObject.getMethod()}`);
    expect(cipherObject.encode()).toBe(encodedMessage);
  });
}
*/
describe('Test Enigma Methods', () => {
	// -------------------------------------ENIGMA UNIT TEST-------------------------------------
	const method = 'Enigma';
	const encoded = 'FOKXHYXLOPZMLMHZOMEF';
	const generator = new nigma.Enigma(message);
	test(`Should Encode message Using ${method} module and return a perfect Match`, () => {
		expect(generator.encode(message)).toBe(encoded);
	});
});
