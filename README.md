# NigmaJS

This repository is focused on the implementation of many fantastic cryptographic techniques that have been generated over the last millenia.

**Nigma**

Nigma.js is the class that is currently being developed to include methods which can assist you perform basic criptoanalysis. 

So far the library includes:

- Frequency analysis constants for spanish letters, bigrams, trigrams and quadgrams
- Frequency analysis **method** por ciphered text analysis
- Alphabet manipulation methods
- Auxiliary methods for strings or array manipulation

# Basic Cipher Class

The heart of it is the **basicCipher.js** since all methods extend this class. For simple use, all files follow the same format and method naming.

As a reference:

- All classes have a **constructor** method that extends basicCipher
- All classes have a **decode** / **encode** method

If you want to use this modules, know that basicCipher.js is the parent class where all other codes are based. Another intresting fact is that all aux methods are to be placed here. As more methods are implemented and code can be recycled, be sure that basicCipher is only going to get more powerfull.

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
