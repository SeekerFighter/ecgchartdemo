import {calDataCoor, calNoiseRect, calAnnoCoor, contain, calResistDriftAxis} from "./CoorComputor";
import BeatType from "./BeatType";

let drawingSurfaceImageData;

const visitedBeatTypeMap = new Map();

const beatTypeWidthMap = new Map();

export default {
    draw: (parent,canvas,drawParams,config,data,selectedJsRectObj,needClearVisited,onAnnoMarkClick) => {
        if (!canvas){
            return;
        }
        removeAllTextElement();
        if (needClearVisited){
            visitedBeatTypeMap.clear();
        }
        let ctx = canvas.getContext('2d');
        const {sWidth,sHeight} = canvas.getStyleSize();
        ctx.clearRect(0,0,sWidth,sHeight);
        if (ctx && config) {
            const {count,colorStyle,drawBack,drawNoiseBlock} = config;
            const {markAnno,resistDrift,resistDisturb} = drawParams;
            const {ecgData,annoData,noiseData,pointStart} = data;
            let dataLen = ecgData?ecgData.length:0;
            let annoLen = annoData?annoData.length:0;
            let outCellSize = config.ctrlOutCellWidth() >> 1;
            if (drawNoiseBlock){
                ctx.draw(drawNoise,noiseData,pointStart||[],config,sWidth);
            }
            let selectedJsRect = ctx.draw(_drawSelectedJsRect,selectedJsRectObj,false,config,sWidth);
            let axisY;
            if (!resistDrift){
                axisY = calResistDriftAxis(ecgData,config.yOutCellCount);
                ctx.draw(drawAxisY,sWidth,sHeight);
            }
            for (let i = 0; i < count; i++) {
                let jsRect = config.ctrlRect(sWidth,i);
                if (drawBack){
                    drawBackGrid(ctx, config, jsRect);
                }
                jsRect.transform(outCellSize,0,-outCellSize,0);
                let abnormals;
                if (markAnno && i < annoLen){
                    let result = ctx.draw(drawAnno,jsRect,annoData[i],pointStart[i],config,colorStyle,i,selectedJsRect,parent,onAnnoMarkClick);
                    abnormals = result.abnormals;
                }
                if (i < dataLen){
                    drawData(ctx,config,jsRect,ecgData[i],abnormals||[],axisY&&axisY[i]);
                }
            }
        }
    },
    cutSurfaceImage:(canvas)=>{
        drawingSurfaceImageData = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);
    },
    drawSelectedJsRect:(canvas,jsRectObj)=>{
        canvas.getContext('2d').draw(_drawSelectedJsRect,jsRectObj,true);
    },
    getVisitedAnnoData:()=>{
        return visitedBeatTypeMap;
    },
    delVisitedAnnoData:(index,clear)=>{
        if (clear){
            visitedBeatTypeMap.clear();
            return;
        }
        let prefix = `${index}-`;
        for (let [key,value] of visitedBeatTypeMap){
            if (key.slice(0, prefix.length) === prefix){
                visitedBeatTypeMap.delete(key);
            }
        }
    }
};

const drawBackGrid = (ctx, config, jsRect)=>{
    const outSize = config.ctrlOutCellWidth();
    ctx.draw(drawOutCell,config, jsRect,outSize);
    ctx.draw(drawInnerCell,config, jsRect,outSize);
    function drawOutCell(ctx, config, jsRect,outSize) {
        const {left, top, right, bottom} = jsRect;
        const {backGridLineOutWidth, backGridLineOutColor, yOutCellCount} = config;
        const xOutCount = Math.ceil((jsRect.width() - backGridLineOutWidth) / outSize);
        ctx.lineWidth = backGridLineOutWidth;
        ctx.strokeStyle = backGridLineOutColor;
        for (let i = 0; i < xOutCount + 1; i++) {
            let x = left + i * outSize;
            if (i === xOutCount) {
                x -= backGridLineOutWidth * 1.75;
            }
            ctx.moveTo(x, top);
            ctx.lineTo(x, bottom);
        }
        for (let i = 0; i < yOutCellCount + 1; i++) {
            let y = top + i * outSize;
            if (i === yOutCellCount) {
                y -= backGridLineOutWidth * 1.75;
            }
            ctx.moveTo(left, y);
            ctx.lineTo(right, y);
        }
    }
    function drawInnerCell(ctx, config, jsRect,outSize) {
        const {left, top, right, bottom} = jsRect;
        const {backGridLineOutWidth, backGridLineInnerWidth, backGridLineInnerColor, yOutCellCount} = config;
        const xOutCount = Math.ceil((jsRect.width() - backGridLineOutWidth) / outSize);
        const stickPixelPerCell = (outSize-backGridLineOutWidth - backGridLineInnerWidth*4)/5;
        ctx.lineWidth = backGridLineInnerWidth;
        ctx.strokeStyle = backGridLineInnerColor;
        for (let i = 0; i < xOutCount; i++) {
            let xOut = left + i * outSize + backGridLineOutWidth;
            for (let j = 1; j < 5; j++) {
                let xIn = xOut + stickPixelPerCell * j + backGridLineInnerWidth*(j-1);
                ctx.moveTo(xIn, top);
                ctx.lineTo(xIn, bottom)
            }
        }
        for (let i = 0; i < yOutCellCount; i++) {
            let yOut = top + i * outSize + backGridLineOutWidth;
            for (let j = 1; j < 5; j++) {
                let yIn = yOut + stickPixelPerCell * j + backGridLineInnerWidth*(j-1);
                ctx.moveTo(left, yIn);
                ctx.lineTo(right, yIn)
            }
        }
    }
};

