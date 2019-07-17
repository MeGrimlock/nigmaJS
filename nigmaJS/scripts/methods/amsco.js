class amsco extends BasicCipher {
  /*
      http://ericbrandel.com/2016/10/09/the-amsco-cipher/
  
      AMSCO is an incomplete columnar transposition cipher. A bit to unpack there, but basically that means that you’re putting 
      the message into columns and those columns may not have equal lengths. It was invented by an A.M. Scott in the 19th century, 
      but strangely there is almost nothing online about him.
  -
      Suitable length: 8 to 12 lines  maximum

      The key can be a max length of 9 and must contain the numbers 1-n, with n being the length of the key. 
      1234 and 4132 would both be valid keys, but 1245 would not.
  
      */

  constructor(message, encoded, key) {
    const alphabet = {};
    super(message, encoded, "amsco", key, "");
    //Parametros: message,encoded,method,key,alphabet
    //WE have no key but we do have an alphabet
    //this.decode.bind(this);
    //console.log("constuctor",this);
  }

  validateKey = () => {
    ///Aux method that verifies if no columns in [1,2...n] are present and if all 1-9 digits are there
    let validated = true;
    let explodedKey = this.key.split("").sort();
    let pattern = /^\d+$/;
    //console.log(`Check for [0-9] chars only: ${pattern.test(this.key)} key analyzed : ${this.key}`);
    if (pattern.test(this.key)) {
      //console.log(`Numbers only Key: ${explodedKey} `);
      let index = 0;
      do {
        const element = explodedKey[index];
        //console.log(`Validating ... Char ${element} of type ${typeof element} at ${index}` );
        if (element === (1 + index).toString()) {
          validated = true;
          index++;
        } else {
          validated = false;
          console.log("Sequence not validated");
        }
      } while (validated === true && index < explodedKey.length);
      if (!validated) {
        console.log("Invalid Key sequence");
      }
      return validated;
    } else {
      console.log("Invlaid key, Non numbers detected");
      validated = false;
    }

    return validated;
  };

  validateEncoded = () =>
    this.encoded === true &&
    typeof (this.message != null) &&
    this.message != "" &&
    this.validateKey();

  decode = () => {
    //To decode baconian i must take 5 letters at a tim and analyze them.
    let messageDecoded = [];
    //In order to encode a message first we validate that the message is encoded, that it's not null and that the string is not empty.
    if (this.validateEncoded()) {
      //Convert key values to array with index adjustment
      let explodedKey = this.key.split("").map(myval => myval - 1);
      let totalChars = this.message.length;
      // Aux variables for processing
      let index = 0;
      let numChars = 1;
      let extraChars = 1;
      //Create subarrays based on key values
      let decodingMatrix = [];
      explodedKey.map(value => {
        decodingMatrix.push(new Array());
        messageDecoded.push([value]);
      });
      //Build decoding Matrix
      do {
        decodingMatrix.forEach(element => {
          if (index < totalChars) {
            if (totalChars - index > numChars) {
              element.push(numChars);
            } else {
              element.push(totalChars - index);
            }
          } else {
            element.push(0);
          }
          index += numChars;
          numChars = numChars == 1 ? 2 : 1;
        });
        numChars = numChars == 1 ? 2 : 1;
      } while (index < totalChars);
      //Using decoding matrix, extract all data into correct char chunks
      index = 0;
      let keys = 0;

      do {
        let subIndex = 0;
        let key = explodedKey.indexOf(keys);
        do {
          extraChars = index + decodingMatrix[key][subIndex];
          const element = this.message.slice(index, extraChars);
          messageDecoded[key].push(element);
          index = extraChars;
          subIndex++;
        } while (subIndex < decodingMatrix[key].length);
        keys++;
      } while (keys < decodingMatrix.length);
      //Now all the text is ordered but in separate colums/rows
      messageDecoded = this.transposeMatrix(messageDecoded);
      messageDecoded.shift();
      messageDecoded = messageDecoded.map(row => row.join(""));
      messageDecoded = messageDecoded.join("");
      //messageDecoded.sort(this.sortFunction);
      //console.log("Done decoding: ", messageDecoded);
    }
    return messageDecoded;
  };

  encode = () => {
    let originalMessage = "";
    let encodedMessage = "";
    let encodingMatrix = [];

    if (this.encoded === false && this.validateKey()) {
      //Analyze key
      let keys = this.key.split("");
      keys.forEach(element => {
        encodingMatrix.push([element]);
      });
      //Eliminate non usable chars
      originalMessage = this.message.replace(/\s+/g, "").toLocaleUpperCase();
      let limit = originalMessage.length;
      let index = 0;
      let extraChars = 1;
      let columns = this.key.length;
      let subIndex = 0;

      do {
        let tempValue = originalMessage.slice(index, index + extraChars);
        //if (subIndex === 0) console.log("----New line----");
        /*console.log(
          `-> ${tempValue} \t taken from originalMessage.index[${index},${index +
            extraChars}] \t placed at -> encodingMatrix[${subIndex}]`
        );*/
        encodingMatrix[subIndex].push(tempValue);
        index = index + extraChars;
        extraChars = extraChars == 1 ? 2 : 1; //Toggle between 1 and 0 extra chars
        //Adjust new line
        if (subIndex === columns - 1) {
          subIndex = 0;
          extraChars = extraChars == 1 ? 2 : 1;
        } else {
          subIndex++;
        }
      } while (index < limit);

      encodingMatrix.sort(this.sortFunction);
      //Now that the matrix is ready, time to make the final step... generate the message :)

      encodingMatrix.forEach(element => {
        element.shift(); //Remove the first item since it contains key value
        encodedMessage += element.join("");
      });
    }

    return encodedMessage;
  };
}

const mensaje =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dapibus suscipit velit vitae vulputate. Vivamus vel tempus lacus. Fusce dictum, leo id porttitor dapibus, leo diam rutrum nulla, ut feugiat";

const miTexto = new amsco(mensaje, false, "4123");
const miTexto2 = new amsco(mensaje, false, "5413627");
const miTexto3 = new amsco(miTexto2.encode(), true, "5413627");

document.write(
  "Encoding: <br>",
  miTexto.getMsg(),
  "->",
  miTexto.encode() + "<br>"
);

document.write(
  "<br>Encoding: <br>",
  miTexto2.getMsg(),
  "->",
  miTexto2.encode() + "<br>"
);

document.write(
  "<br>Decoding: <br>",
  miTexto3.getMsg(),
  "->",
  miTexto3.decode() + "<br>"
);
