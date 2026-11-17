import React from 'react';
import { ChartWrapper } from './ChartWrapper';

interface VitalsStreamProps {
  dataPoints?: {
    time: string;
    hr: number;
    spo2: number;
    temp: number;
  }[];
  height?: string | number;
}

export const VitalsStreamChart: React.FC<VitalsStreamProps> = ({
  dataPoints,
  height = '320px',
}) => {
  // Generate realistic 15-minute telemetry timeline if not provided
  const points = dataPoints || Array.from({ length: 20 }).map((_, i) => {
    const minsAgo = 20 - i;
    const time = `${String(14).padStart(2, '0')}:${String(10 + minsAgo).padStart(2, '0')}`;
    return {
      time,
      hr: Math.round(62 + Math.sin(i * 0.8) * 5 + (i % 3)),
      spo2: +(97.2 + Math.cos(i * 0.5) * 0.6).toFixed(1),
      temp: +(36.7 + Math.sin(i * 0.4) * 0.15).toFixed(1),
    };
  });

  const times = points.map((p) => p.time);
  const hrData = points.map((p) => p.hr);
  const spo2Data = points.map((p) => p.spo2);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        lineStyle: { color: 'rgba(0, 229, 255, 0.4)' },
      },
    },
    legend: {
      data: ['Heart Rate (BPM)', 'SpO2 (%)'],
      top: 0,
      right: 15,
      textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'monospace' },
    },
    grid: {
      top: 40,
      right: 45,
      bottom: 25,
      left: 45,
    },
    xAxis: {
      type: 'category',
      data: times,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#64748B', fontSize: 10, fontFamily: 'monospace' },
    },
    yAxis: [
      {
        type: 'value',
        name: 'BPM',
        min: 50,
        max: 100,
        nameTextStyle: { color: '#64748B', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(30,58,95,0.3)', type: 'dashed' } },
        axisLabel: { color: '#64748B', fontSize: 10 },
      },
      {
        type: 'value',
        name: 'SpO2 %',
        min: 90,
        max: 100,
        nameTextStyle: { color: '#64748B', fontSize: 10 },
        splitLine: { show: false },
        axisLabel: { color: '#64748B', fontSize: 10 },
      },
    ],
    series: [
      {
        name: 'Heart Rate (BPM)',
        type: 'line',
        smooth: true,
        data: hrData,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { color: '#00E5FF', width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 229, 255, 0.3)' },
              { offset: 1, color: 'rgba(0, 229, 255, 0.0)' },
            ],
          },
        },
      },
      {
        name: 'SpO2 (%)',
        type: 'line',
        smooth: true,
        data: spo2Data,
        yAxisIndex: 1,
        showSymbol: false,
        lineStyle: { color: '#10B981', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.0)' },
            ],
          },
        },
      },
    ],
  };

  return <ChartWrapper option={option} height={height} />;
};
