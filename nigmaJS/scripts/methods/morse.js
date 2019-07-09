class morse extends Nigma {

    constructor(message,encoded){
      const alphabet = {  
        "-----":"0",
        ".----":"1",
        "..---":"2",
        "...--":"3",
        "....-":"4",
        ".....":"5",
        "-....":"6",
        "--...":"7",
        "---..":"8",
        "----.":"9",
        ".-":"a",
        "-...":"b",
        "-.-.":"c",
        "-..":"d",
        ".":"e",
        "..-.":"f",
        "--.":"g",
        "....":"h",
        "..":"i",
        ".---":"j",
        "-.-":"k",
        ".-..":"l",
        "--":"m",
        "-.":"n",
        "---":"o",
        ".--.":"p",
        "--.-":"q",
        ".-.":"r",
        "...":"s",
        "-":"t",
        "..-":"u",
        "...-":"v",
        ".--":"w",
        "-..-":"x",
        "-.--":"y",
        "--..":"z",
        "/":" ",
        "-·-·--":"!",
        "·-·-·-":".",
        "--··--":","
      };
      super (message,encoded,"morse", "", alphabet); 
      //Parametros: message,encoded,method,key,alphabet
      //WE have no key but we do have an alphabet
      //this.decode.bind(this);
      //console.log("constuctor",this);
    }
        
    decode = () => {
      let messageConverted = [];

      if (this.encoded===true){
        console.log("Decoding...",this.alphabet);
        let tempAlphabet = this.alphabet;  
        this.message.split("   ").map(
          function (word) {
            word.split(" ").map(
              function (letter) {
                messageConverted.push(tempAlphabet[letter]);
            });
            messageConverted.push(" ");
        });
        console.log("Done");
      }
      return messageConverted;
    }

    encode = () => {
      //console.log("Encoding...",this);
      let originalMessage = "";
      let encodedMessage ="";
      if (this.encoded===false){
        //console.log("ok");
        originalMessage = this.message.toLowerCase().replace(/[^a-z]/g, "");
        let temp = originalMessage.split("");
        temp.forEach(element => {
          let encodedChar = this.getKeyByValue(this.alphabet,element);
          encodedMessage+=encodedChar;
          console.log("Conversion: ",element, encodedChar);
        });        
      }
      return encodedMessage;
    }
}

//const miMorse = new morse(".-- --- .-. -..   .-- --- .-. -..",true);
const miMorse = new morse("Codificar esta frase 1234 @1",false);
console.log("Encoded: ",miMorse.encode());
miMorse.setMsg("Cambie el mensaje");
console.log("Encoded: ",miMorse.encode());
//console.log("call method:",miMorse.getMsg());
//document.write(miMorse.decode());

