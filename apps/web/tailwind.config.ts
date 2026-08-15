import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

import { borderRadii, shadows, texts } from './src/theme/tokens';

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
          sub: hsl('--bg-sub'),
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
          white: hsl('--bg-white'),
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
      borderRadius: borderRadii,
      boxShadow: shadows,
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: texts,
      transitionTimingFunction: {
        productive: 'cubic-bezier(0.2, 0, 1, 0.9)',
      },
    },
  },
  plugins: [animate],
} satisfies Config;

export default config;
