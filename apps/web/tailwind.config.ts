import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const hsl = (token: string) => `hsl(var(${token}) / <alpha-value>)`;

const config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          strong: hsl('--bg-strong'),
          'strong-950': hsl('--bg-strong'),
          surface: hsl('--bg-surface'),
          'surface-800': hsl('--bg-surface'),
          'sub-300': hsl('--bg-sub'),
          soft: hsl('--bg-soft'),
          'soft-200': hsl('--bg-soft'),
          weak: hsl('--bg-weak'),
          'weak-50': hsl('--bg-weak'),
          white: hsl('--bg-white'),
          'white-0': hsl('--bg-white'),
        },
        text: {
          strong: hsl('--text-strong'),
          'strong-950': hsl('--text-strong'),
          sub: hsl('--text-sub'),
          'sub-600': hsl('--text-sub'),
          soft: hsl('--text-soft'),
          'soft-400': hsl('--text-soft'),
          disabled: hsl('--text-disabled'),
          'disabled-300': hsl('--text-disabled'),
          white: hsl('--text-white'),
          'white-0': hsl('--text-white'),
        },
        stroke: {
          strong: hsl('--stroke-strong'),
          'strong-950': hsl('--stroke-strong'),
          sub: hsl('--stroke-sub'),
          'sub-300': hsl('--stroke-sub'),
          soft: hsl('--stroke-soft'),
          'soft-200': hsl('--stroke-soft'),
          'white-0': hsl('--bg-white'),
        },
        primary: {
          darker: hsl('--primary-darker'),
          base: hsl('--primary-base'),
          alpha: hsl('--primary-alpha'),
          lighter: hsl('--primary-lighter'),
        },
        success: {
          dark: hsl('--success-dark'),
          base: hsl('--success-base'),
          lighter: hsl('--success-lighter'),
        },
        warning: {
          dark: hsl('--warning-dark'),
          base: hsl('--warning-base'),
          lighter: hsl('--warning-lighter'),
        },
        error: {
          dark: hsl('--error-dark'),
          base: hsl('--error-base'),
          lighter: hsl('--error-lighter'),
        },
        information: {
          dark: hsl('--information-dark'),
          base: hsl('--information-base'),
          lighter: hsl('--information-lighter'),
        },
        overlay: hsl('--overlay'),
      },
      borderRadius: {
        10: '0.625rem',
        12: '0.75rem',
        16: '1rem',
        20: '1.25rem',
      },
      boxShadow: {
        'regular-xs': '0 1px 2px rgb(10 13 20 / 3%)',
        'regular-sm': '0 2px 4px rgb(27 28 29 / 4%)',
        'regular-md': '0 16px 32px -12px rgb(14 18 27 / 10%)',
        'button-focus': '0 0 0 2px hsl(var(--bg-white)), 0 0 0 4px hsl(var(--primary-alpha))',
        tooltip: '0 12px 24px rgb(14 18 27 / 6%), 0 1px 2px rgb(14 18 27 / 8%)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'title-h5': ['1.5rem', { lineHeight: '2rem', fontWeight: '500' }],
        'title-h6': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '500' }],
        'label-lg': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '500' }],
        'label-md': ['1rem', { lineHeight: '1.5rem', fontWeight: '500' }],
        'label-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        'label-xs': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        'paragraph-md': ['1rem', { lineHeight: '1.5rem' }],
        'paragraph-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'paragraph-xs': ['0.75rem', { lineHeight: '1rem' }],
        'subheading-xs': [
          '0.75rem',
          { lineHeight: '1rem', fontWeight: '500', letterSpacing: '0.04em' },
        ],
      },
      transitionTimingFunction: {
        productive: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [animate],
} satisfies Config;

export default config;
