import JsRect from "./JsRect";
import JsPoint from "./JsPoint";

export const MouseEvent = {
    NONE:-1,
    DOWN:0,
    MOVE:1,
    UP:2,
    DBLCLICK:3,
};

export default {
    addEventListener:(c)=>{
        if (c){
            c.addEventListener('mousedown', handleMouseDown);
            c.addEventListener('mousemove', handleMouseMove);
            c.addEventListener('mouseup', handleMouseUp);
            c.addEventListener('mouseout', handleMouseOut);
            c.addEventListener('dblclick',doubleClick);
        }
    },
    removeEventListener:(c)=>{
        if (c){
            c.removeEventListener('mousedown', handleMouseDown);
            c.removeEventListener('mousemove', handleMouseMove);
            c.removeEventListener('mouseup', handleMouseUp);
            c.removeEventListener('mouseout', handleMouseOut);
            c.removeEventListener('dblclick',doubleClick);
        }
        dataRects.length = 0;
    },
    setDataRects:(width,config)=>{
        dataRects.length = 0;
        for (let i = 0;i < config.count;i++){
            dataRects.push(config.ctrlRect(width,i));
        }
    },
    setCallback:(c)=>{
        callback = c;
    },
};

let isDraging = false;

const dataRects = [];

let targetDataRectIndex = -1;

const currentEventRect = new JsRect();

const downJsPoint = new JsPoint();

const moveJsPoint = new JsPoint();

let callback;

const handleMouseDown = (e)=>{
    e.preventDefault();
    const {offsetX,offsetY,} = e;
    // currentEventRect.setEmpty();
    downJsPoint.setEmpty();
    moveJsPoint.setEmpty();
    for (let i = 0,len = dataRects.length;i < len;i++){
        let rect = dataRects[i];
        if (rect.contains(offsetX,offsetY)){
            targetDataRectIndex = i;
            downJsPoint.set(offsetX,offsetY);
            callback && callback({event:MouseEvent.DOWN});
            isDraging = true;
            break;
        }
    }
};

const handleMouseMove = (e)=>{
    e.preventDefault();
    if (isDraging){
        const {offsetX,offsetY,} = e;
        if (dataRects[targetDataRectIndex].contains(offsetX,offsetY)){
            moveJsPoint.set(offsetX,offsetY);
            currentEventRect.fill(downJsPoint,moveJsPoint);
            callback && callback({
                event:MouseEvent.MOVE,
                currentRect:currentEventRect,
                targetIndex:targetDataRectIndex});
        }
    }
};

const handleMouseUp = (e)=>{
    e.preventDefault();
    callback && callback({
        event:MouseEvent.UP,
        currentRect:currentEventRect,
        targetIndex:targetDataRectIndex});
    isDraging = false;
    // targetDataRectIndex = -1;
};

const handleMouseOut = (e)=>{
    // handleMouseUp(e);
};

const doubleClick = (e)=>{
    e.preventDefault();
    const {offsetX,offsetY,} = e;
    if (currentEventRect.containsX(offsetX) && dataRects[targetDataRectIndex].containsY(offsetY)){
        currentEventRect.setEmpty();
        callback && callback({
            event:MouseEvent.DBLCLICK,
            currentRect:currentEventRect,});
    }
};



