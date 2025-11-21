# NigmaJS

![Programming Language JS-ES6](https://img.shields.io/badge/language-JS--ES6-yellow)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
![Test](https://img.shields.io/badge/test-passing-green)
![NPM Version](https://img.shields.io/npm/v/nigmajs)

<p align="center">
  <img src="https://github.com/MeGrimlock/nigmaJS/blob/master/demo/favicon.ico" width="260" title="NigmaJS Logo">
</p>

NigmaJS is a comprehensive cryptographic library for Node.js and the browser. It implements various classical ciphers and the famous Enigma Machine, providing a robust set of tools for encryption, decryption, and cryptoanalysis.

## Features

- **Mechanical Ciphers**: Fully functional Enigma Machine (M3/M4 compatible).
- **Shift Ciphers**: Caesar, ROT5, ROT13, ROT47.
- **Polyalphabetic Ciphers**: Vigenère, Beaufort, Porta, Gronsfeld, Quagmire I, II, III, IV.
- **Dictionary Ciphers**: Atbash, Autokey, Baconian, Bifid, Morse, Simple Substitution, Bazeries, Polybius.
- **Columnar Ciphers**: AMSCO.
- **Input Validation**: Robust validation for keys and messages to prevent errors.
- **Universal Support**: Works in Node.js and Browsers (UMD build).

## Installation

Install via NPM:

```bash
npm install nigmajs
```

## Usage

### Importing the Library

**Node.js (CommonJS):**
```javascript
const { Enigma, Shift, Dictionary, Polyalphabetic } = require('nigmajs');
```

**ES Modules / Webpack:**
```javascript
import { Enigma, Shift, Dictionary, Polyalphabetic } from 'nigmajs';
```

### Examples

#### Enigma Machine
```javascript
const { Enigma } = require('nigmajs');

const machine = new Enigma('HELLO WORLD');
// Configure rotors, plugs, etc. if needed
const encrypted = machine.encode();
console.log(encrypted);
```

#### Caesar Shift
```javascript
const { Shift } = require('nigmajs');

const caesar = new Shift.CaesarShift('HELLO WORLD', 3);
const encrypted = caesar.encode(); // KHOOR ZRUOG
console.log(encrypted);
```

#### Morse Code
```javascript
const { Dictionary } = require('nigmajs');

const morse = new Dictionary.Morse('SOS');
console.log(morse.encode()); // ... --- ...
```

#### Quagmire III Cipher
```javascript
const { Polyalphabetic } = require('nigmajs');

const quagmire3 = new Polyalphabetic.Quagmire3('HELLO WORLD', 'KEY', 'KEY');
const encrypted = quagmire3.encode();
console.log(encrypted);

const decrypted = new Polyalphabetic.Quagmire3(encrypted, 'KEY', 'KEY', true);
console.log(decrypted.decode()); // HELLO WORLD
```

#### Quagmire IV Cipher
```javascript
const { Polyalphabetic } = require('nigmajs');

const quagmire4 = new Polyalphabetic.Quagmire4('HELLO WORLD', 'KEY', 'ABC');
const encrypted = quagmire4.encode();
console.log(encrypted);

const decrypted = new Polyalphabetic.Quagmire4(encrypted, 'KEY', 'ABC', '', true);
console.log(decrypted.decode()); // HELLO WORLD
```

#### Beaufort Cipher
```javascript
const { Polyalphabetic } = require('nigmajs');

const beaufort = new Polyalphabetic.Beaufort('HELLO WORLD', 'KEY');
const encrypted = beaufort.encode();
console.log(encrypted);

const decrypted = new Polyalphabetic.Beaufort(encrypted, 'KEY', true);
console.log(decrypted.decode()); // HELLO WORLD
```

#### Bifid Cipher
```javascript
const { Dictionary } = require('nigmajs');

const bifid = new Dictionary.Bifid('HELLO WORLD', 'KEYWORD');
const encrypted = bifid.encode();
console.log(encrypted);

const decrypted = new Dictionary.Bifid(encrypted, 'KEYWORD', true);
console.log(decrypted.decode()); // HELLO WORLD
```

## Documentation

Detailed documentation for contributing, code of conduct, and changelog can be found in the `docs/` directory:
- [Contributing](docs/CONTRIBUTING.md)
- [Code of Conduct](docs/CODE_OF_CONDUCT.md)
- [Changelog](docs/CHANGELOG.md)

## Project Structure

- `src/`: Source code for all ciphers and utilities.
- `demo/`: Example application and usage demonstrations.
- `docs/`: Project documentation.
- `build/`: Compiled UMD library.

## License

This project is licensed under the GPL v3 License - see the [LICENSE](LICENSE) file for details.