const drawData = (ctx,config,jsRect,data,abnormals,axisY) => {
    if (data) {
        sliceDataWithAbn(data.length,abnormals,config.ecgLineColor).forEach((v,i)=>{
            let {start,end,color} = v;
            if (start !== end){
                ctx.draw(_drawData, config,jsRect,data,start,end,color,axisY);
            }
        });
    }
    function _drawData (ctx,config,jsRect,data,startIndex,endIndex,strokeColor,axisY) {
        const {ecgLineWidth,backGridLineOutWidth} = config;
        const {left, top, bottom} = jsRect;
        const centerY = jsRect.centerY();
        const visiblePort = config.ctrlVisiblePort(axisY&&axisY[1],axisY&&axisY[0]);
        const doubleOutWidth = backGridLineOutWidth << 1;
        ctx.lineWidth = ecgLineWidth;
        ctx.strokeStyle = strokeColor;
        let preCoor = [left,centerY];
        for (let i = startIndex; i < endIndex; i++) {
            let coor = calDataCoor(i, data[i], jsRect, visiblePort);
            if (coor[1] < top){
                if (preCoor[1] < top){
                    ctx.moveTo(coor[0],top+doubleOutWidth);
                }else if (preCoor[1] <= bottom){
                    ctx.lineTo(coor[0],top+doubleOutWidth);
                }else {
                    ctx.moveTo(preCoor[0],bottom-doubleOutWidth);
                    ctx.lineTo(coor[0],top+doubleOutWidth);
                }
            }else if (coor[1] > bottom){
                if (preCoor[1] > bottom){
                    ctx.moveTo(coor[0],bottom-doubleOutWidth);
                }else if (preCoor[1] >= top){
                    ctx.lineTo(coor[0],bottom-doubleOutWidth);
                }else {
                    ctx.moveTo(preCoor[0],top+doubleOutWidth);
                    ctx.lineTo(coor[0],bottom-doubleOutWidth);
                }
            }else {
                ctx.lineTo(...coor);
            }
            preCoor = coor;
        }
    }
    function sliceDataWithAbn (maxLen,abnormals,defaultColor){
        let start = 0;
        let slices = [];
        abnormals.forEach((v)=>{
            let min = Math.max(start,v.start);
            let max = Math.min(maxLen,v.end);
            slices.push({
                start:start,
                end:min,
                color:defaultColor,
            });
            slices.push({
                start:min,
                end:max,
                color:v.color,
            });
            start = max;
        });
        slices.push({
            start:start,
            end:maxLen,
            color:defaultColor,
        });
        return slices;
    }
};

const drawAnno = (ctx,jsRect,data,pointStart,config,colorStyle,index,selectedJsRect,container,onAnnoMarkClick)=>{
    let abnormals = [];
    if (data){
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let visiblePort = config.ctrlTimeSeriesVisiblePort(jsRect,pointStart);
        let prePosition = [0,0];
        data.forEach((item,i)=>{
            let color = colorStyle(item[1]);
            if (!beatTypeWidthMap.has(item[1])){
                let w = ctx.measureText(item[1]).width;
                w = Number(w.toFixed(0));
                beatTypeWidthMap.set(item[1],Math.max(w,15));
            }
            let textW = beatTypeWidthMap.get(item[1]);
            let position = calAnnoCoor(item[0],jsRect,visiblePort,-textW/2,5);
            let beatType = new BeatType(item[0],item[1],index,i);
            let element = createTextElement(item[1],beatType,onAnnoMarkClick,color,selectedJsRect.contains(...position)||visitedBeatTypeMap.has(beatType.key()),...position);
            container.appendChild(element);
            if (item[2]){
                ctx.font = '11px sans-serif';
                ctx.fillStyle = colorStyle('');
                let centerX = (position[0]+prePosition[0])>>1;
                ctx.fillText(item[2],centerX,jsRect.bottom-20);
                ctx.fillText(item[3],centerX,jsRect.bottom-8);
            }
            prePosition = position;
            if (item[1] !== 'N' && item[1] !== '?' && item[1] !== ''){
                let index = changeTimestampToIndex(pointStart,item[0]);
                abnormals.push({
                    start:index-50,
                    end:index+50,
                    color:color,
                });
            }
        });
    }
    return {abnormals};
};

