import React, {Component} from 'react';
import PropTypes from 'prop-types'
import chartDrawer from './ChartDrawer';
import domSizeListener from './DomSizeListener';
import './ChartStyle.css'
import JsRect from "./JsRect";
import ECGChartViewTouchListener from "./ECGChartViewTouchListener";
import {MouseEvent} from "./CanvasTouchListener";

const PagerMinutes = 1;//一页显示几分钟的数据

const LayoutParams = {
    MATCH_PARENT: -1,
    WRAP_CONTENT: -2,
};

const MeasureSpec = {
    EXACTLY: 0,
    ADAPT_PARENT: 1,
    ADAPT_CONTENT: 2
};

const defaultColorStyle = function (type) {
    switch (type) {
        case 'N':return '#333';
        case 'RonT':return '#FF9900';
        case 'X':return '#528B8B';
        case 'S':case 'P':return '#800080';
        case 'V':case '?':case 'Ve':case 'Se':case 'Je':return '#FF0000';
        default:return '#333';
    }
};

const defaultDrawParams = {
    markAnno:true,
    resistDrift:true,
    resistDisturb:true,
};

const defaultLayoutParams = {
    width: LayoutParams.MATCH_PARENT,
    height: LayoutParams.WRAP_CONTENT,
};

const MaxMV = 1.25;

const defaultChartConfig = {
    ecgLineColor: '#000000',
    ecgLineWidth: 1,
    backGridLineOutColor: '#A5C7DF',
    backGridLineOutWidth: 1,
    backGridLineInnerWidth: 0.5,
    backGridLineInnerColor: '#DCDCDC',
    maxMV: MaxMV,
    pixelPerCell: 3,
    yOutCellCount: 6,
    yCellCountPerMV: 10,
    xPointCountPerCell: 10,
    xMaxPointCount: 3750,//一行15秒的数据
    space: 15,
    count: 4*PagerMinutes,
    drawBack: true,
    drawNoiseBlock:true,
    colorStyle:defaultColorStyle,
    noiseBlockColor:'#ccd6eb',
    ctrlOutCellWidth: function () {
        return this.pixelPerCell * 5 + this.backGridLineInnerWidth * 4 + this.backGridLineOutWidth;
    },
    ctrlRect: function (canvasWidth,index,offsetLeft) {
        let left = this.backGridLineOutWidth + (offsetLeft || 0);
        let right = canvasWidth - this.backGridLineOutWidth;
        let singleHeight = this.yOutCellCount * this.ctrlOutCellWidth() + this.backGridLineOutWidth;
        let top = Math.round((singleHeight + this.space) * index + this.backGridLineOutWidth);
        let bottom = top + singleHeight - this.backGridLineOutWidth * 2;
        return new JsRect(left,top,right,bottom);
    },
    ctrlVisiblePort: function (top,bottom) {
        return new JsRect(0,top?top:this.maxMV,this.xMaxPointCount,bottom?bottom:-this.maxMV);
    },
    ctrlDuration:function () {
        return Math.ceil(this.xMaxPointCount / 250 * 1000);
    },
    ctrlTimeSeriesVisiblePort:function (jsRect,timeStart,timeEnd) {
        return new JsRect(timeStart,jsRect.top,(timeEnd||this.ctrlDuration())+timeStart,jsRect.bottom);
    }
};

CanvasRenderingContext2D.prototype.draw = function (drawFun,...args) {
    this.save();
    this.beginPath();
    let result = drawFun(this,...args);
    this.stroke();
    this.restore();
    return result;
};

CanvasRenderingContext2D.prototype.getPixelRatio = function () {
    let backingStore = this.backingStorePixelRatio ||
        this.webkitBackingStorePixelRatio ||
        this.mozBackingStorePixelRatio ||
        this.msBackingStorePixelRatio ||
        this.oBackingStorePixelRatio ||
        this.backingStorePixelRatio || 1;
    return (window.devicePixelRatio || 1) / backingStore;
};

