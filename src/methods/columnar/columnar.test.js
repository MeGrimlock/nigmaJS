// test script for parent and child documents.
const Nigma = require('../../index');

const message = 'Encode this text please';

// -------------------------------------AMSCO UNIT TEST-------------------------------------
const method1 = 'AMSCO';
const key = '321';
const encoded1 = 'OHELENCETSTTPASEDIXE';
const generator1 = new Nigma.Columnar.Amsco(message, key);
describe('Test Columnar Methods', () => {
	test(`Should Encode message Using ${method1} module and return a perfect Match`, () => {
		expect(generator1.encode()).toBe(encoded1);
	});
});
