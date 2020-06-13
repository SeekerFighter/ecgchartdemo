import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import {ECGChartView} from "./charts/ECGChartView";
import {data} from "./data";

ReactDOM.render(
    <ECGChartView
        data={{
            ecgData: data.ecgData,
            annoData: data.annoData,
            fragData: data.fragData,
            noiseData: data.noiseData,
            pointStart: data.pointStart,
        }}
        chartStyle={{
            background: '#FFFFFF',
            marginLeft: 10,
            marginTop: 10,
        }}/>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