HTMLCanvasElement.prototype.getStyleSize = function () {
    const sWidth = this.style.width.replace('px','');
    const sHeight = this.style.height.replace('px','');
    return {sWidth,sHeight};
};

HTMLCanvasElement.prototype.adaptSize = function (w,h) {
    let context = this.getContext('2d');
    let ratio = context.getPixelRatio();
    this.style.width = w + 'px';
    this.style.height= h + 'px';
    this.width = w * ratio;
    this.height = h * ratio;
    context.scale(ratio,ratio);
};

const merge = (target,src)=>{
    for (let key in src){
        if (target.hasOwnProperty(key)){
            target[key] = src[key];
        }
    }
    return target;
};

class ECGChartView extends Component {

    static config = {
        ecgLineColor: PropTypes.string,//心电图线的颜色
        ecgLineWidth: PropTypes.number,//心电图线宽
        backGridLineOutWidth: PropTypes.number,//背景格外围线宽
        backGridLineOutColor: PropTypes.string,//背景格外围线的颜色
        backGridLineInnerWidth: PropTypes.number,//背景格内部线宽
        backGridLineInnerColor: PropTypes.string,//背景格内部线的颜色
        maxMV: PropTypes.number,//纵向表示心电数据最大毫伏数(上下正负：-maxMV -->  maxMV)
        pixelPerCell: PropTypes.number,//每个小格包含几个像素
        yOutCellCount: PropTypes.number,//纵向(y)包含几个大格子，每个大格子固定包含5个小格子
        yCellCountPerMV: PropTypes.number,//纵向1mv包含几个小格子
        xPointCountPerCell: PropTypes.number,//横向一小格包含几个点
        xMaxPointCount: PropTypes.number,//横向最多显示多少个点
        space: PropTypes.number,//心电图直接间距
        count: PropTypes.number,//心电图个数
        ctrlRect: PropTypes.func,//计算绘制区域大小
        ctrlOutCellWidth: PropTypes.func,//精确计算外围一个网格大小
        ctrlVisiblePort: PropTypes.func,//可视区域计算
        drawBack: PropTypes.bool,//是否绘制背景网格线
        drawNoiseBlock:PropTypes.bool,//是否绘制噪音块
        colorStyle:PropTypes.func,//心搏标注绘制颜色
        ctrlDuration:PropTypes.func,//计算一行显示多少时间
        noiseBlockColor:PropTypes.string,//噪音快颜色
        ctrlTimeSeriesVisiblePort:PropTypes.func,//根据时序计算可视区域
    };

    static data = {
        currentPage:PropTypes.number,//当前页数
        ecgData:PropTypes.array,//心电数据
        annoData:PropTypes.array,//心博数据
        fragData:PropTypes.array,//段异常数据
        noiseData:PropTypes.array,//噪音数据
        pointStart:PropTypes.array,//每行数据开始时间戳
    };

    static drawParams = {
        markAnno:PropTypes.bool,//是否标记心博
        resistDrift:PropTypes.bool,//是否抗漂移
        resistDisturb:PropTypes.bool,//是否抗干扰
    };

    static propTypes = {
        chartStyle: PropTypes.object,
        layoutParams:PropTypes.object,
        config: PropTypes.object,
        data: PropTypes.object,
        drawParams:PropTypes.object,
        pagerChanger:PropTypes.bool
    };

    static layoutParams = {
        width: PropTypes.number,
        height: PropTypes.number,
    };

    static defaultProps = {
        chartStyle:{},
        layoutParams:defaultLayoutParams,
        config: defaultChartConfig,
        data: {},
        drawParams:defaultDrawParams
    };

