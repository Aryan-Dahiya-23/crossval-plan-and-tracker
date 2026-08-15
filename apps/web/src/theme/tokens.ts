import type { Config } from 'tailwindcss';

type ThemeConfig = NonNullable<Config['theme']>;
type ThemeExtend = NonNullable<ThemeConfig['extend']>;
type FontSizeConfig = NonNullable<ThemeExtend['fontSize']>;
type BorderRadiusConfig = NonNullable<ThemeExtend['borderRadius']>;
type BoxShadowConfig = NonNullable<ThemeExtend['boxShadow']>;

export const texts: FontSizeConfig = {
  // Titles: 500 weight
  'title-h1': ['3.5rem', { lineHeight: '4rem', letterSpacing: '-0.01em', fontWeight: '500' }],
  'title-h2': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.01em', fontWeight: '500' }],
  'title-h3': ['2.5rem', { lineHeight: '3rem', letterSpacing: '-0.01em', fontWeight: '500' }],
  'title-h4': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.005em', fontWeight: '500' }],
  'title-h5': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0em', fontWeight: '500' }],
  'title-h6': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0em', fontWeight: '500' }],

  // Labels: 500 medium weight
  'label-xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em', fontWeight: '500' }],
  'label-lg': ['1.125rem', { lineHeight: '1.5rem', letterSpacing: '-0.015em', fontWeight: '500' }],
  'label-md': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.011em', fontWeight: '500' }],
  'label-sm': ['.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.006em', fontWeight: '500' }],
  'label-xs': ['.75rem', { lineHeight: '1rem', letterSpacing: '0em', fontWeight: '500' }],

  // Paragraphs: 400 normal weight
  'paragraph-xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em', fontWeight: '400' }],
  'paragraph-lg': [
    '1.125rem',
    { lineHeight: '1.5rem', letterSpacing: '-0.015em', fontWeight: '400' },
  ],
  'paragraph-md': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.011em', fontWeight: '400' }],
  'paragraph-sm': [
    '.875rem',
    { lineHeight: '1.25rem', letterSpacing: '-0.006em', fontWeight: '400' },
  ],
  'paragraph-xs': ['.75rem', { lineHeight: '1rem', letterSpacing: '0em', fontWeight: '400' }],

  // Subheadings: 500 uppercase tracking
  'subheading-md': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.06em', fontWeight: '500' }],
  'subheading-sm': [
    '.875rem',
    { lineHeight: '1.25rem', letterSpacing: '0.06em', fontWeight: '500' },
  ],
  'subheading-xs': ['.75rem', { lineHeight: '1rem', letterSpacing: '0.04em', fontWeight: '500' }],
  'subheading-2xs': [
    '.6875rem',
    { lineHeight: '.75rem', letterSpacing: '0.02em', fontWeight: '500' },
  ],
};

export const borderRadii: BorderRadiusConfig = {
  '10': '.625rem', // 10px
  '12': '.75rem', // 12px
  '16': '1rem', // 16px
  '20': '1.25rem', // 20px
};

export const shadows: BoxShadowConfig = {
  'regular-xs': '0 1px 2px 0 #0a0d1408',
  'regular-sm': '0 2px 4px #1b1c1d0a',
  'regular-md': '0 16px 32px -12px #0e121b1a',
  'button-primary-focus': '0 0 0 2px hsl(var(--bg-white)), 0 0 0 4px hsl(var(--primary-alpha))',
  'button-important-focus':
    '0 0 0 2px hsl(var(--bg-white)), 0 0 0 4px hsl(var(--text-strong) / 16%)',
  'button-error-focus': '0 0 0 2px hsl(var(--bg-white)), 0 0 0 4px hsl(var(--error-base) / 16%)',
  'fancy-buttons-neutral': '0 1px 2px 0 #1b1c1d7a, 0 0 0 1px #242628',
  'fancy-buttons-primary': '0 1px 2px 0 #0e121b3d, 0 0 0 1px hsl(var(--primary-base))',
  'fancy-buttons-stroke': '0 1px 3px 0 #0e121b1f, 0 0 0 1px hsl(var(--stroke-soft))',
  tooltip: '0 12px 24px 0 #0e121b0f, 0 1px 2px 0 #0e121b08',
};
