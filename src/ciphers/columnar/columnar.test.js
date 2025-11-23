// test script for columnar ciphers
const Nigma = require('../../index');

describe('Columnar Cipher Tests', () => {
	describe('AMSCO', () => {
		const message = 'The quick brown fox';
		const key = '132';

		test('Should encode correctly', () => {
			const amsco = new Nigma.Columnar.Amsco(message, key);
			const encoded = amsco.encode();
			expect(encoded).toBeTruthy();
			expect(encoded).not.toBe(message);
		});

		test('Should be reciprocal', () => {
			const amsco1 = new Nigma.Columnar.Amsco(message, key);
			const encoded = amsco1.encode();

			const amsco2 = new Nigma.Columnar.Amsco(encoded, key);
			const decoded = amsco2.decode();

			// AMSCO implementation strips spaces and uppercases the message
			expect(decoded).toBe(message.replace(/\s+/g, '').toUpperCase());
		});

		test('Should throw error for invalid key (non-sequential)', () => {
			const invalidKey = '124'; // Missing 3
			const amsco = new Nigma.Columnar.Amsco(message, invalidKey);
			expect(() => amsco.encode()).toThrow('Invalid key format');
		});

		test('Should throw error for invalid key (non-numeric)', () => {
			const invalidKey = '12a';
			const amsco = new Nigma.Columnar.Amsco(message, invalidKey);
			expect(() => amsco.encode()).toThrow('Invalid key format');
		});

		test('Should handle longer messages', () => {
			const longMessage = 'This is a longer message to test the matrix generation and transposition logic of AMSCO cipher';
			const amsco = new Nigma.Columnar.Amsco(longMessage, '41325');
			const encoded = amsco.encode();

			const amsco2 = new Nigma.Columnar.Amsco(encoded, '41325');
			const decoded = amsco2.decode();

			expect(decoded).toBe(longMessage.replace(/\s+/g, '').toUpperCase());
		});
	});
});
