class Arduino{
    constructor(){
        this.json = "test";
    }

    setJson(pJson){
        this.json = pJson;
    }

    getJson(){
        return this.json;
    }
}

module.exports = Arduino;