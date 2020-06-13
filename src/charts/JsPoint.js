export default function JsPoint() {
    let len = (arguments||[]).length;
    this.x = len > 0?arguments[0]:-1;
    this.y = len > 1?arguments[1]:-1;
}

JsPoint.prototype.set = function (x,y) {
    this.x = x;
    this.y = y;
};

JsPoint.prototype.setEmpty = function () {
    this.x = this.y = -1;
};

JsPoint.prototype.toString = function () {
    return `JsPoint:x = ${this.x},y = ${this.y}`;
};

JsPoint.prototype.isEmpty = function () {
    return this.x === -1 && this.y === -1;
};

JsPoint.prototype.isMoving = function (point) {
    return Math.abs(this.x - point.x) > 5 || Math.abs(this.y - point.y) > 5;
};