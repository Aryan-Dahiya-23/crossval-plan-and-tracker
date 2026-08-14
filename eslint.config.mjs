import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const webFiles = ['apps/web/**/*.{js,mjs,cjs,ts,tsx}'];
const serverFiles = ['apps/api/**/*.ts', 'packages/**/*.ts'];

const withFiles = (configs, files) => configs.map((config) => ({ ...config, files }));

export default defineConfig([
  globalIgnores([
    '**/.next/**',
    '**/coverage/**',
    '**/dist/**',
    '**/node_modules/**',
    '**/*.tsbuildinfo',
    'apps/web/next-env.d.ts',
  ]),
  {
    ...eslint.configs.recommended,
    files: ['*.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
  },
  ...withFiles(tseslint.configs.recommended, serverFiles),
  {
    files: serverFiles,
    languageOptions: { globals: globals.node },
  },
  ...withFiles(nextVitals, webFiles),
  ...withFiles(nextTypeScript, webFiles),
  {
    files: webFiles,
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
]);
