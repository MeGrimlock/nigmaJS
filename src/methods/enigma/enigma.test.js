const nigma = require('../../index');

describe('Test Enigma Methods', () => {
	// Test básico con configuración por defecto
	test('Should encode with default settings', () => {
		const message = 'Encode this text please';
		const encoded = 'FOKXHYXLOPZMLMHZOMEF';
		const generator = new nigma.Enigma(message);
		expect(generator.encode(message)).toBe(encoded);
	});

	// Test de reciprocidad: encode -> decode debe devolver el mensaje original
	test('Should be reciprocal (encode then decode returns original)', () => {
		const message = 'HELLO WORLD';
		const enigma1 = new nigma.Enigma(message, 'AAA', 'AAA', 'PO ML IU KJ NH YT GB VF RE DC', '123');
		const encoded = enigma1.encode();

		const enigma2 = new nigma.Enigma(encoded, 'AAA', 'AAA', 'PO ML IU KJ NH YT GB VF RE DC', '123');
		const decoded = enigma2.encode(); // Enigma es simétrico

		expect(decoded).toBe(message.replace(/\s/g, ''));
	});

	// Tests con diferentes configuraciones de rotores
	describe('Different Rotor Configurations', () => {
		const message = 'TESTMESSAGE';

		test('Should encode with rotors 1-2-3', () => {
			const enigma = new nigma.Enigma(message, 'AAA', 'AAA', '', '123');
			const encoded = enigma.encode();
			expect(encoded).toBeTruthy();
			expect(encoded).not.toBe(message);
			expect(encoded.length).toBe(message.length);
		});

		test('Should encode with rotors 3-2-1', () => {
			const enigma = new nigma.Enigma(message, 'AAA', 'AAA', '', '321');
			const encoded = enigma.encode();
			expect(encoded).toBeTruthy();
			expect(encoded).not.toBe(message);
		});

		test('Should encode with rotors 4-5-6', () => {
			const enigma = new nigma.Enigma(message, 'AAA', 'AAA', '', '456');
			const encoded = enigma.encode();
			expect(encoded).toBeTruthy();
			expect(encoded).not.toBe(message);
		});

		test('Should produce different outputs with different rotor orders', () => {
			const enigma123 = new nigma.Enigma(message, 'AAA', 'AAA', '', '123');
			const enigma321 = new nigma.Enigma(message, 'AAA', 'AAA', '', '321');

			const encoded123 = enigma123.encode();
			const encoded321 = enigma321.encode();

			expect(encoded123).not.toBe(encoded321);
		});
	});

	// Tests con diferentes posiciones iniciales de rotores (key settings)
	describe('Different Key Settings', () => {
		const message = 'SECRETMESSAGE';

		test('Should encode with key AAA', () => {
			const enigma = new nigma.Enigma(message, 'AAA', 'AAA', '', '123');
			const encoded = enigma.encode();
			expect(encoded).toBeTruthy();
		});

		test('Should encode with key ABC', () => {
			const enigma = new nigma.Enigma(message, 'ABC', 'AAA', '', '123');
			const encoded = enigma.encode();
			expect(encoded).toBeTruthy();
		});

		test('Should encode with key XYZ', () => {
			const enigma = new nigma.Enigma(message, 'XYZ', 'AAA', '', '123');
			const encoded = enigma.encode();
			expect(encoded).toBeTruthy();
		});

		test('Should produce different outputs with different key settings', () => {
			const enigmaAAA = new nigma.Enigma(message, 'AAA', 'AAA', '', '123');
			const enigmaABC = new nigma.Enigma(message, 'ABC', 'AAA', '', '123');
			const enigmaXYZ = new nigma.Enigma(message, 'XYZ', 'AAA', '', '123');

			const encodedAAA = enigmaAAA.encode();
			const encodedABC = enigmaABC.encode();
			const encodedXYZ = enigmaXYZ.encode();

			expect(encodedAAA).not.toBe(encodedABC);
			expect(encodedABC).not.toBe(encodedXYZ);
			expect(encodedAAA).not.toBe(encodedXYZ);
		});
	});

	// Tests con diferentes ring settings
	describe('Different Ring Settings', () => {
		const message = 'ENIGMATEST';

		test('Should encode with ring AAA', () => {
			const enigma = new nigma.Enigma(message, 'AAA', 'AAA', '', '123');
			const encoded = enigma.encode();
			expect(encoded).toBeTruthy();
		});

		test('Should encode with ring BBB', () => {
			const enigma = new nigma.Enigma(message, 'AAA', 'BBB', '', '123');
			const encoded = enigma.encode();
			expect(encoded).toBeTruthy();
		});

		test('Should produce different outputs with different ring settings', () => {
			const enigmaAAA = new nigma.Enigma(message, 'AAA', 'AAA', '', '123');
			const enigmaBBB = new nigma.Enigma(message, 'AAA', 'BBB', '', '123');

			const encodedAAA = enigmaAAA.encode();
			const encodedBBB = enigmaBBB.encode();

			expect(encodedAAA).not.toBe(encodedBBB);
		});
	});

	// Tests con diferentes configuraciones de plugboard
	describe('Different Plugboard Settings', () => {
		const message = 'PLUGBOARDTEST';

		test('Should encode with no plugboard', () => {
			const enigma = new nigma.Enigma(message, 'AAA', 'AAA', '', '123');
			const encoded = enigma.encode();
			expect(encoded).toBeTruthy();
		});

		test('Should encode with default plugboard', () => {
			const enigma = new nigma.Enigma(message, 'AAA', 'AAA', 'PO ML IU KJ NH YT GB VF RE DC', '123');
			const encoded = enigma.encode();
			expect(encoded).toBeTruthy();
		});

		test('Should encode with custom plugboard', () => {
			const enigma = new nigma.Enigma(message, 'AAA', 'AAA', 'AB CD EF GH IJ KL MN OP QR ST', '123');
			const encoded = enigma.encode();
			expect(encoded).toBeTruthy();
		});

		test('Should produce different outputs with different plugboards', () => {
			const enigmaNoPlug = new nigma.Enigma(message, 'AAA', 'AAA', '', '123');
			const enigmaPlug1 = new nigma.Enigma(message, 'AAA', 'AAA', 'PO ML IU KJ NH YT GB VF RE DC', '123');
			const enigmaPlug2 = new nigma.Enigma(message, 'AAA', 'AAA', 'AB CD EF GH IJ KL MN OP QR ST', '123');

			const encodedNoPlug = enigmaNoPlug.encode();
			const encodedPlug1 = enigmaPlug1.encode();
			const encodedPlug2 = enigmaPlug2.encode();

			expect(encodedNoPlug).not.toBe(encodedPlug1);
			expect(encodedPlug1).not.toBe(encodedPlug2);
		});
	});

	// Tests de configuraciones complejas combinadas
	describe('Complex Combined Configurations', () => {
		test('Should handle complex configuration 1', () => {
			const message = 'COMPLEXTEST';
			const enigma = new nigma.Enigma(message, 'QWE', 'RTY', 'AZ BY CX DW EV FU GT HS IR JQ', '531');
			const encoded = enigma.encode();

			expect(encoded).toBeTruthy();
			expect(encoded).not.toBe(message);
			expect(encoded.length).toBe(message.length);
		});

		test('Should handle complex configuration 2', () => {
			const message = 'ANOTHERTEST';
			const enigma = new nigma.Enigma(message, 'MNO', 'PQR', 'KP LO MN IJ UH YT GB VF RE DC', '246');
			const encoded = enigma.encode();

			expect(encoded).toBeTruthy();
			expect(encoded).not.toBe(message);
		});

		test('Complex configuration should be reciprocal', () => {
			const message = 'RECIPROCAL';
			const key = 'XYZ';
			const ring = 'ABC';
			const plugboard = 'AZ BY CX DW EV FU GT HS IR JQ';
			const rotors = '531';

			const enigma1 = new nigma.Enigma(message, key, ring, plugboard, rotors);
			const encoded = enigma1.encode();

			const enigma2 = new nigma.Enigma(encoded, key, ring, plugboard, rotors);
			const decoded = enigma2.encode();

			expect(decoded).toBe(message);
		});
	});

	// Tests de casos especiales
	describe('Special Cases', () => {
		test('Should handle single character', () => {
			const enigma = new nigma.Enigma('A', 'AAA', 'AAA', '', '123');
			const encoded = enigma.encode();
			expect(encoded).toBeTruthy();
			expect(encoded.length).toBe(1);
		});

		test('Should handle long message', () => {
			const message = 'THISISAVERYLONGMESSAGETOTESTTHEENIGMAMACHINEWITHDIFFERENTCONFIGURATIONS';
			const enigma = new nigma.Enigma(message, 'AAA', 'AAA', 'PO ML IU KJ NH YT GB VF RE DC', '123');
			const encoded = enigma.encode();
			expect(encoded).toBeTruthy();
			expect(encoded.length).toBe(message.length);
		});

		test('Should handle repeated characters differently', () => {
			const message = 'AAAAAAAAAA';
			const enigma = new nigma.Enigma(message, 'AAA', 'AAA', '', '123');
			const encoded = enigma.encode();

			// Enigma nunca codifica una letra como sí misma
			expect(encoded).not.toContain('A');
			// Y debido a la rotación, caracteres repetidos producen salidas diferentes
			const chars = encoded.split('');
			const uniqueChars = [...new Set(chars)];
			expect(uniqueChars.length).toBeGreaterThan(1);
		});
	});
});
