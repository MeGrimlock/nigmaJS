![Programming Language JS-ES6](https://img.shields.io/badge/language-JS--ES6-yellow)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
![No dependencies](https://img.shields.io/badge/dependencies-none-green)
![Test](https://img.shields.io/badge/test-passing-green)
![Build](https://img.shields.io/travis/MeGrimlock/nigmajs)
![NPM Version](https://img.shields.io/npm/v/nigmajs)
![NPM Downloads](https://img.shields.io/npm/dy/nigmajs)
![Commit Activity](https://img.shields.io/github/commit-activity/y/MeGrimlock/nigmaJS)
[![Coverage Status](https://coveralls.io/repos/github/MeGrimlock/nigmaJS/badge.svg?branch=master)](https://coveralls.io/github/MeGrimlock/nigmaJS?branch=master)


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

**NPM** install command:

`npm install nigmajs`, **but** since this code is written in ES6 and node only supports the `import` features when using the `--experimental-modules` flag I strongly suggest you adapt my source to fit your needs. 

**YARN** install command:

`yarn add nigmajs`

**GIT CLONE** Clone the srcipts wherever you want to use it.

`git clone https://github.com/MeGrimlock/nigmaJS/`

# How to use

There are 2 ways to use this files, for this guide I'll show you how to create an **Enigma machine**.

1. Import only the class that you need, this can save resources and in most cases you don't need to have access to all methods.

   `import { default as Enigma } from "./methods/enigma/enigma.js";` will give you access to the library and all it's methods. The path to this import depends on where your test file is placed.

2. Import **nigma class**, this gives you access to the whole library (see the `./app.js` file )

   ```
   import { default as Nigma, Enigma } from "./index.js";
   const newMachine = new Enigma("Encode this text");

   console.log(newMachine.encode());
   ```

   **WARNING**: Note that this code works if you are standing on the `src folder` file. If you want to call this from another folder, just check where you are standing before doing the import and adjust accordingly.

# Working Enviroment

Since the code has been minified with **Babel + Webpack** I thought it would be cool to add a working example of the various encryption methods :-)

Link to working example: https://megrimlock.github.io/nigmaJS/

# Features

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
- **AUTOKEY**: encoding / decoding is ready
- **Simple Substitution**: encoding / decoding is ready
- **Bazeries**: encoding / decoding is ready

# Shift Ciphers

- **Caesar Shift**: encoding / decoding is ready
- **Rot5,Rot7,Rot13,Rot18 and Rot47 Shift**: encoding / decoding is ready

# Other Methods

- **AMSCO**: encoding / decoding is ready
- **ENIGMA**: encoding / decoding is ready

# Contributing

If you want to contribute to this project and make it better, your help is welcome. Contributing is also a great way to learn more about social coding, new technologies and and their ecosystems.

Always write your commit messages in the present tense. Your commit message should describe what the commit, when applied, does to the code – not what you did to the code.

# Request for help

Since I've been using JavaScript for only 2 months, I'm still learning a lot on a daily basis. Because of this, the library has many thigs that can be improved or fixed.

One of the main issues to fix is that it works after being installed via NPM, for this I'm working on it with Babel and Webpack but I appreciate if someone with more experience could help me.

# Disclaimer

Feel free to use but know that they are currently being tested/developed for fun purposes only.

I'm not responsible for any trouble caused to you are anyone using this code.

GG
