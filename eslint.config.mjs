import js from '@eslint/js';
import ts from 'typescript-eslint';
import next from 'eslint-config-next/core-web-vitals';
const config = [
  { ignores: ['**/node_modules/**', '**/.next/**', '**/public/cesium/**', '**/next-env.d.ts', '**/dist/**', 'work/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended, ...ts.configs.recommended, ...next,
  { settings: { next: { rootDir: 'apps/web' }, react: { version: '19.2' } } },
  { files: ['**/*.{js,mjs}'], languageOptions: { globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly' } } }
];
export default config;