const drawNoise = (ctx,noiseData,pointStarts,config,cWidth)=>{
    if (noiseData && pointStarts && pointStarts.length > 0){
        let pagerStart = pointStarts[0];
        let pagerEnd = pointStarts[pointStarts.length-1]+config.ctrlDuration();
        ctx.fillStyle = config.noiseBlockColor;
        noiseData.forEach((noise)=>{
            let {start_time,end_time} = noise;
            if (!(start_time > pagerEnd || end_time < pagerStart) && end_time >= start_time){
                start_time = Math.max(start_time,pagerStart);
                end_time = Math.min(end_time,pagerEnd);
                drawNoiseRect(ctx,config,pointStarts,0,start_time,end_time,cWidth);
            }else {
                console.warn(`drawNoise()called:pagerStart[${pagerStart}],pagerEnd[${pagerEnd}],start_time[${start_time}],end_time[${end_time}]`);
            }
        });
    }

    function drawNoiseRect(ctx,config,pointStarts,pointStartIndex,noiseStart,noiseEnd,cWidth) {
        const outCellSize = config.ctrlOutCellWidth() >> 1;
        for (let i = pointStartIndex,len = pointStarts.length;i < len;i++){
            let jsRect = config.ctrlRect(cWidth,i);
            jsRect.transform(outCellSize,0,-outCellSize,0);
            let visiblePort = config.ctrlTimeSeriesVisiblePort(jsRect,pointStarts[i]);
            if (contain(visiblePort,noiseStart)){
                if (noiseEnd <= visiblePort.right){
                    ctx.fillRect(...calNoiseRect(noiseStart,noiseEnd,jsRect,visiblePort));
                }else if (i + 1 < len){
                    ctx.fillRect(...calNoiseRect(noiseStart,visiblePort.right,jsRect,visiblePort));
                    drawNoiseRect(ctx,config,pointStarts,i+1,pointStarts[i+1],noiseEnd,cWidth);
                }
            }
        }
    }
};

const _drawSelectedJsRect = (ctx,jsRectObj,drawCut,config,cWidth)=>{
    let jsRect = jsRectObj.currentRect;
    if (drawCut){
        ctx.putImageData(drawingSurfaceImageData,0,0);
    }else {
        let container = config.ctrlRect(cWidth,jsRectObj.targetIndex);
        jsRect.top = container.top;
        jsRect.bottom = container.bottom;
    }
    if (jsRect && !jsRect.isEmpty()){
        ctx.fillStyle = 'rgba(204,214,235,0.7)';
        ctx.fillRect(jsRect.left,jsRect.top,jsRect.width(),jsRect.height());
    }
    return jsRect;
};

const drawAxisY = (ctx,w,h,x,y,type)=>{

};

const createTextElement = (info,beatType,onAnnoMarkClick,color,selected,x,y)=>{
    let markText = document.createElement('text');
    markText.textContent = info;
    markText.style.left = `${x-2}px`;
    markText.style.top = `${y}px`;
    markText.style.color = color;
    markText.style.padding = '2px 2px 2px 2px';
    markText.setAttribute('class','ecg-annotation-type');
    markText.setAttribute('my-data',beatType);
    markText.classList.toggle('ct-selected-label',selected);
    if (selected){
        visitedBeatTypeMap.set(beatType.key(),beatType)
    }
    markText.onclick = function (e){
        let element = e.target;
        if (element){
            let bt = new BeatType();
            bt.fill(JSON.parse(element.getAttribute('my-data')));
            if (element.classList.toggle('ct-selected-label')){
                visitedBeatTypeMap.set(bt.key(),bt);
            }else if (visitedBeatTypeMap.has(bt.key())){
                visitedBeatTypeMap.delete(bt.key())
            }
            onAnnoMarkClick && onAnnoMarkClick(element,bt);
        }
    };
    return markText;
};

const removeAllTextElement = ()=>{
    let nodes = document.querySelectorAll('.ecg-annotation-type');
    nodes.forEach((ele)=>{
        ele.remove();
    });
};

const changeTimestampToIndex = (startTime,timeStamp)=>{
    return Math.ceil((timeStamp-startTime)/4);
};
