import React from 'react';

export const WOBBLY = {
  wobbly: '255px 15px 225px 15px / 15px 225px 15px 255px',
  wobblyAlt: '185px 22px 245px 18px / 18px 215px 22px 235px',
  wobblyMd: '32px 14px 28px 18px / 18px 26px 16px 30px',
  wobblySm: '18px 8px 16px 10px / 10px 16px 8px 18px',
  wobblyCircle: '48% 52% 45% 55% / 54% 46% 52% 48%',
  wobblyTag: '22px 8px 26px 10px / 10px 20px 8px 24px',
} as const;

export type WobblyRadiusType = keyof typeof WOBBLY;

export const getWobblyStyle = (radius: WobblyRadiusType = 'wobblyMd'): React.CSSProperties => ({
  borderRadius: WOBBLY[radius],
});

export type SketchbookMode = 'paper' | 'dark' | 'cyber';
