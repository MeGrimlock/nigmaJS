# NigmaJS

![Programming Language JS-ES6](https://img.shields.io/badge/language-JS--ES6-yellow)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
![NPM Version](https://img.shields.io/npm/v/nigmajs)
![NPM Downloads](https://img.shields.io/npm/dm/nigmajs)
![NPM Bundle Size](https://img.shields.io/bundlephobia/minzip/nigmajs)
![GitHub Stars](https://img.shields.io/github/stars/MeGrimlock/nigmaJS?style=social)
![GitHub Forks](https://img.shields.io/github/forks/MeGrimlock/nigmaJS?style=social)
![GitHub Issues](https://img.shields.io/github/issues/MeGrimlock/nigmaJS)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/MeGrimlock/nigmaJS)
![GitHub Last Commit](https://img.shields.io/github/last-commit/MeGrimlock/nigmaJS)
![GitHub Contributors](https://img.shields.io/github/contributors/MeGrimlock/nigmaJS)
![GitHub Repo Size](https://img.shields.io/github/repo-size/MeGrimlock/nigmaJS)

<p align="center">
  <img src="https://github.com/MeGrimlock/nigmaJS/blob/master/demo/favicon.ico" width="260" title="NigmaJS Logo">
</p>

NigmaJS is a comprehensive cryptographic library for Node.js and the browser. It implements various classical ciphers and the famous Enigma Machine, providing a robust set of tools for encryption, decryption, and cryptoanalysis.

## Features

- **Mechanical Ciphers**: Fully functional Enigma Machine (M3/M4 compatible).
- **Shift Ciphers**: Caesar, ROT5, ROT13, ROT47.
- **Polyalphabetic Ciphers**: Vigenère, Beaufort, Porta, Gronsfeld, Quagmire I, II, III, IV.
- **Dictionary Ciphers**: Atbash, Autokey, Baconian, Bifid, Four-Square, Two-Square, ADFGX, ADFGVX, Morse, Playfair, Simple Substitution, Bazeries, Polybius.
- **Columnar Ciphers**: AMSCO, Rail Fence, Route.
- **Intelligent Cryptanalysis**: Automated cipher detection and decryption with multi-language support.
- **Dictionary Validation**: Multi-language dictionary validation (English, Spanish, Italian, French, Portuguese, German).
- **Statistical Analysis**: Index of Coincidence (IC), Chi-squared, Entropy, N-gram analysis.
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

## Automated Cryptanalysis

NigmaJS includes an intelligent **Orchestrator** that automatically detects cipher types and performs cryptanalysis attacks.

### Orchestrator Overview

The Orchestrator is a sophisticated attack coordinator that:

1. **Detects the language** of the ciphertext (if auto-detection is enabled)
2. **Identifies the cipher type** using statistical analysis
3. **Selects appropriate attack strategies** based on the detected cipher
4. **Executes attacks** across multiple language candidates
5. **Validates results** using dictionary-based scoring
6. **Returns the best result** with confidence metrics

### Basic Usage

```javascript
const { Orchestrator } = require('nigmajs');

// Create orchestrator with automatic language detection
const orchestrator = new Orchestrator('auto');

// Decrypt ciphertext automatically
const result = await orchestrator.autoDecrypt('KHOOR ZRUOG', {
    tryMultiple: true,      // Try multiple strategies
    maxTime: 60000,         // Maximum 60 seconds
    useDictionary: true     // Use dictionary validation
});

console.log(result.plaintext);        // "HELLO WORLD"
console.log(result.method);           // "caesar-brute-force"
console.log(result.confidence);       // 0.95
console.log(result.cipherType);      // "caesar-shift"
```

### Multi-Language Strategy

The Orchestrator implements an **exhaustive multi-language decryption strategy**:

1. **Language Detection**: Analyzes the ciphertext to identify the most probable languages (top 5 candidates)
2. **Exhaustive Search**: For each language candidate:
   - Tries ALL available decryption strategies
   - Validates results with language-specific dictionaries
   - Scores results using combined metrics (confidence + dictionary validation)
3. **Early Termination**: Stops early if an "excellent" result is found (high confidence + high dictionary validation)
4. **Best Result Selection**: Returns the result with the highest combined score across all languages

```javascript
// The orchestrator will try:
// 1. English with all strategies
// 2. Spanish with all strategies
// 3. Italian with all strategies
// ... and so on for all detected language candidates

const result = await orchestrator.autoDecrypt(ciphertext, {
    tryMultiple: true,
    useDictionary: true
});
```

### Attack Strategies

The Orchestrator selects strategies based on detected cipher type:

#### Shift Ciphers (Caesar, ROT13, ROT47)
- **Atbash Solver**: Checks if cipher is Atbash (Caesar shift 25)
- **ROT47 Brute Force**: Tries all 94 printable ASCII shifts
- **Caesar Brute Force**: Tries all 26 letter shifts with N-gram scoring

#### Vigenère-like Ciphers
- **Vigenère Solver**: Uses Friedman Test + frequency analysis per column
- **Autokey Solver**: Tries common keys with validation
- **Polyalphabetic Solver**: Handles Beaufort, Porta, Gronsfeld, Quagmire variants

#### Substitution Ciphers
- **Hill Climbing**: Heuristic search with quadgram scoring
- **Simulated Annealing**: Probabilistic optimization algorithm
- **HMM Solver**: Hidden Markov Model approach (experimental)

#### Dictionary-based Ciphers
- **Atbash Solver**: Direct transformation
- **Baconian Solver**: Decodes A/B or 0/1 patterns
- **Polybius Solver**: Detects number pairs, decodes with/without keywords

### Language Analysis

#### Automatic Language Detection

The Orchestrator uses **N-gram analysis** to detect the language of ciphertext:

```javascript
const { LanguageAnalysis } = require('nigmajs');

const results = await LanguageAnalysis.detectLanguage('THE QUICK BROWN FOX');
// Returns array of language candidates with probability scores
// [
//   { language: 'english', identityScore: 0.0234, ... },
//   { language: 'spanish', identityScore: 0.0456, ... },
//   ...
// ]
```

**Supported Languages:**
- English (275k+ words)
- Spanish (636k+ words)
- Italian (17k+ words)
- French (319k+ words)
- Portuguese (182k+ words)
- German (66k+ words)

#### Language Detection Methods

1. **N-gram Identity Scoring**: Compares quadgram frequencies against language models
2. **Statistical Analysis**: Index of Coincidence (IC), Chi-squared tests
3. **Dictionary Validation**: Checks word coverage against language dictionaries

### Dictionary Validation

Dictionary validation provides confidence metrics for decryption results:

```javascript
const { DictionaryValidator } = require('nigmajs');

const validator = new DictionaryValidator('english');
await validator.ensureDictionaryLoaded();

const validation = await validator.validate('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG');

console.log(validation.valid);              // true
console.log(validation.confidence);         // 0.95
console.log(validation.metrics.wordCoverage); // 100%
console.log(validation.metrics.charCoverage); // 100%
```

#### Validation Metrics

- **Word Coverage**: Percentage of characters in valid dictionary words
- **Valid Words**: Number of words found in dictionary
- **Character Coverage**: Percentage of characters covered by valid words
- **Average Word Length**: Longer valid words indicate higher confidence
- **Vocabulary Richness**: Ratio of unique words to total words

### Cipher Detection

The Orchestrator uses **statistical fingerprinting** to identify cipher types:

```javascript
const { CipherIdentifier } = require('nigmajs');

const detection = await CipherIdentifier.identify(ciphertext, 'english');

console.log(detection.families[0].type);        // "caesar-shift"
console.log(detection.families[0].confidence);  // 0.89
```

#### Detection Methods

1. **Index of Coincidence (IC)**: 
   - Caesar/Substitution: IC ≈ 1.73 (English)
   - Vigenère: IC ≈ 1.0-1.5 (depends on key length)
   - Random: IC ≈ 1.0

2. **Chi-squared Test**: Compares letter frequencies against expected language frequencies

3. **Entropy Analysis**: Measures randomness in the ciphertext

4. **Kasiski Examination**: Detects repeating patterns (for polyalphabetic ciphers)

5. **Pattern Analysis**: Detects specific patterns (number pairs for Polybius, A/B for Baconian)

### Statistical Analysis

NigmaJS provides comprehensive statistical analysis tools:

```javascript
const { Stats } = require('nigmajs');

const text = 'THE QUICK BROWN FOX';

console.log(Stats.indexOfCoincidence(text));  // ~1.73 for English
console.log(Stats.entropy(text));              // ~4.0 for English
console.log(Stats.chiSquared(text, 'english')); // Lower = more English-like
```

#### Key Metrics

- **Index of Coincidence (IC)**: Measures letter frequency distribution
- **Entropy**: Measures randomness (higher = more random)
- **Chi-squared**: Measures deviation from expected frequencies
- **N-gram Frequencies**: Monograms, bigrams, trigrams, quadgrams

### Architecture

The Orchestrator follows a **modular architecture** following SOLID principles:

```
Orchestrator (Coordinator)
├── LanguageHandler (Language detection & management)
├── StrategySelector (Strategy selection logic)
├── ResultValidator (Dictionary validation & scoring)
└── Strategy Classes (Individual attack implementations)
    ├── CaesarBruteForce
    ├── ROT47BruteForce
    ├── VigenereSolver
    ├── PolyalphabeticSolver
    ├── AtbashSolver
    ├── AutokeySolver
    ├── BaconianSolver
    ├── PolybiusSolver
    └── SubstitutionStrategy (HillClimb/SimulatedAnnealing)
```

### Advanced Usage

#### Generator-based Progress Tracking

```javascript
const orchestrator = new Orchestrator('auto');

for await (const update of orchestrator.autoDecryptGenerator(ciphertext, {
    tryMultiple: true,
    useDictionary: true
})) {
    console.log(`Stage: ${update.stage}`);
    console.log(`Progress: ${update.progress}%`);
    console.log(`Message: ${update.message}`);
    
    if (update.plaintext) {
        console.log(`Current result: ${update.plaintext}`);
    }
}
```

#### Custom Language Selection

```javascript
// Use specific language
const orchestrator = new Orchestrator('spanish');
const result = await orchestrator.autoDecrypt(ciphertext);

// Or let it auto-detect
const orchestrator = new Orchestrator('auto');
const result = await orchestrator.autoDecrypt(ciphertext);
```

## Documentation

Detailed documentation can be found in the `docs/` directory:

### Technical Documentation
- [Cryptanalysis Guide](docs/CRYPTANALYSIS.md) - Comprehensive guide to automated cryptanalysis, attack strategies, and statistical analysis

### Project Documentation
- [Contributing](docs/CONTRIBUTING.md) - Guidelines for contributing to the project
- [Code of Conduct](docs/CODE_OF_CONDUCT.md) - Community code of conduct
- [Changelog](docs/CHANGELOG.md) - Version history and changes

## Project Structure

```
nigmaJS/
├── src/
│   ├── attacks/              # Cryptanalysis and attack strategies
│   │   ├── orchestrator.js   # Main attack coordinator
│   │   ├── helpers/          # Helper modules (LanguageHandler, StrategySelector, ResultValidator)
│   │   └── strategies/       # Individual attack implementations
│   ├── analysis/             # Statistical analysis and cipher detection
│   │   ├── identifier.js    # Cipher type detection
│   │   ├── stats.js         # Statistical metrics (IC, Chi-squared, Entropy)
│   │   ├── kasiski.js       # Kasiski examination for polyalphabetic ciphers
│   │   └── analysis.js      # Language analysis and N-gram models
│   ├── language/             # Language-specific tools
│   │   ├── dictionary-validator.js  # Dictionary-based validation
│   │   ├── scorers.js       # N-gram scoring functions
│   │   └── models/          # Language N-gram models
│   ├── ciphers/             # Cipher implementations
│   │   ├── shift/           # Shift ciphers (Caesar, ROT13, etc.)
│   │   ├── polyalphabetic/  # Polyalphabetic ciphers (Vigenère, etc.)
│   │   ├── dictionary/      # Dictionary-based ciphers
│   │   ├── columnar/        # Columnar transposition ciphers
│   │   └── enigma/         # Enigma Machine
│   ├── search/              # Heuristic search algorithms
│   │   ├── hillclimb.js    # Hill climbing algorithm
│   │   ├── simulated-annealing.js  # Simulated annealing
│   │   └── scorer.js       # N-gram scoring
│   └── core/                # Core utilities and validation
├── demo/                    # Example applications and demonstrations
│   ├── demo.html           # Interactive cipher demonstrations
│   ├── chain-demo.html     # Cipher chain builder
│   └── decryption-tool.html # Automated decryption tool
├── docs/                    # Project documentation
└── build/                   # Compiled UMD library
```

## License

This project is licensed under the GPL v3 License - see the [LICENSE](LICENSE) file for details.
