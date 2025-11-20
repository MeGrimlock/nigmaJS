// Wait for DOM and Library
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('mainInput');

  // Elements
  const caesarOut = document.getElementById('caesarOutput');
  const caesarShift = document.getElementById('caesarShift');

  const atbashOut = document.getElementById('atbashOutput');
  const morseOut = document.getElementById('morseOutput');
  const rot13Out = document.getElementById('rot13Output');

  const amscoOut = document.getElementById('amscoOutput');
  const amscoKey = document.getElementById('amscoKey');

  const enigmaOut = document.getElementById('enigmaOutput');

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
      caesarOut.textContent = c.encode();
    } catch (e) { caesarOut.textContent = 'Error: ' + e.message; }

    // Atbash
    try {
      const a = new Dictionary.Atbash(text);
      atbashOut.textContent = a.encode();
    } catch (e) { atbashOut.textContent = 'Error: ' + e.message; }

    // Morse
    try {
      const m = new Dictionary.Morse(text);
      morseOut.textContent = m.encode();
    } catch (e) { morseOut.textContent = 'Error: ' + e.message; }

    // ROT13
    try {
      // Check if Rot13 exists directly or under Shift
      if (Shift.Rot13) {
        const r = new Shift.Rot13(text);
        rot13Out.textContent = r.encode();
      } else {
        // Fallback if Rot13 is not exported or named differently
        // Maybe use Caesar with 13
        const r = new Shift.CaesarShift(text, 13);
        rot13Out.textContent = r.encode();
      }
    } catch (e) { rot13Out.textContent = 'Error: ' + e.message; }

    // AMSCO
    try {
      const k = amscoKey.value || '123';
      const am = new Columnar.Amsco(text, k);
      amscoOut.textContent = am.encode();
    } catch (e) { amscoOut.textContent = 'Error: ' + e.message; }

    // Enigma
    try {
      // Enigma might be the default export or named export
      // In index.js: export { Enigma }
      // In enigma.js: export default class Enigma
      // So window.nigmajs.Enigma should be the class
      const e = new Enigma(text);
      enigmaOut.textContent = e.encode();
    } catch (e) { enigmaOut.textContent = 'Error: ' + e.message; }
  }

  // Listeners
  input.addEventListener('input', update);
  caesarShift.addEventListener('input', update);
  amscoKey.addEventListener('input', update);

  // Initial call
  update();
});
