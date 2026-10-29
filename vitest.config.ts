import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/.backups/**', '**/dist/**', 'tests/e2e/**', 'tests/design/**'],
    environment: 'node',
  },
});
