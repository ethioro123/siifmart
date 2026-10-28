import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const html = readFileSync(resolve(process.cwd(), 'docs/design/examples/component-reference.html'), 'utf8');
for (const width of [390, 1440]) {
  test(`component reference at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.setContent(html);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const theme of ['light', 'dark']) {
      const board = page.locator(`[data-theme="${theme}"]`);
      await expect(board.getByRole('textbox', { name: 'Display site code' })).toHaveValue('ADD-DC-01');
      const trigger = board.getByRole('button', { name: 'Review proposal', exact: true });
      await trigger.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(trigger).toBeFocused();
    }
    await page.locator('h1').click();
    await expect(page).toHaveScreenshot(`component-reference-${width}.png`, { fullPage: true, animations: 'disabled' });
  });
}
