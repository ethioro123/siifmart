import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:3000',
        ...devices['Desktop Chrome'],
    },
    webServer: {
        command: `${process.env.PLAYWRIGHT_STAGING_QUICK_LOGIN === '1' ? 'npm run dev:staging' : 'npm run dev'} -- --host 127.0.0.1 --port 3000 --strictPort`,
        url: 'http://127.0.0.1:3000/tests/e2e/pack-flow-harness.html',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
});
