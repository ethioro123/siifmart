import { expect, test } from '@playwright/test';

test('renders a realistic PACK shipping label within one 4 × 6 page', async ({ page }, testInfo) => {
    await page.goto('/tests/e2e/pack-flow-harness.html');
    const html = await page.evaluate(async () => {
        const importViteModule = new Function('url', 'return import(url)') as (url: string) => Promise<{
            generatePackLabelHTML: (data: Record<string, unknown>, options: { size: string; format: string }) => Promise<string>;
        }>;
        const { generatePackLabelHTML } = await importViteModule('/utils/labels/PackLabelGenerator.ts');
        return generatePackLabelHTML({
            orderRef: 'VYUU9',
            customerName: 'NormalPiassa Heritage Supermarket',
            shippingAddress: 'Piassa, Addis Ababa, Ethiopia',
            fromName: 'Kality Storage Warehouse',
            fromAddress: 'Kality Industrial Area, Addis Ababa',
            itemCount: 5,
            packageNumber: 1,
            totalPackages: 1,
            trackingNumber: 'SM-20261019-000123',
            specialHandling: { coldChain: true, fragile: true },
            lineItems: [
                { name: 'Full Cream UHT Fresh Milk 1L', sku: 'ETDY001', quantity: 38, unit: 'pk' },
                { name: 'Pure Sunflower Cooking Oil 3L', sku: 'ETSA001', quantity: 33, unit: 'btl' },
                { name: 'Stage 1 Infant Milk Formula 800g', sku: 'ETBB001', quantity: 19, unit: 'can' },
                { name: 'Multi-Enzyme Laundry Detergent Powder 2kg', sku: 'ETLD001', quantity: 37, unit: 'bag' },
                { name: 'Rechargeable Emergency LED Lantern', sku: 'ETEL001', quantity: 43, unit: 'pk' },
            ],
        }, { size: 'XL', format: 'Both' });
    });

    await page.evaluate((labelHtml) => {
        document.body.innerHTML = '<iframe id="label-preview" title="Pack label preview"></iframe>';
        const frame = document.getElementById('label-preview') as HTMLIFrameElement;
        frame.style.cssText = 'width: 700px; height: 1100px; border: 0;';
        frame.srcdoc = labelHtml;
    }, html);

    const label = page.frameLocator('#label-preview').locator('.label');
    await expect(label).toBeVisible();
    await expect(label.getByText('JOB VYUU9')).toBeVisible();
    await expect(label.getByText('5 ITEMS')).toBeVisible();
    await expect(label.getByText('Full Cream UHT Fresh Milk 1L')).toHaveCount(0);
    const metrics = await label.evaluate(element => {
        const content = element.firstElementChild as HTMLElement;
        return {
            width: element.getBoundingClientRect().width,
            height: element.getBoundingClientRect().height,
            contentHeight: content.getBoundingClientRect().height,
            scrollHeight: element.scrollHeight,
        };
    });
    expect(metrics.height).toBeLessThanOrEqual(576);
    expect(metrics.scrollHeight).toBeLessThanOrEqual(576);
    await page.emulateMedia({ media: 'print' });
    await label.screenshot({ path: testInfo.outputPath('pack-label-output.png') });
});
