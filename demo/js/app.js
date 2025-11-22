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

  const beaufortOut = document.getElementById('beaufortOutput');
  const beaufortDecoded = document.getElementById('beaufortDecoded');
  const beaufortKey = document.getElementById('beaufortKey');

  const portaOut = document.getElementById('portaOutput');
  const portaDecoded = document.getElementById('portaDecoded');
  const portaKey = document.getElementById('portaKey');

  const gronsfeldOut = document.getElementById('gronsfeldOutput');
  const gronsfeldDecoded = document.getElementById('gronsfeldDecoded');
  const gronsfeldKey = document.getElementById('gronsfeldKey');

  const bifidOut = document.getElementById('bifidOutput');
  const bifidDecoded = document.getElementById('bifidDecoded');
  const bifidKey = document.getElementById('bifidKey');

  const railFenceOut = document.getElementById('railFenceOutput');
  const railFenceDecoded = document.getElementById('railFenceDecoded');
  const railFenceRails = document.getElementById('railFenceRails');

  const playfairOut = document.getElementById('playfairOutput');
  const playfairDecoded = document.getElementById('playfairDecoded');
  const playfairKey = document.getElementById('playfairKey');

  const fourSquareOut = document.getElementById('fourSquareOutput');
  const fourSquareDecoded = document.getElementById('fourSquareDecoded');
  const fourSquareKey1 = document.getElementById('fourSquareKey1');
  const fourSquareKey2 = document.getElementById('fourSquareKey2');

  const twoSquareOut = document.getElementById('twoSquareOutput');
  const twoSquareDecoded = document.getElementById('twoSquareDecoded');
  const twoSquareKey = document.getElementById('twoSquareKey');

  const adfgvxOut = document.getElementById('adfgvxOutput');
  const adfgvxDecoded = document.getElementById('adfgvxDecoded');
  const adfgvxKey = document.getElementById('adfgvxKey');
  const adfgvxTransKey = document.getElementById('adfgvxTransKey');

  const adfgxOut = document.getElementById('adfgxOutput');
  const adfgxDecoded = document.getElementById('adfgxDecoded');
  const adfgxKey = document.getElementById('adfgxKey');
  const adfgxTransKey = document.getElementById('adfgxTransKey');

  const routeOut = document.getElementById('routeOutput');
  const routeDecoded = document.getElementById('routeDecoded');
  const routeRows = document.getElementById('routeRows');
  const routeCols = document.getElementById('routeCols');
  const routePattern = document.getElementById('routePattern');

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

    // Beaufort
    try {
      const keyword = beaufortKey.value || 'KEY';
      const b = new Polyalphabetic.Beaufort(text, keyword);
      const encoded = b.encode();
      beaufortOut.textContent = encoded;

      const b2 = new Polyalphabetic.Beaufort(encoded, keyword, true);
      beaufortDecoded.textContent = b2.decode();
    } catch (e) {
      beaufortOut.textContent = `Error: ${e.message}`;
      beaufortDecoded.textContent = '-';
    }

    // Porta
    try {
      const keyword = portaKey.value || 'KEY';
      const p = new Polyalphabetic.Porta(text, keyword);
      const encoded = p.encode();
      portaOut.textContent = encoded;

      const p2 = new Polyalphabetic.Porta(encoded, keyword, true);
      portaDecoded.textContent = p2.decode();
    } catch (e) {
      portaOut.textContent = `Error: ${e.message}`;
      portaDecoded.textContent = '-';
    }

    // Gronsfeld
    try {
      const keyword = gronsfeldKey.value || '12345';
      const g = new Polyalphabetic.Gronsfeld(text, keyword);
      const encoded = g.encode();
      gronsfeldOut.textContent = encoded;

      const g2 = new Polyalphabetic.Gronsfeld(encoded, keyword, true);
      gronsfeldDecoded.textContent = g2.decode();
    } catch (e) {
      gronsfeldOut.textContent = `Error: ${e.message}`;
      gronsfeldDecoded.textContent = '-';
    }

    // Bifid
    try {
      const keyword = bifidKey.value || '';
      const b = new Dictionary.Bifid(text, keyword);
      const encoded = b.encode();
      bifidOut.textContent = encoded;

      const b2 = new Dictionary.Bifid(encoded, keyword, true);
      bifidDecoded.textContent = b2.decode();
    } catch (e) {
      bifidOut.textContent = `Error: ${e.message}`;
      bifidDecoded.textContent = '-';
    }

    // Rail Fence
    try {
      const rails = parseInt(railFenceRails.value, 10) || 3;
      const rf = new Columnar.RailFence(text, rails);
      const encoded = rf.encode();
      railFenceOut.textContent = encoded;

      const rf2 = new Columnar.RailFence(encoded, rails, true);
      railFenceDecoded.textContent = rf2.decode();
    } catch (e) {
      railFenceOut.textContent = `Error: ${e.message}`;
      railFenceDecoded.textContent = '-';
    }

    // Playfair
    try {
      const keyword = playfairKey.value || 'KEYWORD';
      const pf = new Dictionary.Playfair(text, keyword);
      const encoded = pf.encode();
      playfairOut.textContent = encoded;

      const pf2 = new Dictionary.Playfair(encoded, keyword, true);
      playfairDecoded.textContent = pf2.decode();
    } catch (e) {
      playfairOut.textContent = `Error: ${e.message}`;
      playfairDecoded.textContent = '-';
    }

    // Four-Square
    try {
      const keyword1 = fourSquareKey1.value || 'EXAMPLE';
      const keyword2 = fourSquareKey2.value || 'KEYWORD';
      const fs = new Dictionary.FourSquare(text, keyword1, keyword2);
      const encoded = fs.encode();
      fourSquareOut.textContent = encoded;

      const fs2 = new Dictionary.FourSquare(encoded, keyword1, keyword2, true);
      fourSquareDecoded.textContent = fs2.decode();
    } catch (e) {
      fourSquareOut.textContent = `Error: ${e.message}`;
      fourSquareDecoded.textContent = '-';
    }

    // Two-Square
    try {
      const keyword = twoSquareKey.value || 'KEYWORD';
      const ts = new Dictionary.TwoSquare(text, keyword);
      const encoded = ts.encode();
      twoSquareOut.textContent = encoded;

      const ts2 = new Dictionary.TwoSquare(encoded, keyword, true);
      twoSquareDecoded.textContent = ts2.decode();
    } catch (e) {
      twoSquareOut.textContent = `Error: ${e.message}`;
      twoSquareDecoded.textContent = '-';
    }

    // ADFGVX
    try {
      const keyword = adfgvxKey.value || 'KEYWORD';
      const transKey = adfgvxTransKey.value || 'KEY';
      const avx = new Dictionary.ADFGVX(text, keyword, transKey);
      const encoded = avx.encode();
      adfgvxOut.textContent = encoded;

      const avx2 = new Dictionary.ADFGVX(encoded, keyword, transKey, true);
      adfgvxDecoded.textContent = avx2.decode();
    } catch (e) {
      adfgvxOut.textContent = `Error: ${e.message}`;
      adfgvxDecoded.textContent = '-';
    }

    // ADFGX
    try {
      const keyword = adfgxKey.value || 'KEYWORD';
      const transKey = adfgxTransKey.value || 'KEY';
      const ax = new Dictionary.ADFGX(text, keyword, transKey);
      const encoded = ax.encode();
      adfgxOut.textContent = encoded;

      const ax2 = new Dictionary.ADFGX(encoded, keyword, transKey, true);
      adfgxDecoded.textContent = ax2.decode();
    } catch (e) {
      adfgxOut.textContent = `Error: ${e.message}`;
      adfgxDecoded.textContent = '-';
    }

    // Route
    try {
      const rows = parseInt(routeRows.value, 10) || 5;
      const cols = parseInt(routeCols.value, 10) || 5;
      const route = routePattern.value || 'spiral';
      const rt = new Columnar.Route(text, rows, cols, route);
      const encoded = rt.encode();
      routeOut.textContent = encoded;

      const rt2 = new Columnar.Route(encoded, rows, cols, route, true);
      routeDecoded.textContent = rt2.decode();
    } catch (e) {
      routeOut.textContent = `Error: ${e.message}`;
      routeDecoded.textContent = '-';
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
  beaufortKey.addEventListener('input', update);
  portaKey.addEventListener('input', update);
  gronsfeldKey.addEventListener('input', update);
  bifidKey.addEventListener('input', update);
  railFenceRails.addEventListener('input', update);
  playfairKey.addEventListener('input', update);
  fourSquareKey1.addEventListener('input', update);
  fourSquareKey2.addEventListener('input', update);
  twoSquareKey.addEventListener('input', update);
  adfgvxKey.addEventListener('input', update);
  adfgvxTransKey.addEventListener('input', update);
  adfgxKey.addEventListener('input', update);
  adfgxTransKey.addEventListener('input', update);
  routeRows.addEventListener('input', update);
  routeCols.addEventListener('input', update);
  routePattern.addEventListener('input', update);

  // Initial call with check
  function checkLibrary() {
    if (window.nigmajs) {
      update();
    } else {
      // Retry
      setTimeout(checkLibrary, 200);
    }
  }
  checkLibrary();
});
