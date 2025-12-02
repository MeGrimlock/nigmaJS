// Manual Vigenere test
function manualDecrypt(cipher, key) {
    let result = "";
    let keyIndex = 0;

    for (let i = 0; i < cipher.length; i++) {
        const char = cipher[i];

        if (char.match(/[A-Z]/)) {
            const charCode = char.charCodeAt(0) - 65; // A=0, B=1, ..., Z=25
            const keyChar = key[keyIndex % key.length];
            const keyCode = keyChar.charCodeAt(0) - 65;

            // Decrypt: (cipher - key) mod 26
            let decoded = (charCode - keyCode) % 26;
            if (decoded < 0) decoded += 26;

            result += String.fromCharCode(decoded + 65);
            keyIndex++;
        } else {
            result += char;
        }
    }

    return result;
}

// Test data from the test file
const cipher = "DLVLHYFRQEXWLRXOVHUWKHODCBGRJDQGUXQVDLQWRWKHIRUHVW";
const key = "KEY";
const expected = "THEQUICKBROWNFOXJUMPSOVERTHELAZYDOGANDRUNSINTOTHEFOREST";

console.log('Cipher:', cipher);
console.log('Key:', key);
console.log('Expected:', expected);

const result = manualDecrypt(cipher, key);
console.log('Manual decrypt result:', result);
console.log('Match?', result === expected);
