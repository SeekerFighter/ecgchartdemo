import JsPoint from "./JsPoint";

const MouseEvent = {
    NONE:-1,
    DOWN:0,
    MOVE:1,
    UP:2,
    DBLCLICK: 3,
    CLICK:4,
    MOVING_UP:5,
    CANCEL:6,
};

const defaultOptions = {
    canvas: null,
    onClick: (clickPoint)=>{
        console.log(`onClick()called:${clickPoint.toString()}`);
    },
    onDBLClick: (clickPoint)=>{
        console.log(`onDBLClick()called:${clickPoint.toString()}`);
    },
    onMove: (startPoint,endPoint)=>{
        console.log(`onMove()called:startPoint = [${startPoint.toString()}],endPoint = [${endPoint.toString()}]`);
    },
    onEvent:(mouseEvent,point)=>{
        console.log(`onEvent()called:mouseEvent = ${mouseEvent},point = ${point.toString()}`);
    },
};

const fillOptions = (defaults,args)=>{
    const option = {};
    for (let key in defaults){
        option[key] = args[key] || defaults[key]
    }
    return option;
};

export default class CanvasTouchListener {

    constructor(options) {
        this.options = fillOptions(defaultOptions,arguments[0]);
        this.bindListener = this.bindListener.bind(this);
        this.unBindListener = this.unBindListener.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseCancel = this.onMouseCancel.bind(this);
        this.reject = this.reject.bind(this);
        this.invokeClick = this.invokeClick.bind(this);
        this.clear = this.clear.bind(this);
        this.onWindowMouseUp = this.onWindowMouseUp.bind(this);
        this.onWindowMouseDown = this.onWindowMouseDown.bind(this);
        this.downPoint = new JsPoint();
        this.endPoint = new JsPoint();
        this.performClick = null;
        this.mouseEvent = MouseEvent.NONE;
        this.isWindowDown = false;

    }

    bindListener(){
        const canvas = this.options.canvas;
        if (canvas){
            canvas.addEventListener('mousedown', this.onMouseDown);
            canvas.addEventListener('mousemove', this.onMouseMove);
            canvas.addEventListener('mouseup', this.onMouseUp);
            canvas.addEventListener('mouseout', this.onMouseCancel);
            window.addEventListener('mousedown', this.onWindowMouseDown);
            window.addEventListener('mouseup',this.onWindowMouseUp);
        }
    }

    unBindListener(){
        const canvas = this.options.canvas;
        if (canvas){
            canvas.removeEventListener('mousedown', this.onMouseDown);
            canvas.removeEventListener('mousemove', this.onMouseMove);
            canvas.removeEventListener('mouseup', this.onMouseUp);
            canvas.removeEventListener('mouseout', this.onMouseCancel);
            window.removeEventListener('mousedown', this.onWindowMouseDown);
            window.removeEventListener('mouseup',this.onWindowMouseUp);
        }
    }

    onMouseDown(e){
        this.reject(e);
        const {canvas,onEvent} = this.options;
        if (canvas){
            this.mouseEvent = MouseEvent.DOWN;
            const {offsetX,offsetY,} = e;
            this.downPoint.set(offsetX,offsetY);
            onEvent && onEvent(this.mouseEvent,this.downPoint);
        }
    }

    onMouseUp(e){
        this.reject(e);
        const {canvas,onEvent} = this.options;
        if (canvas){
            if (this.mouseEvent === MouseEvent.DOWN){
                if (this.performClick){
                    this.mouseEvent = MouseEvent.UP;
                    this.invokeClick(true);
                    return;
                }
                if (this.mouseEvent === MouseEvent.DOWN){
                    this.mouseEvent = MouseEvent.UP;
                    this.performClick = setTimeout(this.invokeClick,250);
                    return;
                }
            }else {
                this.mouseEvent = MouseEvent.MOVING_UP;
            }
            onEvent && onEvent(this.mouseEvent,this.downPoint,this.endPoint);
            this.downPoint.setEmpty();
            this.endPoint.setEmpty();
        }
    }

    onMouseMove(e){
        this.reject(e);
        const {canvas,onEvent} = this.options;
        if (canvas){
            const {offsetX,offsetY,} = e;
            this.endPoint.set(offsetX,offsetY);
            if ((this.mouseEvent === MouseEvent.MOVE || this.mouseEvent === MouseEvent.DOWN) && this.downPoint.isMoving(this.endPoint)){
                this.mouseEvent = MouseEvent.MOVE;
                this.clear();
                const onMove = this.options.onMove;
                if (onMove){
                    onMove(this.downPoint,this.endPoint);
                }
                onEvent && onEvent(this.mouseEvent);
            }else {
                this.endPoint.setEmpty();
            }
        }
    }

    onMouseCancel(e){
        this.reject(e);
        const canvas = this.options.canvas;
        if (canvas){

        }
    }

    onWindowMouseDown(e){
        this.reject(e);
        this.isWindowDown = true;
    }

    onWindowMouseUp(e){
        this.reject(e);
        const {canvas,onEvent} = this.options;
        if (canvas){
            if (this.isWindowDown){
                this.isWindowDown = false;
                return;
            }
            this.mouseEvent = MouseEvent.CANCEL;
            onEvent && onEvent(this.mouseEvent);
            this.downPoint.setEmpty();
            this.endPoint.setEmpty();
        }
    }


    reject(e){
        e.stopPropagation();
        e.preventDefault();
    };

    invokeClick(dbl = false){
        this.clear();
        const {onClick,onDBLClick} = this.options;
        if (dbl){
            onDBLClick && onDBLClick(this.downPoint);
        }else {
            onClick && onClick(this.downPoint);
        }
        const {onEvent} = this.options;
        onEvent && onEvent(this.mouseEvent,this.downPoint,this.endPoint);
        this.downPoint.setEmpty();
    }

    clear(){
        if (this.performClick){
            clearTimeout(this.performClick);
            this.performClick = null;
        }
    }
}

export {MouseEvent};
