[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

# NigmaJS

This repository is focused on the implementation of many fantastic cryptographic techniques that have been generated over the last millenia.

**Nigma**

Nigma.js is the class that is currently being developed to include methods which can assist you perform basic criptoanalysis. Right now these are tools that provide a basic analysis keep an eye for future updates since I'll be developing automatic code decryption :)

So far the library includes:

- Frequency analysis constants for spanish letters, bigrams, trigrams and quadgrams
- Frequency analysis **method** por ciphered text analysis
- Alphabet manipulation methods
- Auxiliary methods for strings or array manipulation

# Installation

This is a Node.js module available through the npm registry.

Before installing, download and install Node.js. Node.js 0.10 or higher is required.

Installation is done using the npm install command:

`npm install nigmajs`

Another option is simply to download from github https://github.com/MeGrimlock/nigmaJS/ and copy the srcipts file wherever you want to use it.

#Features

- ES6 Class oriented + modular programming for easy code recycling
- Shift ciphers
- Dictionaty ciphers
- Columnar transposition ciphers
- Tools for creating your own ciphers

# Basic Cipher Class

The heart of it is the **basicCipher.js** since all methods extend this class. For simple use, all files follow the same format and method naming. As the project evolves, I plan to add more functionalities to this class so that it becomes the pillar for new method building.

Some intresting methods:

- **GETs / SETs** for all elements.
- **shiftCharacters**: this method receives a text and transforms it by shifting its alphabet a given amount of chars. Example: AXU shift 1 -> BYV
- **encodeAlphabet / decodeAlphabet** : given char separation and word separation, it takes the previously set alphabet and encodes or decodes a message.

# Other Classes

As a reference:

- All classes have a **constructor** method that extends basicCipher
- All classes have a **decode** / **encode** method

If you want to use this modules, know that basicCipher.js is the parent class where all other codes are based. Another intresting fact is that all aux methods are to be placed here. As more methods are implemented and code can be recycled, be sure that basicCipher is only going to get more powerfull.

# Mechanical Ciphers

The **Enigma mahcine** from WWII used by germans has been included. This masterpiece was so tough to break that it took allied forces years of work to finally decipher it.

Unlike all other methods currently supported my this library, en encode method is in fact the decode method. Weird, I know but that's just how it works. Be sure to check wikipedia link inside module to understand how the different configurations work as I'm not 100% sure I understand it.

What's important to know is that in order to setup this machine there are many aspects to consider

- rotors order and position
- plug settings

# Dictionary Ciphers

- **Morse**: encoding / decoding is ready
- **Baconian**: encoding / decoding is ready
- **ATBASH**: encoding / decoding is ready
- **Simple Substitution**: encoding / decoding is ready

# Shift Ciphers

- **Caesar Shift**: encoding / decoding is ready
- **Rot13 Shift**: encoding / decoding is ready

# Other Methods

- **AMSCO**: encoding / decoding is ready

# Disclaimer

Feel free to use but know that they are currently being tested/developed for fun purposes only.

I'm not responsible for any trouble caused to you are anyone using this code.

GG
