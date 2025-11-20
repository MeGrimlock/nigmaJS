// test script for shift ciphers
const Nigma = require('../../index');

describe('Caesar Shift Tests', () => {
	const message = 'Encode this text please';

	test('Should encode with shift 1', () => {
		const caesar = new Nigma.Shift.CaesarShift(message, 1);
		expect(caesar.encode()).toBe('Fodpef uijt ufyu qmfbtf');
	});

	test('Should encode with shift 3', () => {
		const caesar = new Nigma.Shift.CaesarShift(message, 3);
		expect(caesar.encode()).toBe('Hqfrgh wklv whaw sohdvh');
	});

	test('Should encode with shift 13 (ROT13)', () => {
		const caesar = new Nigma.Shift.CaesarShift(message, 13);
		expect(caesar.encode()).toBe('Rapbqr guvf grkg cyrnfr');
	});

	test('Should encode with negative shift', () => {
		const caesar = new Nigma.Shift.CaesarShift(message, -3);
		const encoded = caesar.encode();
		expect(encoded).toBeTruthy();
		expect(encoded).not.toBe(message);
	});

	test('Should be reciprocal (encode then decode)', () => {
		const key = 7;
		const caesar1 = new Nigma.Shift.CaesarShift(message, key);
		const encoded = caesar1.encode();

		const caesar2 = new Nigma.Shift.CaesarShift(encoded, key);
		const decoded = caesar2.decode();

		expect(decoded).toBe(message);
	});

	test('Should handle uppercase and lowercase', () => {
		const mixedCase = 'HeLLo WoRLd';
		const caesar = new Nigma.Shift.CaesarShift(mixedCase, 5);
		const encoded = caesar.encode();
		expect(encoded).toBeTruthy();
		expect(encoded).not.toBe(mixedCase);
	});

	test('Should preserve spaces and punctuation', () => {
		const withPunctuation = 'Hello, World!';
		const caesar = new Nigma.Shift.CaesarShift(withPunctuation, 3);
		const encoded = caesar.encode();
		expect(encoded).toContain(',');
		expect(encoded).toContain('!');
	});

	test('Should handle shift of 0 (no change)', () => {
		const caesar = new Nigma.Shift.CaesarShift(message, 0);
		expect(caesar.encode()).toBe(message);
	});

	test('Should handle shift of 26 (full rotation)', () => {
		const caesar = new Nigma.Shift.CaesarShift(message, 26);
		expect(caesar.encode()).toBe(message);
	});

	test('Should handle large shifts (wrapping)', () => {
		const caesar1 = new Nigma.Shift.CaesarShift(message, 3);
		const caesar2 = new Nigma.Shift.CaesarShift(message, 29); // 3 + 26
		expect(caesar1.encode()).toBe(caesar2.encode());
	});
});

describe('ROT5 Tests', () => {
	const message = 'Encode this text please';

	test('Should encode with ROT5', () => {
		const rot5 = new Nigma.Shift.Rot5(message);
		expect(rot5.encode()).toBe('Jshtij ymnx yjcy uqjfxj');
	});

	test('Should be reciprocal (ROT5 twice returns original)', () => {
		const rot5First = new Nigma.Shift.Rot5(message);
		const encoded = rot5First.encode();

		const rot5Second = new Nigma.Shift.Rot5(encoded);
		const decoded = rot5Second.decode();

		expect(decoded).toBe(message);
	});

	test('Should handle single character', () => {
		const rot5 = new Nigma.Shift.Rot5('A');
		const encoded = rot5.encode();
		expect(encoded).toBe('F');
	});

	test('Should handle numbers and special characters', () => {
		const withNumbers = 'Test123';
		const rot5 = new Nigma.Shift.Rot5(withNumbers);
		const encoded = rot5.encode();
		expect(encoded).toBeTruthy();
	});
});
