export const HUD_TOKENS = {
  colors: {
    deepVoid: '#050B14',
    cosmicNavy: '#0B132B',
    hudCyan: '#00E5FF',
    hudEmerald: '#10B981',
    hudAmber: '#F59E0B',
    hudCrimson: '#EF4444',
    hudWhite: '#E2E8F0',
    hudMuted: '#64748B',
    hudBorder: '#1E3A5F',
    hudBorderGlow: 'rgba(0, 229, 255, 0.3)',
    glass: 'rgba(11, 19, 43, 0.85)',
    auraOrange: '#FF4D00',
    auraDarkCard: '#0c0c10',
    auraMuted: '#16161a',
  },
  status: {
    nominal: '#10B981',
    warning: '#F59E0B',
    critical: '#EF4444',
  },
} as const;

export type StatusType = 'nominal' | 'warning' | 'critical';
