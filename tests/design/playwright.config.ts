import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.', testMatch: 'reference.spec.ts', reporter: 'list',
  use: { browserName: 'chromium', locale: 'en-GB', timezoneId: 'Australia/Melbourne', contextOptions: { reducedMotion: 'reduce' } },
});
