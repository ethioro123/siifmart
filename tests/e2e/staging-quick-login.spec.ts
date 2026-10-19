import { expect, test } from '@playwright/test';

test.skip(process.env.PLAYWRIGHT_STAGING_QUICK_LOGIN !== '1', 'Requires explicitly configured local staging');
test.use({ viewport: { width: 1440, height: 1000 }, trace: 'off' });

for (const scenario of [
    { country: 'ET', type: 'Distribution Center', role: 'picker', title: 'Ethiopia Staging Roles', route: '/wms-ops' },
    { country: 'KE', type: 'Dark Store', role: 'cashier', title: 'Kenya Staging Roles', route: '/pos' }
]) {
    test(`new ${scenario.country} ${scenario.role} signs in from the live roster`, async ({ page }, testInfo) => {
        test.setTimeout(90_000);
        const response = await page.request.get('/__staging/accounts');
        expect(response.ok()).toBe(true);
        const { accounts } = await response.json();
        const account = accounts.find((row: { role: string; email: string; site?: { type: string; country: string } }) =>
            row.role === scenario.role && row.site?.type === scenario.type && row.site.country === scenario.country &&
            row.email.endsWith('@role-coverage.staging.siifmart.invalid'));
        expect(Boolean(account)).toBe(true);
        await page.goto('/');
        const panel = page.getByRole('region', { name: scenario.title });
        await panel.getByPlaceholder(/Search/).fill(account.code);
        const button = panel.getByRole('button').filter({ hasText: account.code });
        await expect(button).toBeVisible({ timeout: 30_000 });
        await panel.screenshot({ path: testInfo.outputPath('quick-login-roster.png') });
        await button.click();
        await expect(page).toHaveURL(new RegExp(`#${scenario.route}(?:$|[/?])`), { timeout: 45_000 });
        const matches = await page.evaluate(async (expectedId: string) => {
            const importModule = new Function('url', 'return import(url)') as (url: string) => Promise<{
                supabase: { auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> } };
            }>;
            const { supabase } = await importModule('/lib/supabase.ts');
            const { data } = await supabase.auth.getUser();
            return data.user?.id === expectedId;
        }, account.id);
        expect(matches).toBe(true);
    });
}
