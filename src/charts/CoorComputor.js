const transformScreenCoorX = (x,jsRect,visiblePort)=>{
    let pixelOffsetX = Number(x - visiblePort.left) * ((jsRect.right - jsRect.left) / (visiblePort.right - visiblePort.left));
    return Number(Number(jsRect.left + pixelOffsetX).toFixed(1));
};

const transformScreenCoorY = (y,jsRect,visiblePort)=>{
    let pixelOffsetY = Number(y - visiblePort.bottom) * ((jsRect.bottom - jsRect.top) / (visiblePort.top - visiblePort.bottom));
    return Number(Number(jsRect.bottom - pixelOffsetY).toFixed(1));
};

const calDataCoor = (x, y, jsRect, visiblePort)=>{
    let rawX = transformScreenCoorX(x,jsRect,visiblePort);
    let rawY = transformScreenCoorY(y,jsRect,visiblePort);
    return [rawX, rawY];
};

const calNoiseRect = (noiseStart,noiseEnd,jsRect,visiblePort)=>{
    let left = transformScreenCoorX(noiseStart,jsRect,visiblePort);
    let right = transformScreenCoorX(noiseEnd,jsRect,visiblePort);
    let top = jsRect.top;
    let bottom = jsRect.bottom;
    return [left,top,right-left,bottom-top];
};

const calAnnoCoor = (time,jsRect,visiblePort,offsetLeft,offsetTop)=>{
    offsetLeft = Number(offsetLeft || 0);
    offsetTop = Number(offsetTop || 0);
    let coorX = transformScreenCoorX(time,jsRect,visiblePort)+offsetLeft;
    let coorY = jsRect.top + offsetTop;
    return [coorX,coorY];
};

const calAnnoRect = (time,jsRect,visiblePort,textW)=>{
    let coor = calAnnoCoor(time,jsRect,visiblePort,0);
    return [coor[0]-textW/2,coor[1]-10,textW,20];
};

const contain = (port,...coorXY)=>{
    let result = false;
    if (port && coorXY && coorXY.length > 0){
        let x = coorXY[0];
        let y = coorXY.length >= 2?coorXY[1]:undefined;
        if (x && y){
            result = (x >= port.left && x <= port.right) && (y >= port.top && y <= port.bottom);
        }else if (x){
            result = x >= port.left && x <= port.right;
        }else if (y){
            result = (y >= port.top && y <= port.bottom);
        }
    }
    return result;
};

//根据数据计算抗锯齿下的y轴坐标系
const calResistDriftAxis = (data,count)=>{
    let axisY = [];
    if (data){
        data.forEach((sub)=>{
            let max = Number.MIN_VALUE;
            let min = Number.MAX_VALUE;
            sub.forEach((v)=>{
                if (v > max){
                    max = v;
                }
                if (v < min){
                    min = v;
                }
            });
            let per = Math.ceil((max-min)/(count-1));
            min = Math.floor(min)-per/2;
            max = Math.ceil(max)+per/2;
            axisY.push([min,max]);
        });
    }
    return axisY;
};

export {transformScreenCoorX,transformScreenCoorY,calDataCoor,calNoiseRect,calAnnoCoor,contain,calResistDriftAxis,calAnnoRect};