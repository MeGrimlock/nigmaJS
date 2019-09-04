# Change Log

All notable changes to this project will be documented in this file.

## [2.0.0] - 2019-08-19

### Features

- Redefined the concept of the basicCipher.js, it holds basic operations for ciphering/dechipering but not for analysis.
- Added languageAnalysis folder where all the analysis and brute force deciphering are to be placed.
- Fixed simple substitution and Bazeries cipher so that the transposition worked when i/j or u/v are combined.
- Removed a lot of junk from package.json file.
- Ciphers are now more flexible, encode/decode methods are now being adapted so that they support strings and a single cipher cna be used many times over.
