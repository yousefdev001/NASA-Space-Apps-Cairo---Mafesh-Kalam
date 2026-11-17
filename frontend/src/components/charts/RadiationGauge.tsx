import React from 'react';
import { ChartWrapper } from './ChartWrapper';

interface RadiationGaugeProps {
  valueMsvHr?: number;
  cumulativeMsv?: number;
  height?: string | number;
}

export const RadiationGauge: React.FC<RadiationGaugeProps> = ({
  valueMsvHr = 0.042,
  cumulativeMsv = 42.1,
  height = '240px',
}) => {
  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 190,
        endAngle: -10,
        min: 0,
        max: 0.5,
        splitNumber: 5,
        radius: '95%',
        center: ['50%', '65%'],
        axisLine: {
          lineStyle: {
            width: 14,
            color: [
              [0.2, '#10B981'], // < 0.1 Nominal
              [0.6, '#F59E0B'], // Warning
              [1.0, '#EF4444'], // Critical Alert
            ],
          },
        },
        pointer: {
          icon: 'triangle',
          length: '60%',
          width: 6,
          offsetCenter: [0, '-10%'],
          itemStyle: {
            color: '#00E5FF',
            shadowColor: '#00E5FF',
            shadowBlur: 8,
          },
        },
        axisTick: {
          length: 6,
          lineStyle: { color: '#1E3A5F', width: 1 },
        },
        splitLine: {
          length: 12,
          lineStyle: { color: '#64748B', width: 2 },
        },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          distance: 14,
          formatter: (val: number) => val.toFixed(2),
        },
        title: {
          offsetCenter: [0, '25%'],
          fontSize: 11,
          color: '#94A3B8',
          fontFamily: 'Inter, monospace',
        },
        detail: {
          fontSize: 18,
          offsetCenter: [0, '-20%'],
          valueAnimation: true,
          formatter: (value: number) => `${value.toFixed(3)}\nmSv/h`,
          color: '#E2E8F0',
          fontFamily: 'monospace',
          lineHeight: 22,
        },
        data: [
          {
            value: valueMsvHr,
            name: `Cumulative: ${cumulativeMsv} mSv (4.2% limit)`,
          },
        ],
      },
    ],
  };

  return <ChartWrapper option={option} height={height} />;
};
