import { default as BasicCipher } from "../../basicCipher.js";
import { default as Rotors } from "./rotors.js";

export default class Enigma extends BasicCipher {
  /* Enigma Machine - German WWII
    
    ttps://en.wikipedia.org/wiki/Enigma_machine

    The Enigma machine is an encryption device developed and used in the early- to mid-20th century to protect commercial, 
    diplomatic and military communication. It was employed extensively by Nazi Germany during World War II, in all branches of the German military.
    
    Enigma has an electromechanical rotor mechanism that scrambles the 26 letters of the alphabet. In typical use, 
    one person enters text on the Enigma’s keyboard and another person writes down which of 26 lights above the keyboard 
    lights up at each key press. If plain text is entered, the lit-up letters are the encoded ciphertext. 
    Entering ciphertext transforms it back into readable plaintext. 

    The rotor mechanism changes the electrical connections between the keys and the lights with each keypress.
    The security of the system depends on Enigma machine settings that were changed daily, based on secret key lists distributed in advance, 
    and on other settings that change for each message. 
    
    Additional info on rotors: https://en.wikipedia.org/wiki/Enigma_rotor_details
    
    The receiving station has to know and use the exact settings employed by the transmitting station to successfully decrypt a message.
    
    PS: One of the most famous encryption "methods" ever, it is my pleasure to enclude it in the module. 
    Disclaimer: All functions here were based on the works of :http://practicalcryptography.com/ciphers/enigma-cipher/ and adapted to ES6
    and CLass format. Thanks for your work, I couldn't have done this without your code :)

    */

  constructor(
    message,
    keySettings = "AAA",
    ringSettings = "AAA",
    plugboardSettings = "PO ML IU KJ NH YT GB VF RE DC",
    rotorSettings = "123",
    rotorVersion = 4,
    encoded = false,
    debug = false
  ) {
    //Enigma is a very complex system, no wonder it as so hard to crack during WWII. the rotors and plugs are responsible for the setup of the alphabet.
    super(message, encoded, "enigma", "", "", debug);
    this.message = message.toUpperCase();
    this.keySettings = keySettings;
    this.ringSettings = ringSettings;
    this.plugboardSettings = plugboardSettings;
    this.rotorSettings = rotorSettings;
    this.rotorSet = rotorVersion;
    this.initialize();
    this.selectRotors();
  }

  initialize = () => {
    //Function to be called at any point before we start to work with the code, I prefer to use it in the constructor and forget about it.
    this.rotorSettings = this.rotorSettings.replace(/[^1-9]/g, "");
    this.keySettings = this.keySettings.toUpperCase().replace(/[^A-Z]/g, "");
    this.ringSettings = this.ringSettings.toUpperCase().replace(/[^A-Z]/g, "");

    this.plugboardSettings = this.plugboardSettings
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
  };

  selectRotors = () => {
    let rotorOptions = new Rotors();
    switch (this.rotorSet) {
      case 1:
        this.rotorSets = rotorOptions.rotorSet1;
        break;
      case 2:
        this.rotorSets = rotorOptions.rotorSet2;
        break;
      case 3:
        this.rotorSets = rotorOptions.rotorSet3;
        break;
      case 4:
        this.rotorSets = rotorOptions.rotorSet4;
        break;
      case 5:
        this.rotorSets = rotorOptions.rotorSet5;
        break;
      default:
        this.rotorSets = rotorOptions.rotorSet4;
        break;
    }
    let rotors = this.rotorSettings.split("");
    //Right (fast) rotor
    rotors[0] = this.rotorSets[rotors[0]];
    //MIddle rotor
    rotors[1] = this.rotorSets[rotors[1]];
    //Left (slow) rotor
    rotors[2] = this.rotorSets[rotors[2]];
    this.rotors = rotors;
    return rotors;
  };

  validateSettings = plaintext => {
    // do some error checking
    let retorno = true;
    if (plaintext.length < 1) {
      alert("please enter some plaintext (letters and numbers only)");
      retorno = false;
    }
    if (this.keySettings.length != 3) {
      alert("Key settings must consist of 3 uppercase characters.");
      retorno = false;
    }
    if (this.ringSettings.length != 3) {
      alert("Ring settings must consist of 3 uppercase characters.");
      retorno = false;
    }
    if (this.plugboardSettings.length > 26) {
      alert("There cannot be more than 13 pairs in the plugboard settings.");
      retorno = false;
    }
    if (this.plugboardSettings.length % 2 != 0) {
      alert(
        "There must be an even number of characters in the plugboard settings."
      );
      retorno = false;
    }
    if (this.rotorSettings.length != 3) {
      alert("Rotor settings must consist of 3 numbers 1-9.");
      retorno = false;
    }
    return retorno;
  };

  setupPlugboard = () => {
    let plugboard = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let parr = plugboard.split("");
    for (let i = 0, j = 1; i < this.plugboardsettings.length; i += 2, j += 2) {
      let ichar = plugboard.indexOf(this.plugboardsettings.charAt(i));
      let jchar = plugboard.indexOf(this.plugboardsettings.charAt(j));
      let temp = parr[jchar];
      parr[jchar] = parr[ichar];
      parr[ichar] = temp;
    }
    plugboard = parr.join("");
    return plugboard;
  };

  setupKey = () => {
    let key = this.keysettings.split("");
    key[0] = this.code(key[0]);
    key[1] = this.code(key[1]);
    key[2] = this.code(key[2]);
    return key;
  };

  setupCode = () => {
    let ring = this.ringsettings.split("");
    ring[0] = this.code(ring[0]);
    ring[1] = this.code(ring[1]);
    ring[2] = this.code(ring[2]);
    return ring;
  };

  getRotors = () => this.rotors;
  getRotorSets = () => this.rotorSets;

  encode = () => {
    let ciphertext = "";
    let plaintext = this.message.replace(/[^A-Z]/g, "");
    this.initialize();
    if (this.validateSettings(plaintext)) {
      ciphertext = "Valid Settings";
    }
    return ciphertext;
  };
}
