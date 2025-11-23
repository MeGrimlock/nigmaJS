export default class Rotors {
	constructor() {
		this.rotorSet1 = {
			// Commercial Enigma A B 1924
			1: ['DMTWSILRUYQNKFEJCAZBPGXOHV'],
			2: ['HQZGPJTMOBLNCIFDYAWVEUSRKX'],
			3: ['UQNTLSZFMREHDPXKIBVYGJCWOA']
		};
		this.rotorSet2 = {
			// German Railway (Rocket) 1941
			1: ['JGDQOXUSCAMIFRVTPNEWKBLZYH'],
			2: '[NTZPSFBOKMWRCJDIVLAEYUXHGQ]',
			3: ['JVIUBHTCDYAKEQZPOSGXNRMWFL'],
			4: ['QYHOGNECVPUZTFDJAXWMKISRBL'],
			5: ['QWERTZUIOASDFGHJKPYXCVBNML']
		};
		this.rotorSet3 = {
			/* Swiss K 
        In 1941 it became known to the Swiss that some of their Enigma traffic was being read by the French. It was decided to make some design modifications.
        One of the modifications consisted in modifying the wheel stepping on the Swiss Army machine. The slow, left-hand wheel was made stationary during operation while the second wheel stepped with every key stroke.
        The third wheel and the UKW would step in the normal fashion with Enigma stepping for the third wheel.
        The stationary but rotatable left-hand wheel was meant to make up for the missing stecker connections on the commercial machine.
        Swiss Army Enigma machines were the only machines modified. The surviving Swiss Air Force machines do not show any signs of modification. Machines used by the diplomatic service apparently were not altered either.
      */
			'I-K': ['PEZUOHXSCVFMTBGLRINQJWAYDK'],
			'II-K': ['ZOUESYDKFWPCIQXHMVBLGNJRAT'],
			'III-K': ['EHRVXGAOBQUSIMZFLYNWKTPDJC'],
			'UKV-K': ['IMETCGFRAYSQBZXWLHKDVUPOJN'],
			'ETW-K': ['QWERTZUIOASDFGHJKPYXCVBNML']
		};
		// Default
		this.rotorSet4 = {
			// I - III Enigma I , IV & V M3 Army , VI - VIII M3 & M4 Naval.
			1: ['EKMFLGDQVZNTOWYHXUSPAIBRCJ'],
			2: ['AJDKSIRUXBLHWTMCQGZNPYFVOE'],
			3: ['BDFHJLCPRTXVZNYEIWGAKMUSQO'],
			4: ['ESOVPZJAYQUIRHXLNFTGKDCMWB'],
			5: ['VZBRGITYUPSDNHLXAWMJQOFECK'],
			6: ['JPGVOUMFYQBENHZRDKASXLICTW'],
			7: ['NZJHGRCXMYSWBOUFAIVLPEKQDT'],
			8: ['FKQHTLXOCBJSPDZRAMEWNIUYGV']
		};
		this.rotorSet5 = {
			BETA: ['LEYJVCNIXWPBQMDRTAKZGFUHOS'],
			GAMMA: ['FSOKANUERHMBTIYCWLQPZXVGJD'],
			'Reflector A': ['EJMZALYXVBWFCRQUONTSPIKHGD'],
			'Reflector B': ['YRUHQSLDPXNGOKMIEBFZCWVJAT'],
			'Reflector C': ['FVPJIAOYEDRZXWGCTKUQSBNMHL'],
			'Reflector B Thin': ['ENKQAUYWJICOPBLMDXZVFTHRGS'],
			'Reflector C Thin': ['RDOBJNTKVEHMLFCWZAXGYIPSUQ'],
			ETW: ['ABCDEFGHIJKLMNOPQRSTUVWXYZ']
		};
	}

	inverse = rotor => {
		/* This method takes the rotor and gives the inverse back.
     Example: (RotorSet 4 rotor 3) turns A -> B and if we want to go back from B -> A we need the inverse rotor */
		const invertedRotor = [];
		return invertedRotor;
	};
}
