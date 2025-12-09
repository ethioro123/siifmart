import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

    test('should display login page', async ({ page }) => {
        await page.goto('/');

        // Check that login page is displayed
        await expect(page.locator('text=SIIFMART')).toBeVisible();
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should login as cashier and access POS', async ({ page }) => {
        await page.goto('/');

        // Login as POS user
        await page.fill('input[type="email"]', 'cashier@siifmart.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL('/', { timeout: 5000 });

        // Verify user is logged in (check for logout button or user menu)
        await expect(page.locator('text=Logout')).toBeVisible();

        // Navigate to POS
        await page.click('text=POS Terminal');
        await page.waitForURL('/pos');

        // Verify POS page loaded
        await expect(page.locator('text=Point of Sale')).toBeVisible();
    });

    test('should prevent unauthorized access to admin pages', async ({ page }) => {
        await page.goto('/');

        // Login as POS user (limited permissions)
        await page.fill('input[type="email"]', 'cashier@siifmart.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        await page.waitForURL('/');

        // Try to navigate to Settings (admin only)
        await page.goto('/settings');

        // Should be redirected or see access denied message
        await expect(page.locator('text=Access Restricted')).toBeVisible();
    });

});
