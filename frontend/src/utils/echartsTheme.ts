import * as echarts from 'echarts';

export const AURAMED_ECHARTS_THEME = {
  backgroundColor: 'transparent',
  textStyle: {
    color: '#E2E8F0',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  color: [
    '#00E5FF', // HUD Cyan
    '#10B981', // HUD Emerald (Nominal)
    '#F59E0B', // HUD Amber (Warning)
    '#EF4444', // HUD Crimson (Critical)
    '#8B5CF6', // Purple
    '#06B6D4', // Teal
  ],
  grid: {
    borderColor: '#1E3A5F',
    top: 30,
    right: 20,
    bottom: 30,
    left: 45,
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#1E3A5F' } },
    axisTick: { lineStyle: { color: '#1E3A5F' } },
    axisLabel: { color: '#64748B' },
    splitLine: { lineStyle: { color: '#1E3A5F', type: 'dashed' } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#1E3A5F' } },
    axisTick: { lineStyle: { color: '#1E3A5F' } },
    axisLabel: { color: '#64748B' },
    splitLine: { lineStyle: { color: 'rgba(30, 58, 95, 0.4)', type: 'dashed' } },
  },
  tooltip: {
    backgroundColor: 'rgba(11, 19, 43, 0.95)',
    borderColor: '#1E3A5F',
    borderWidth: 1,
    textStyle: { color: '#E2E8F0' },
  },
};

// Register once
echarts.registerTheme('auramed', AURAMED_ECHARTS_THEME);

export default AURAMED_ECHARTS_THEME;