    constructor() {
        super(...arguments);
        const layoutParams = this.props.layoutParams || defaultDrawParams;
        let wMode = MeasureSpec.EXACTLY, hMode = MeasureSpec.EXACTLY;
        if (layoutParams.width === LayoutParams.MATCH_PARENT) {
            wMode = MeasureSpec.ADAPT_PARENT;
        } else if (layoutParams.width === LayoutParams.WRAP_CONTENT) {
            wMode = MeasureSpec.ADAPT_CONTENT;
        }
        if (layoutParams.height === LayoutParams.MATCH_PARENT) {
            hMode = MeasureSpec.ADAPT_PARENT;
        } else if (layoutParams.height === LayoutParams.WRAP_CONTENT) {
            hMode = MeasureSpec.ADAPT_CONTENT;
        }
        this.state = {
            widthMode: wMode,
            heightMode: hMode,
            data: this.props.data||{},
            drawParams:merge(defaultDrawParams,this.props.drawParams),
            config:merge(defaultChartConfig,this.props.config),
            chartStyle:this.props.chartStyle||{},
            selectedJsRectObj:{
                currentRect:new JsRect(),
                targetIndex:-1},
        };
        this.checkBind = this.checkBind.bind(this);
        this.listenerCallback = this.listenerCallback.bind(this);
        this.adaptCanvasLayout = this.adaptCanvasLayout.bind(this);
        this.adaptWidth = this.adaptWidth.bind(this);
        this.adaptHeight = this.adaptHeight.bind(this);
        this.setSelectedJsRectObj = this.setSelectedJsRectObj.bind(this);
        this.onAnnoMarkClick = this.onAnnoMarkClick.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        let samePager = this.state.data.currentPage === nextProps.data.currentPage;
        console.log(`componentWillReceiveProps()called:samePager = ${samePager}`);
        this.setState(((state,props)=>{
            return {
                data:props.data||{},
                drawParams:{...defaultDrawParams,...props.drawParams},
                config:{...defaultChartConfig,...props.config},
                chartStyle:props.chartStyle||{},
                selectedJsRectObj:samePager?state.selectedJsRectObj:{currentRect:new JsRect(),targetIndex:-1}
            };
        })(this.state,nextProps),()=>{
            this.adaptCanvasLayout(false,!samePager);
        });
    }

    componentDidMount() {
        console.log(`componentDidMount()called....`);
        const {chartCanvas, chartParent} = this;
        if (chartCanvas) {
            ECGChartViewTouchListener.addEventListener(chartCanvas);
            ECGChartViewTouchListener.setCallback(this.listenerCallback);
            if (this.checkBind() && chartParent) {
                domSizeListener.bind(chartParent, this.adaptCanvasLayout);
            }
            this.adaptCanvasLayout(true);
        }
    }

    componentWillUnmount() {
        console.log(`componentWillUnmount()called....`);
        const {chartCanvas, chartParent} = this;
        if (chartCanvas){
            ECGChartViewTouchListener.removeEventListener();
        }
        if (chartCanvas && chartParent && this.checkBind()) {
            domSizeListener.remove(chartParent);
            domSizeListener.clear();
        }
        chartDrawer.delVisitedAnnoData(-1,true);
    }

    listenerCallback(obj){
        const {chartCanvas} = this;
        switch (obj.event) {
            case MouseEvent.DOWN:
                chartDrawer.cutSurfaceImage(chartCanvas);
                break;
            case MouseEvent.MOVE:
                this.setSelectedJsRectObj(obj,chartDrawer.drawSelectedJsRect,chartCanvas,this.state.selectedJsRectObj);
                break;
            case MouseEvent.DBLCLICK:
                chartDrawer.delVisitedAnnoData(obj.preTargetDataRectIndex);
                this.setSelectedJsRectObj(obj,this.adaptCanvasLayout,false);
                break;
            case MouseEvent.MOVING_UP:
                this.adaptCanvasLayout(false);
                break;
            case MouseEvent.CLICK:
                break;
            default:break;
        }
    };

    //心搏标注点击回调
    onAnnoMarkClick(ele,beatType){
        this.setSelectedJsRectObj(null,this.adaptCanvasLayout,false);
    }

