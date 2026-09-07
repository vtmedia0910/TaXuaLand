import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
export default defineConfig({ test: { include: ['tests/**/*.test.ts'], exclude: ['tests/e2e/**'], testTimeout: 15000 } });
