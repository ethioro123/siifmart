import { expect, test } from '@playwright/test';

test('PACK opens its full-screen scanner from the bottom job action and returns to items', async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('pageerror', error => browserErrors.push(error.message));
    await page.route('**/supabase-proxy/**', route => route.abort());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tests/e2e/pack-flow-harness.html');

    await expect(page.getByText('Review parcel destination, handling directives, and cargo manifest before scanning.')).toBeVisible();
    const startAction = page.getByRole('button', { name: 'Start Scanning & Pack' });
    await expect(startAction).toBeVisible();
    await expect(startAction).toHaveCount(1);
    const actionBounds = await startAction.boundingBox();
    expect(actionBounds).not.toBeNull();
    expect(actionBounds!.y + actionBounds!.height).toBeLessThanOrEqual(844);

    await startAction.click();
    await expect(page.getByText('Pack this item')).toBeVisible();
    await expect(page.getByText('Review parcel destination, handling directives, and cargo manifest before scanning.')).toHaveCount(0);

    await page.locator('button[aria-label]').first().click();
    await expect(page.getByLabel('Scan or enter barcode')).toBeVisible();
    await expect(page.getByText('Playwright Test Milk')).toBeVisible();
    await expect(page.getByText('Review parcel destination, handling directives, and cargo manifest before scanning.')).toHaveCount(0);
    expect(browserErrors).toEqual([]);
});
