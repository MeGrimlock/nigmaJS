// Wait for DOM and Library
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('mainInput');

  // Elements
  const caesarOut = document.getElementById('caesarOutput');
  const caesarDecoded = document.getElementById('caesarDecoded');
  const caesarShift = document.getElementById('caesarShift');

  const atbashOut = document.getElementById('atbashOutput');
  const atbashDecoded = document.getElementById('atbashDecoded');

  const morseOut = document.getElementById('morseOutput');
  const morseDecoded = document.getElementById('morseDecoded');

  const rot13Out = document.getElementById('rot13Output');
  const rot13Decoded = document.getElementById('rot13Decoded');

  const amscoOut = document.getElementById('amscoOutput');
  const amscoDecoded = document.getElementById('amscoDecoded');
  const amscoKey = document.getElementById('amscoKey');

  const enigmaOut = document.getElementById('enigmaOutput');
  const enigmaDecoded = document.getElementById('enigmaDecoded');

  const enigmaRotors = document.getElementById('enigmaRotors');
  const enigmaRing = document.getElementById('enigmaRing');
  const enigmaKey = document.getElementById('enigmaKey');
  const enigmaPlugs = document.getElementById('enigmaPlugs');

  function update() {
    const text = input.value;
    if (!window.nigmajs) {
      console.error('NigmaJS library not loaded!');
      return;
    }

    const { Shift, Dictionary, Columnar, Enigma } = window.nigmajs;

    // Caesar
    try {
      const shift = parseInt(caesarShift.value) || 0;
      const c = new Shift.CaesarShift(text, shift);
      const encoded = c.encode();
      caesarOut.textContent = encoded;

      const c2 = new Shift.CaesarShift(encoded, shift);
      caesarDecoded.textContent = c2.decode();
    } catch (e) {
      caesarOut.textContent = 'Error: ' + e.message;
      caesarDecoded.textContent = '-';
    }

    // Atbash
    try {
      const a = new Dictionary.Atbash(text);
      const encoded = a.encode();
      atbashOut.textContent = encoded;

      const a2 = new Dictionary.Atbash(encoded);
      atbashDecoded.textContent = a2.decode();
    } catch (e) {
      atbashOut.textContent = 'Error: ' + e.message;
      atbashDecoded.textContent = '-';
    }

    // Morse
    try {
      const m = new Dictionary.Morse(text);
      const encoded = m.encode();
      morseOut.textContent = encoded;

      const m2 = new Dictionary.Morse(encoded);
      morseDecoded.textContent = m2.decode();
    } catch (e) {
      morseOut.textContent = 'Error: ' + e.message;
      morseDecoded.textContent = '-';
    }

    // ROT13
    try {
      const Rot13Class = Shift.Rot13 || Shift.CaesarShift;
      const r = new Rot13Class(text, 13);
      const encoded = r.encode();
      rot13Out.textContent = encoded;

      const r2 = new Rot13Class(encoded, 13);
      rot13Decoded.textContent = r2.decode();
    } catch (e) {
      rot13Out.textContent = 'Error: ' + e.message;
      rot13Decoded.textContent = '-';
    }

    // AMSCO
    try {
      const k = amscoKey.value || '123';
      const am = new Columnar.Amsco(text, k);
      const encoded = am.encode();
      amscoOut.textContent = encoded;

      const am2 = new Columnar.Amsco(encoded, k);
      amscoDecoded.textContent = am2.decode();
    } catch (e) {
      amscoOut.textContent = 'Error: ' + e.message;
      amscoDecoded.textContent = '-';
    }

    // Enigma
    try {
      const rotors = enigmaRotors.value || '123';
      const ring = enigmaRing.value || 'AAA';
      const key = enigmaKey.value || 'AAA';
      const plugs = enigmaPlugs.value || 'PO ML IU KJ NH YT GB VF RE DC';

      const e = new Enigma(text, key, ring, plugs, rotors);
      const encoded = e.encode();
      enigmaOut.textContent = encoded;

      const e2 = new Enigma(encoded, key, ring, plugs, rotors);
      enigmaDecoded.textContent = e2.encode();
    } catch (e) {
      enigmaOut.textContent = 'Error: ' + e.message;
      enigmaDecoded.textContent = '-';
    }
  }

  // Listeners
  input.addEventListener('input', update);
  caesarShift.addEventListener('input', update);
  amscoKey.addEventListener('input', update);
  enigmaRotors.addEventListener('input', update);
  enigmaRing.addEventListener('input', update);
  enigmaKey.addEventListener('input', update);
  enigmaPlugs.addEventListener('input', update);

  // Initial call
  update();
});
