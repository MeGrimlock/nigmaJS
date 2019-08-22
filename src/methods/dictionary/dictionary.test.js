// test script for parent and child documents.
const Nigma = require('../../index');

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
describe('Test Disctionary Methods', () => {
	// -------------------------------------ATBASH UNIT TEST-------------------------------------
	const method2 = 'Atbash';
	const encoded2 = '0r2q10 lxwm l0hl pt04m0';
	const generator2 = new Nigma.Dictionary.Atbash(message);
	test(`Should Encode message Using ${method2} module and return a perfect Match`, () => {
		expect(generator2.encode()).toBe(encoded2);
	});
	// -------------------------------------AUTOKEY UNIT TEST-------------------------------------
	const method3a = 'Autokey';
	const key3a = 'Tyranosaurus';
	const encoded3a = 'xltoqslhcjnwbgrzhell';
	const generator3a = new Nigma.Dictionary.Autokey(message, key3a);
	test(`Should Encode message Using ${method3a} module and return a perfect Match`, () => {
		expect(generator3a.encode()).toBe(encoded3a);
	});
	const method3b = 'Autokey';
	const key3b = 'Tyranosaurus';
	const encoded3b = 'xltoqslhcjnwbgrzhell';
	const decoded3b = 'encodethistextplease';
	const generator3b = new Nigma.Dictionary.Autokey(encoded3b, key3b);
	test(`Should Encode message Using ${method3b} module and return a perfect Match`, () => {
		expect(generator3b.decode()).toBe(decoded3b);
	});
	// -------------------------------------BACONIAN UNIT TEST-------------------------------------
	const method4 = 'Baconian';
	const encoded4 =
		'aabaa abbab aaaba abbba aaabb aabaa   baabb aabbb abaaa baaba   baabb aabaa babbb baabb   abbbb ababb aabaa aaaaa baaba aabaa';
	const generator4 = new Nigma.Dictionary.Baconian(message);
	test(`Should Encode message Using ${method4} module and return a perfect Match`, () => {
		expect(generator4.encode()).toBe(encoded4);
	});
	// -------------------------------------MORSE UNIT TEST-------------------------------------
	const generator5 = new Nigma.Dictionary.Morse(message);
	const encoded5 =
		'. -. -.-. --- -.. .   - .... .. ...   - . -..- -   .--. .-.. . .- ... .';
	const method5 = 'Morse';
	test(`Should Encode message Using ${method5} module and return a perfect Match`, () => {
		expect(generator5.encode()).toBe(encoded5);
	});
	// -------------------------------------SIMPLE SUBSTITUTION UNIT TEST-------------------------------------
	const method6 = 'Simple Substitution';
	const key6 = 'Tyranosaurus';
	const encoded6 = 'lejfkl aopg alya usldgl';

	const generator6 = new Nigma.Dictionary.SimpleSubstitution(message, key6);
	test(`Should Encode message Using ${method6} module and return a perfect Match`, () => {
		expect(generator6.encode()).toBe(encoded6);
	});
});
