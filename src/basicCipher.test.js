const nigma = require('./index');

const message = 'Encode this text please';

const alphabet = {
	'4': 'a',
	'3': 'b',
	'2': 'c',
	'1': 'd',
	'0': 'e',
	z: 'f',
	y: 'g',
	x: 'h',
	w: 'i',
	v: 'j',
	u: 'k',
	t: 'l',
	s: 'm',
	r: 'n',
	q: 'o',
	p: 'p',
	o: 'q',
	n: 'r',
	m: 's',
	l: 't',
	k: 'u',
	j: 'v',
	i: 'w',
	h: 'x',
	g: 'y',
	f: 'z',
	e: '0',
	d: '1',
	c: '2',
	b: '3',
	a: '4',
	'!': '5',
	'?': '6',
	',': '7',
	'.': '8',
	' ': '9',
	'9': ' ',
	'8': '.',
	'7': ',',
	'6': '?',
	'5': '!'
};

const basic = new nigma.BasicCipher(
	message,
	true,
	'none',
	'sampleKey',
	'no alphabet',
	false
);

const basic2 = new nigma.BasicCipher(
	'0r2q10 lxwm l0hl  pt04m0',
	true,
	'atbash',
	'no key',
	alphabet,
	false
);

const basic3 = new nigma.BasicCipher(
	message,
	false,
	'atbash',
	'no Key',
	alphabet,
	false
);
describe('Test BasicCipher GET Methods', () => {
	// Gets
	test(`GET Message, Should return the same as message`, () => {
		expect(basic.getMsg()).toBe(message);
	});
	test(`GET Encoded, Should return false`, () => {
		expect(basic.getEncoded()).toBe(true);
	});
	test(`GET Method, Should return none`, () => {
		expect(basic.getMethod()).toBe('none');
	});
	test(`GET Key, Should return sampleKey`, () => {
		expect(basic.getKey()).toBe('sampleKey');
	});
	test(`GET Alphabet, Should return alphabet`, () => {
		expect(basic.getAlphabet()).toBe('no alphabet');
	});
});
describe('Test BasicCipher SET Methods', () => {
	// Sets
	test(`SET Message, Should return the same as message`, () => {
		const newMsg = 'new message';
		expect(basic.setMsg(newMsg)).toBe(newMsg);
	});
	test(`SET Encoded, Should return false`, () => {
		expect(basic.setEncoded(false)).toBe(false);
	});
	test(`SET Method, Should return none`, () => {
		expect(basic.setMethod('amsco')).toBe('amsco');
	});
	test(`SET KKey, Should return sampleKey`, () => {
		expect(basic.setKey('newKey')).toBe('newKey');
	});
	test(`SET Alphabet, Should return empty`, () => {
		expect(basic.setAlphabet(alphabet)).toBe(alphabet);
	});
});
describe('Test BasicCipher Usefull Methods', () => {
	// Usefull methods
	test(`Test shiftCharacters, Should return BCD`, () => {
		expect(basic.shiftCharacters('abc', 1)).toBe('bcd');
	});
	test(`Test text2block, Should return A B C`, () => {
		expect(basic.text2block('AbcdeF', 1)).toBe('A b c d e F');
	});
});

describe('Test BasicCipher Alphabet Methods', () => {
	// Test Alphabet methods
	test(`Test DecodeAlphabet, Should return "encode this text  please"`, () => {
		expect(basic2.decodeAlphabet(basic2.getMsg(), '', ' ')).toBe(
			'encode this text  please'
		);
	});
	test(`Test EncodeAlphabet, Should return "0r2q10 lxwm l0hl  pt04m0`, () => {
		expect(basic3.encodeAlphabet(basic3.getMsg(), '', ' ')).toBe(
			'0r2q10 lxwm l0hl pt04m0'
		);
	});
});
