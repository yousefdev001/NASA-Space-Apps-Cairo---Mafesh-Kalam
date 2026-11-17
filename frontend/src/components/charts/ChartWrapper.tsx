import React from 'react';
import ReactECharts, { EChartsReactProps } from 'echarts-for-react';
import { clsx } from 'clsx';
import * as echarts from 'echarts';

interface ChartWrapperProps {
  option: EChartsReactProps['option'];
  height?: string | number;
  className?: string;
  loading?: boolean;
  onEvents?: Record<string, (params: unknown) => void>;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  option,
  height = '320px',
  className,
  loading = false,
  onEvents,
}) => {
  return (
    <div
      className={clsx(
        'relative w-full rounded-xl overflow-hidden',
        className
      )}
      style={{ height }}
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0B132B]/50 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-2">
            <span className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase">Loading telemetry...</span>
          </div>
        </div>
      ) : null}
      <ReactECharts
        echarts={echarts}
        option={option}
        theme="auramed"
        style={{ height: '100%', width: '100%' }}
        notMerge={false}
        lazyUpdate={true}
        onEvents={onEvents}
      />
    </div>
  );
};
