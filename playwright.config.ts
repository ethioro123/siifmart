import { defineConfig, devices } from '@playwright/test';

const staging = process.env.PLAYWRIGHT_STAGING_QUICK_LOGIN === '1';
const port = staging ? 3000 : 3001;

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    reporter: 'list',
    use: {
        baseURL: `http://127.0.0.1:${port}`,
        ...devices['Desktop Chrome'],
    },
    webServer: {
        command: `${staging ? 'npm run dev:staging' : 'npm run dev'} -- --host 127.0.0.1`,
        url: `http://127.0.0.1:${port}/tests/e2e/pack-flow-harness.html`,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
});
