class claseMatematica {
    
    constructor(x,y){
        this.x = x;
        this.y = y;
    }

    producto (){
        return this.x * this.y;
    }
    suma (){
        return this.x + this.y;
    }
    resta(){
        return this.x - this.y;
    }
    division(){
        return this.x / this.y;
    }
}

var binomio = new claseMatematica(3,4);

document.write("suma: "+ binomio.suma());
document.write("resta: "+ binomio.resta());
document.write("producto: "+ binomio.producto());
document.write("division: "+ binomio.division());