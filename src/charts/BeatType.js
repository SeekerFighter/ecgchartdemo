export default class BeatType {
    constructor(time, type, index1, index2) {
        this.timestamp = time;
        this.type = type;
        this.index1 = index1;
        this.index2 = index2;
    }

    toString(){
        return JSON.stringify(this);
    }
};

BeatType.prototype.key = function () {
    return `${this.index1}-${this.index2}-${this.timestamp}-${this.type}`;
};

BeatType.prototype.fill = function (obj) {
    for (let key in this){
        if (obj.hasOwnProperty(key)){
            this[key] = obj[key];
        }
    }
};