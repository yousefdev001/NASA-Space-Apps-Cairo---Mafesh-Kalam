import React from 'react';
import { ChartWrapper } from './ChartWrapper';

interface OrganRadarProps {
  scores?: {
    heart: number;
    lungs: number;
    brain: number;
    liver: number;
    kidneys: number;
    wholeBody: number;
  };
  height?: string | number;
}

export const OrganRadarChart: React.FC<OrganRadarProps> = ({
  scores = {
    heart: 92,
    lungs: 96,
    brain: 95,
    liver: 92,
    kidneys: 92,
    wholeBody: 94,
  },
  height = '300px',
}) => {
  const option = {
    radar: {
      indicator: [
        { name: 'Heart (Cardio)', max: 100 },
        { name: 'Lungs (Respiratory)', max: 100 },
        { name: 'Brain (CNS)', max: 100 },
        { name: 'Liver (Metabolic)', max: 100 },
        { name: 'Kidneys (Renal)', max: 100 },
        { name: 'Whole Body (Systemic)', max: 100 },
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: '#94A3B8',
        fontSize: 11,
        fontFamily: 'Inter, monospace',
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(30,58,95,0.15)', 'rgba(30,58,95,0.25)'],
        },
      },
      splitLine: {
        lineStyle: {
          color: '#1E3A5F',
        },
      },
      axisLine: {
        lineStyle: {
          color: '#1E3A5F',
        },
      },
    },
    series: [
      {
        name: 'Physiological Integrity',
        type: 'radar',
        data: [
          {
            value: [
              scores.heart,
              scores.lungs,
              scores.brain,
              scores.liver,
              scores.kidneys,
              scores.wholeBody,
            ],
            name: 'Organ System Health %',
            symbol: 'circle',
            symbolSize: 4,
            lineStyle: {
              color: '#00E5FF',
              width: 2,
              shadowColor: '#00E5FF',
              shadowBlur: 6,
            },
            areaStyle: {
              color: 'rgba(0, 229, 255, 0.22)',
            },
          },
        ],
      },
    ],
  };

  return <ChartWrapper option={option} height={height} />;
};
