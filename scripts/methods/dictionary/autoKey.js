import { default as BasicCipher } from "../../basicCipher.js";
export default class AutoKey extends BasicCipher {
  constructor(message, key, encoded, debug) {
    super(message, encoded, "autoKey", key, "", debug);
    //Parametros: message,encoded,method,key,alphabet
  }

  encode = () => {
    let plaintext = this.message.toLowerCase().replace(/[^a-z]/g, "");
    let key = this.key.toLowerCase().replace(/[^a-z]/g, "");
    let ciphertext = "";
    if (plaintext.length >= 1 && key.length > 1) {
      for (i = 0; i < plaintext.length; i++) {
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

  decode = () => {
    let ciphertext = this.message.toLowerCase().replace(/[^a-z]/g, "");
    let key = this.key.toLowerCase().replace(/[^a-z]/g, "");
    let plaintext = "";
    if (ciphertext.length > 1 && k.length > 1) {
      for (i = 0; i < ciphertext.length; i++) {
        if (i < k.length) {
          plaintext += String.fromCharCode(
            ((ciphertext.charCodeAt(i) - 97 - (k.charCodeAt(i) - 97) + 26) %
              26) +
              97
          );
        } else {
          plaintext += String.fromCharCode(
            ((ciphertext.charCodeAt(i) -
              97 -
              (plaintext.charCodeAt(i - k.length) - 97) +
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
