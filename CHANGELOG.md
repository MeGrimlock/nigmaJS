# Change Log

All notable changes to this project will be documented in this file.

## [2.2.5] - 2019-09-7

- **JSDoc support**: I'm very new to JS and I've been looking for this since I started :) I'm happy I finally found it and I adjusted all comments so that they are properly displayed.
- **Coveralls**: Another feature that I've been trying to implement for a while. Right now it "works" but since I'm working on win10 part of the publishing command is not working and I'm still trying to figure out how to properly configure **Travis** so that he does all the math. Roughly support seems to be around **68%**.

## [2.0.0] - 2019-08-19

**Version 2** has a new model regarding ciphers and how to use them. While V1 was more structured and designed to work with key and message being set on object creation,
the new model is now more flexible. Ciphers do receive msg and key upon creation BUT after being created they work as encoding / decoding machines that can receive this values
as parameters.

In short... you can create the cipher and then use encode(message,key) something that wasn't available in V1. Honestly, this proves easier to work and saves memory space.

Also, **encoded** Boolean is still stored but no longer really in use. I'm keeping it in case it prooves useful in the near future.

### Features

- Redefined the concept of the basicCipher.js, it holds basic operations for ciphering/dechipering but not for analysis.
- Added languageAnalysis folder where all the analysis and brute force deciphering are to be placed.
- Fixed simple substitution and Bazeries cipher so that the transposition worked when i/j or u/v are combined.
- Removed a lot of junk from package.json file.
- Ciphers are now more flexible, encode/decode methods are now being adapted so that they support strings and a single cipher cna be used many times over.