    setSelectedJsRectObj(obj,func,...funcArgs){
        this.setState(((state,rectObj)=>{
            if (obj){
                return {
                    selectedJsRectObj:{
                        currentRect:state.selectedJsRectObj.currentRect.copy(rectObj.currentRect),
                        targetIndex:rectObj.targetIndex,
                    },
                };
            }
            return {
                selectedJsRectObj:{
                    currentRect:state.selectedJsRectObj.currentRect.setEmpty(),
                    targetIndex:-1,
                },
            };
        })(this.state,obj),()=>{
            func(...funcArgs);
        });
    }

    checkBind() {
        return this.state.widthMode === MeasureSpec.ADAPT_PARENT || this.state.heightMode === MeasureSpec.ADAPT_PARENT;
    };

    adaptCanvasLayout(needScale = true,needClearVisited = false) {
        console.log(`adaptCanvasLayout()called,needScale = ${needScale},needClearVisited = ${needClearVisited}`);
        const {chartCanvas,chartParent} = this;
        if (chartCanvas.getContext('2d')){
            const {config,drawParams,data} = this.state;
            if (needScale){
                const {sWidth} = chartCanvas.getStyleSize();
                let width = this.adaptWidth();
                let height = this.adaptHeight();
                chartCanvas.adaptSize(width,height);
                ECGChartViewTouchListener.setDataRects(width,config);
                let s = parseFloat(width/sWidth).toFixed(2);
                this.setState(((state,scale)=>{
                    return {
                        selectedJsRectObj:{
                            currentRect:state.selectedJsRectObj.currentRect.scale(scale),
                            targetIndex:state.selectedJsRectObj.targetIndex,
                        },
                    };
                })(this.state,s),()=>{
                    ECGChartViewTouchListener.currentEventRectScale(s);
                    chartDrawer.draw(chartParent,chartCanvas,drawParams,config,data,this.state.selectedJsRectObj,needClearVisited,this.onAnnoMarkClick);
                });
            }else {
                chartDrawer.draw(chartParent,chartCanvas,drawParams,config,data,this.state.selectedJsRectObj,needClearVisited,this.onAnnoMarkClick);
            }
        }
    }

    adaptWidth() {
        const {chartCanvas, chartParent} = this;
        let config = this.state.config;
        const {backGridLineOutWidth, xMaxPointCount, xPointCountPerCell} = config;
        let width = chartCanvas.width;
        let outCellSize = config.ctrlOutCellWidth();
        if (this.state.widthMode === MeasureSpec.ADAPT_PARENT) {
            let parentWidth = chartParent.clientWidth;
            let xOutCellCount = Math.ceil((parentWidth - backGridLineOutWidth) / outCellSize)-2;
            width = xOutCellCount * outCellSize + backGridLineOutWidth;
        } else if (this.state.widthMode === MeasureSpec.ADAPT_CONTENT) {
            let xCellCount = Math.ceil(xMaxPointCount / xPointCountPerCell);
            let xOutCellCount = Math.ceil(xCellCount / 5);
            width = xOutCellCount * outCellSize + backGridLineOutWidth;
        }
        return width;
    }

    adaptHeight() {
        let config = this.state.config;
        const {backGridLineOutWidth, yOutCellCount, count, space} = config;
        let height = yOutCellCount * config.ctrlOutCellWidth() + backGridLineOutWidth;
        height = height * count + (count - 1) * space;
        return height;
    }

    render() {
        const {width, height} = this.props;
        const chartStyle = this.state.chartStyle;
        return (
            <div id={'chartParent'} className={'chartParent'}  style={chartStyle} ref={(r) => {
                this.chartParent = r
            }}>
                <canvas id={'chartCanvas'} className={'chartCanvas'} width={width} height={height}  ref={(r) => {
                    this.chartCanvas = r
                }}>
                    您的浏览器不支持canvas，请更换浏览器.
                </canvas>
            </div>
        );
    }
}

export {ECGChartView,LayoutParams,MaxMV,PagerMinutes}