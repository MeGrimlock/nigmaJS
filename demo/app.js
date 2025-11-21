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

  const rot5Out = document.getElementById('rot5Output');
  const rot5Decoded = document.getElementById('rot5Decoded');

  const rot18Out = document.getElementById('rot18Output');
  const rot18Decoded = document.getElementById('rot18Decoded');

  const rot47Out = document.getElementById('rot47Output');
  const rot47Decoded = document.getElementById('rot47Decoded');

  const amscoOut = document.getElementById('amscoOutput');
  const amscoDecoded = document.getElementById('amscoDecoded');
  const amscoKey = document.getElementById('amscoKey');

  const autokeyOut = document.getElementById('autokeyOutput');
  const autokeyDecoded = document.getElementById('autokeyDecoded');
  const autokeyKey = document.getElementById('autokeyKey');

  const baconianOut = document.getElementById('baconianOutput');
  const baconianDecoded = document.getElementById('baconianDecoded');

  const simpleSubOut = document.getElementById('simpleSubOutput');
  const simpleSubDecoded = document.getElementById('simpleSubDecoded');
  const simpleSubKey = document.getElementById('simpleSubKey');

  const enigmaOut = document.getElementById('enigmaOutput');
  const enigmaDecoded = document.getElementById('enigmaDecoded');

  const enigmaRotors = document.getElementById('enigmaRotors');
  const enigmaRing = document.getElementById('enigmaRing');
  const enigmaKey = document.getElementById('enigmaKey');
  const enigmaPlugs = document.getElementById('enigmaPlugs');

  const vigenereOut = document.getElementById('vigenereOutput');
  const vigenereDecoded = document.getElementById('vigenereDecoded');
  const vigenereKey = document.getElementById('vigenereKey');

  const polybiusOut = document.getElementById('polybiusOutput');
  const polybiusDecoded = document.getElementById('polybiusDecoded');
  const polybiusKey = document.getElementById('polybiusKey');

  const quagmire1Out = document.getElementById('quagmire1Output');
  const quagmire1Decoded = document.getElementById('quagmire1Decoded');
  const quagmire1Key = document.getElementById('quagmire1Key');

  const quagmire2Out = document.getElementById('quagmire2Output');
  const quagmire2Decoded = document.getElementById('quagmire2Decoded');
  const quagmire2Key = document.getElementById('quagmire2Key');
  const quagmire2Indicator = document.getElementById('quagmire2Indicator');

  const quagmire3Out = document.getElementById('quagmire3Output');
  const quagmire3Decoded = document.getElementById('quagmire3Decoded');
  const quagmire3Key = document.getElementById('quagmire3Key');
  const quagmire3Indicator = document.getElementById('quagmire3Indicator');

  const quagmire4Out = document.getElementById('quagmire4Output');
  const quagmire4Decoded = document.getElementById('quagmire4Decoded');
  const quagmire4Key = document.getElementById('quagmire4Key');
  const quagmire4Indicator = document.getElementById('quagmire4Indicator');

  function update() {
    const text = input.value;
    if (!window.nigmajs) {
      return;
    }

    const { Shift, Dictionary, Columnar, Enigma, Polyalphabetic } = window.nigmajs;

    // Caesar
    try {
      const shift = parseInt(caesarShift.value, 10) || 0;
      const c = new Shift.CaesarShift(text, shift);
      const encoded = c.encode();
      caesarOut.textContent = encoded;

      const c2 = new Shift.CaesarShift(encoded, shift);
      caesarDecoded.textContent = c2.decode();
    } catch (e) {
      caesarOut.textContent = `Error: ${e.message}`;
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
      atbashOut.textContent = `Error: ${e.message}`;
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
      morseOut.textContent = `Error: ${e.message}`;
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
      rot13Out.textContent = `Error: ${e.message}`;
      rot13Decoded.textContent = '-';
    }

    // ROT5
    try {
      const r5 = new Shift.Rot5(text);
      const encoded = r5.encode();
      rot5Out.textContent = encoded;

      const r5_2 = new Shift.Rot5(encoded);
      rot5Decoded.textContent = r5_2.decode();
    } catch (e) {
      rot5Out.textContent = `Error: ${e.message}`;
      rot5Decoded.textContent = '-';
    }

    // ROT18
    try {
      const r18 = new Shift.Rot18(text);
      const encoded = r18.encode();
      rot18Out.textContent = encoded;

      const r18_2 = new Shift.Rot18(encoded);
      rot18Decoded.textContent = r18_2.decode();
    } catch (e) {
      rot18Out.textContent = `Error: ${e.message}`;
      rot18Decoded.textContent = '-';
    }

    // ROT47
    try {
      const r47 = new Shift.Rot47(text);
      const encoded = r47.encode();
      rot47Out.textContent = encoded;

      const r47_2 = new Shift.Rot47(encoded);
      rot47Decoded.textContent = r47_2.decode();
    } catch (e) {
      rot47Out.textContent = `Error: ${e.message}`;
      rot47Decoded.textContent = '-';
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
      amscoOut.textContent = `Error: ${e.message}`;
      amscoDecoded.textContent = '-';
    }

    // Autokey
    try {
      const key = autokeyKey.value || 'SECRET';
      const ak = new Dictionary.Autokey(text, key);
      const encoded = ak.encode();
      autokeyOut.textContent = encoded;

      const ak2 = new Dictionary.Autokey(encoded, key);
      autokeyDecoded.textContent = ak2.decode();
    } catch (e) {
      autokeyOut.textContent = `Error: ${e.message}`;
      autokeyDecoded.textContent = '-';
    }

    // Baconian
    try {
      const b = new Dictionary.Baconian(text);
      const encoded = b.encode();
      baconianOut.textContent = encoded;

      const b2 = new Dictionary.Baconian(encoded);
      baconianDecoded.textContent = b2.decode();
    } catch (e) {
      baconianOut.textContent = `Error: ${e.message}`;
      baconianDecoded.textContent = '-';
    }

    // Simple Substitution
    try {
      const key = simpleSubKey.value || 'ZYXWVUTSRQPONMLKJIHGFEDCBA';
      const ss = new Dictionary.SimpleSubstitution(text, key);
      const encoded = ss.encode();
      simpleSubOut.textContent = encoded;

      const ss2 = new Dictionary.SimpleSubstitution(encoded, key);
      simpleSubDecoded.textContent = ss2.decode();
    } catch (e) {
      simpleSubOut.textContent = `Error: ${e.message}`;
      simpleSubDecoded.textContent = '-';
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
      enigmaOut.textContent = `Error: ${e.message}`;
      enigmaDecoded.textContent = '-';
    }

    // Vigenère
    try {
      const keyword = vigenereKey.value || 'KEY';
      const v = new Polyalphabetic.Vigenere(text, keyword);
      const encoded = v.encode();
      vigenereOut.textContent = encoded;

      const v2 = new Polyalphabetic.Vigenere(encoded, keyword, true);
      vigenereDecoded.textContent = v2.decode();
    } catch (e) {
      vigenereOut.textContent = `Error: ${e.message}`;
      vigenereDecoded.textContent = '-';
    }

    // Polybius
    try {
      const keyword = polybiusKey.value || '';
      const p = new Dictionary.Polybius(text, keyword);
      const encoded = p.encode();
      polybiusOut.textContent = encoded;

      const p2 = new Dictionary.Polybius(encoded, keyword, true);
      polybiusDecoded.textContent = p2.decode();
    } catch (e) {
      polybiusOut.textContent = `Error: ${e.message}`;
      polybiusDecoded.textContent = '-';
    }

    // Quagmire I
    try {
      const keyword = quagmire1Key.value || 'KEY';
      const q1 = new Polyalphabetic.Quagmire1(text, keyword);
      const encoded = q1.encode();
      quagmire1Out.textContent = encoded;

      const q1_2 = new Polyalphabetic.Quagmire1(encoded, keyword, '', true);
      quagmire1Decoded.textContent = q1_2.decode();
    } catch (e) {
      quagmire1Out.textContent = `Error: ${e.message}`;
      quagmire1Decoded.textContent = '-';
    }

    // Quagmire II
    try {
      const keyword = quagmire2Key.value || 'KEY';
      const indicator = quagmire2Indicator.value || 'A';
      const q2 = new Polyalphabetic.Quagmire2(text, keyword, indicator);
      const encoded = q2.encode();
      quagmire2Out.textContent = encoded;

      const q2_2 = new Polyalphabetic.Quagmire2(encoded, keyword, indicator, true);
      quagmire2Decoded.textContent = q2_2.decode();
    } catch (e) {
      quagmire2Out.textContent = `Error: ${e.message}`;
      quagmire2Decoded.textContent = '-';
    }

    // Quagmire III
    try {
      const keyword = quagmire3Key.value || 'KEY';
      const indicator = quagmire3Indicator.value || 'A';
      const q3 = new Polyalphabetic.Quagmire3(text, keyword, indicator);
      const encoded = q3.encode();
      quagmire3Out.textContent = encoded;

      const q3_2 = new Polyalphabetic.Quagmire3(encoded, keyword, indicator, true);
      quagmire3Decoded.textContent = q3_2.decode();
    } catch (e) {
      quagmire3Out.textContent = `Error: ${e.message}`;
      quagmire3Decoded.textContent = '-';
    }

    // Quagmire IV
    try {
      const keyword = quagmire4Key.value || 'KEY';
      const indicator = quagmire4Indicator.value || 'ABC';
      const q4 = new Polyalphabetic.Quagmire4(text, keyword, indicator);
      const encoded = q4.encode();
      quagmire4Out.textContent = encoded;

      const q4_2 = new Polyalphabetic.Quagmire4(encoded, keyword, indicator, '', true);
      quagmire4Decoded.textContent = q4_2.decode();
    } catch (e) {
      quagmire4Out.textContent = `Error: ${e.message}`;
      quagmire4Decoded.textContent = '-';
    }
  }

  // Listeners
  input.addEventListener('input', update);
  caesarShift.addEventListener('input', update);
  amscoKey.addEventListener('input', update);
  autokeyKey.addEventListener('input', update);
  simpleSubKey.addEventListener('input', update);
  enigmaRotors.addEventListener('input', update);
  enigmaRing.addEventListener('input', update);
  enigmaKey.addEventListener('input', update);
  enigmaPlugs.addEventListener('input', update);
  vigenereKey.addEventListener('input', update);
  polybiusKey.addEventListener('input', update);
  quagmire1Key.addEventListener('input', update);
  quagmire2Key.addEventListener('input', update);
  quagmire2Indicator.addEventListener('input', update);
  quagmire3Key.addEventListener('input', update);
  quagmire3Indicator.addEventListener('input', update);
  quagmire4Key.addEventListener('input', update);
  quagmire4Indicator.addEventListener('input', update);

  // Initial call
  update();
});
