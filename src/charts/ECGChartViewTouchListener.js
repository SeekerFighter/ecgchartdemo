import CanvasTouchListener, {MouseEvent} from "./CanvasTouchListener";
import JsRect from "./JsRect";

export default {
    addEventListener:(canvas)=>{
        canvasTouchListener = new CanvasTouchListener({
            canvas:canvas,
            onClick:onClick,
            onDBLClick:onDBLClick,
            onMove:onMove,
            onEvent:onEvent});
        canvasTouchListener.bindListener();
    },
    removeEventListener:()=>{
        canvasTouchListener && canvasTouchListener.unBindListener();
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
    currentEventRectScale:(scale)=>{
        currentEventRect.scale(scale);
    }
}

let canvasTouchListener;

const currentEventRect = new JsRect();

const dataRects = [];

let callback;

let targetDataRectIndex = -1;

let preTargetDataRectIndex = -1;

const onClick = (point)=>{
    let index = targetDataRect(dataRects,point);
    if (index >= 0){
        callback && callback({event:MouseEvent.CLICK,clickPosition:point,targetIndex:index});
    }
};

const onDBLClick = (point)=>{
    if (currentEventRect.containsX(point.x) && dataRects[preTargetDataRectIndex].containsY(point.y)){
        clearBand();
    }
};

const onMove = (point1,point2)=>{
    if (point1.isEmpty()){

    }else {
        if (targetDataRectIndex < 0){
            targetDataRectIndex = targetDataRect(dataRects,point1);
        }
        if (targetDataRectIndex >= 0){
            preTargetDataRectIndex = targetDataRectIndex;
            if (dataRects[targetDataRectIndex].containPoint(point2)){
                currentEventRect.fill(point1,point2);
                callback && callback({
                    event:MouseEvent.MOVE,
                    currentRect:currentEventRect,
                    targetIndex:targetDataRectIndex});
            }
        }
    }
};

const onEvent = (event,point1,point2)=>{
    if (event === MouseEvent.DOWN){
        callback && callback({event:MouseEvent.DOWN});
    }else if (event === MouseEvent.MOVING_UP){
        callback && callback({
            event:MouseEvent.MOVING_UP,
            currentRect:currentEventRect,
            targetIndex:targetDataRectIndex});
        targetDataRectIndex = -1;
    }else if (event === MouseEvent.CANCEL){
        clearBand();
    }
};

const targetDataRect = (dataRects,point)=>{
    let targetIndex = -1;
    for (let i = 0,len = dataRects.length;i < len;i++){
        let rect = dataRects[i];
        if (rect.containPoint(point)){
            targetIndex = i;
            break;
        }
    }
    return targetIndex;
};

const clearBand = ()=>{
    currentEventRect.setEmpty();
    targetDataRectIndex = -1;
    callback && callback({
        event:MouseEvent.DBLCLICK,
        currentRect:currentEventRect,
        targetIndex:-1,
        preTargetDataRectIndex:preTargetDataRectIndex});
    preTargetDataRectIndex = -1;
};