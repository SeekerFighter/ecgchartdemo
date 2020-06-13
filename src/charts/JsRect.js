export default function JsRect() {
    let len = (arguments||[]).length;
    this.left = len > 0?arguments[0]:0;
    this.top = len > 1?arguments[1]:0;
    this.right = len > 2?arguments[2]:0;
    this.bottom = len > 3?arguments[3]:0;
}

JsRect.prototype.copy = function(jsRect){
    this.left = jsRect.left;
    this.top = jsRect.top;
    this.right = jsRect.right;
    this.bottom = jsRect.bottom;
    return this;
};

JsRect.prototype.fill = function(jsPoint1,jsPoint2){
    this.left = Math.min(jsPoint1.x,jsPoint2.x);
    this.top = Math.min(jsPoint1.y,jsPoint2.y);
    this.right = Math.max(jsPoint1.x,jsPoint2.x);
    this.bottom = Math.max(jsPoint1.y,jsPoint2.y);
    return this;
};

JsRect.prototype.width = function(){
    return this.right - this.left;
};

JsRect.prototype.height = function(){
    return this.bottom - this.top;
};

JsRect.prototype.isEmpty = function(){
    return this.left >= this.right || this.top >= this.bottom;
};

JsRect.prototype.centerX = function(){
    return (this.left+this.right) >> 1;
};

JsRect.prototype.centerY = function(){
    return (this.top+this.bottom) >> 1;
};

JsRect.prototype.contains = function(x,y){
    return this.left < this.right && this.top < this.bottom  // check for empty first
        && x >= this.left && x < this.right && y >= this.top && y < this.bottom;
};

JsRect.prototype.containPoint = function(jsPoint){
    return this.left < this.right && this.top < this.bottom  // check for empty first
        && jsPoint.x >= this.left && jsPoint.x < this.right && jsPoint.y >= this.top && jsPoint.y < this.bottom;
};

JsRect.prototype.containsX = function(x){
    return this.left < this.right  // check for empty first
        && x >= this.left && x < this.right;
};

JsRect.prototype.containsY = function(y){
    return this.top < this.bottom  // check for empty first
        && y >= this.top && y < this.bottom;
};

JsRect.prototype.transform = function(left,top,right,bottom){
    this.left += left;
    this.top += top;
    this.right += right;
    this.bottom += bottom;
    return this;
};

JsRect.prototype.setEmpty = function(){
    this.left = this.top = this.right = this.bottom = 0;
    return this;
};

JsRect.prototype.toString = function(){
    return `JsRect:left=${this.left},top=${this.top},right=${this.right},bottom=${this.bottom}`;
};

//只是水平方向做缩放功能
JsRect.prototype.scale = function (scale) {
    this.left = this.left * scale;
    this.right = this.right * scale;
    return this;
};

JsRect.prototype.xywh = function(){
    return [this.left,this.top,this.right - this.left,this.bottom-this.top];
};