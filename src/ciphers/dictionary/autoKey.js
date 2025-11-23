import { default as BasicCipher } from "../../core/basicCipher.js";

/**
 * This method implements a polialphabet substitution, but instead of generating a Matrix we use a formula that does the same but faster.
 * An autokey cipher (also known as the autoclave cipher) is a cipher that incorporates the message (the plaintext) into the key.
 * The key is generated from the message in some automated fashion, sometimes by selecting certain letters from the text or, more commonly,
 * by adding a short primer key to the front of the message.
 *
 * @method constructor
 * @param {String} message this text is what we want to get encoded/decoded
 * @param {String} key a text that is used to generate the alphabet
 */

export default class AutoKey extends BasicCipher {
  constructor(message, key, encoded, debug) {
    super(message, encoded, "autoKey", key, "", debug);

    /*
        A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
        ---------------------------------------------------
    A   A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
    B   B C D E F G H I J K L M N O P Q R S T U V W X Y Z A
    C   C D E F G H I J K L M N O P Q R S T U V W X Y Z A B
    D   D E F G H I J K L M N O P Q R S T U V W X Y Z A B C
    E   E F G H I J K L M N O P Q R S T U V W X Y Z A B C D
    F   F G H I J K L M N O P Q R S T U V W X Y Z A B C D E
    G   G H I J K L M N O P Q R S T U V W X Y Z A B C D E F
    H   H I J K L M N O P Q R S T U V W X Y Z A B C D E F G
    I   I J K L M N O P Q R S T U V W X Y Z A B C D E F G H
    J   J K L M N O P Q R S T U V W X Y Z A B C D E F G H I
    K   K L M N O P Q R S T U V W X Y Z A B C D E F G H I J
    L   L M N O P Q R S T U V W X Y Z A B C D E F G H I J K
    M   M N O P Q R S T U V W X Y Z A B C D E F G H I J K L
    N   N O P Q R S T U V W X Y Z A B C D E F G H I J K L M
    O   O P Q R S T U V W X Y Z A B C D E F G H I J K L M N
    P   P Q R S T U V W X Y Z A B C D E F G H I J K L M N O
    Q   Q R S T U V W X Y Z A B C D E F G H I J K L M N O P
    R   R S T U V W X Y Z A B C D E F G H I J K L M N O P Q
    S   S T U V W X Y Z A B C D E F G H I J K L M N O P Q R
    T   T U V W X Y Z A B C D E F G H I J K L M N O P Q R S
    U   U V W X Y Z A B C D E F G H I J K L M N O P Q R S T
    V   V W X Y Z A B C D E F G H I J K L M N O P Q R S T U
    W   W X Y Z A B C D E F G H I J K L M N O P Q R S T U V
    X   X Y Z A B C D E F G H I J K L M N O P Q R S T U V W
    Y   Y Z A B C D E F G H I J K L M N O P Q R S T U V W X
    Z   Z A B C D E F G H I J K L M N O P Q R S T U V W X Y

    */
  }

  /**
   * @method encode
   * @param {String} message text to use for encoding, if empty use stored message
   * @param {String} key key to use for encoding, if empty use stored key
   */

  encode = (message = this.message, myKey = this.key) => {
    const plaintext = message.toLowerCase().replace(/[^a-z]/g, "");
    const key = myKey.toLowerCase().replace(/[^a-z]/g, "");
    let ciphertext = "";
    if (plaintext.length >= 1 && key.length > 1) {
      for (let i = 0; i < plaintext.length; i += 1) {
        if (i < key.length) {
          ciphertext += String.fromCharCode(
            ((plaintext.charCodeAt(i) - 97 + (key.charCodeAt(i) - 97) + 26) %
              26) +
              97
          );
        } else {
          ciphertext += String.fromCharCode(
            ((plaintext.charCodeAt(i) -
              97 +
              (plaintext.charCodeAt(i - key.length) - 97) +
              26) %
              26) +
              97
          );
        }
      }
    }
    return ciphertext;
  };

  /**
   * @method decode
   * @param {String} message text to use for decoding, if empty use stored message
   * @param {String} key key to use for decoding, if empty use stored key
   */

  decode = (message = this.message, myKey = this.key) => {
    const ciphertext = message.toLowerCase().replace(/[^a-z]/g, "");
    const key = myKey.toLowerCase().replace(/[^a-z]/g, "");
    let plaintext = "";
    if (ciphertext.length > 1 && key.length > 1) {
      for (let i = 0; i < ciphertext.length; i += 1) {
        if (i < key.length) {
          plaintext += String.fromCharCode(
            ((ciphertext.charCodeAt(i) - 97 - (key.charCodeAt(i) - 97) + 26) %
              26) +
              97
          );
        } else {
          plaintext += String.fromCharCode(
            ((ciphertext.charCodeAt(i) -
              97 -
              (plaintext.charCodeAt(i - key.length) - 97) +
              26) %
              26) +
              97
          );
        }
      }
    }
    return plaintext;
  };
}
