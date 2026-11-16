export const HAND_DRAWN_TOKENS = {
  light: {
    background: '#fdfbf7',
    foreground: '#2d2d2d',
    muted: '#e5e0d8',
    accent: '#ff4d4d',
    border: '#2d2d2d',
    secondaryAccent: '#2d5da1',
    postIt: '#fff9c4',
  },
  dark: {
    background: '#000000',
    foreground: '#ffffff',
    muted: '#16161a',
    accent: '#ff4d00',
    border: '#ff4d00',
    secondaryAccent: '#ff4d00',
    postIt: '#18110c',
  },
  radius: {
    wobbly: '255px 15px 225px 15px / 15px 225px 15px 255px',
    wobblyAlt: '185px 22px 245px 18px / 18px 215px 22px 235px',
    wobblyMd: '32px 14px 28px 18px / 18px 26px 16px 30px',
    wobblySm: '18px 8px 16px 10px / 10px 16px 8px 18px',
    wobblyCircle: '48% 52% 45% 55% / 54% 46% 52% 48%',
    wobblyTag: '22px 8px 26px 10px / 10px 20px 8px 24px',
  },
  shadows: {
    standard: '4px 4px 0px 0px #2d2d2d',
    emphasized: '8px 8px 0px 0px #2d2d2d',
    hover: '2px 2px 0px 0px #2d2d2d',
    cardSubtle: '3px 3px 0px 0px rgba(45, 45, 45, 0.12)',
  },
} as const;

export const WOBBLY_RADII = HAND_DRAWN_TOKENS.radius;

export type ThemeMode = 'light' | 'dark';

export function resolveNextTheme(current: ThemeMode): ThemeMode {
  return current === 'light' ? 'dark' : 'light';
}

export function getWobblyBorderStyle(
  variant: keyof typeof WOBBLY_RADII = 'wobbly'
): { borderRadius: string } {
  return { borderRadius: WOBBLY_RADII[variant] };
}
