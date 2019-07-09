class Nigma {
    
    constructor(message,encoded,method,key,alphabet){
        this.message = message;
        this.encoded = encoded; 
        this.method = method;
        this.key = key||"";
        this.alphabet = alphabet || [];
    }
    //GETs
    getMsg(){
        return this.message;
    }

    getEncoded(){
        return this.encoded;
    }

    getMethod(){
        return this.method;
    }

    getKey(){
        return this.key;
    }

    getAlphabet(){
        return this.alphabet;
    }

    //SETs
    setMsg(newMessage){
        return this.message=newMessage;
    }

    setEncoded(newEncoded){
        return this.encoded=newEncoded;
    }

    setMethod(newMethod){
        return this.method=newMethod;
    }

    setKey(newKey){
        return this.key=newKey;
    }
   
    setAlphabet(newAlphabet){
        return this.alphabet=newAlphabet;
    }

    //Aux methods

    test (){
        return "nigma enabled";
    }

    getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
        /*  
            const map = {"first" : "1", "second" : "2"};
            console.log(getKeyByValue(map,"2"));
        */
    }
}