import { test, expect } from '@playwright/test';

test.describe('POS Workflow', () => {

    test.beforeEach(async ({ page }) => {
        // Login as cashier before each test
        await page.goto('/');
        await page.fill('input[type="email"]', 'cashier@siifmart.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');

        // Navigate to POS
        await page.click('text=POS Terminal');
        await page.waitForURL('/pos');
    });

    test('should complete a sale transaction', async ({ page }) => {
        // Search for a product
        await page.fill('input[placeholder*="Search"]', 'Coca Cola');
        await page.waitForTimeout(500); // Wait for search results

        // Click on first product result
        await page.click('[data-testid="product-item"]').catch(() => {
            // Fallback if testid not present
            page.click('text=Coca Cola').first();
        });

        // Verify product added to cart
        await expect(page.locator('text=Cart')).toBeVisible();

        // Proceed to checkout
        await page.click('button:has-text("Checkout")');

        // Select payment method (Cash)
        await page.click('text=Cash');

        // Complete payment
        await page.click('button:has-text("Complete Sale")');

        // Verify success message
        await expect(page.locator('text=Sale Completed')).toBeVisible();
    });

    test('should hold and retrieve an order', async ({ page }) => {
        // Add a product
        await page.fill('input[placeholder*="Search"]', 'Bread');
        await page.waitForTimeout(500);
        await page.click('text=Bread').first();

        // Hold the order
        await page.click('button:has-text("Hold Order")');

        // Verify order is held
        await expect(page.locator('text=Order Held')).toBeVisible();

        // Retrieve held order
        await page.click('button:has-text("Held Orders")');
        await page.click('[data-testid="held-order"]').first();

        // Verify cart is restored
        await expect(page.locator('text=Bread')).toBeVisible();
    });

});
