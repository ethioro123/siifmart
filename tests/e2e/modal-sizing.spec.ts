import {test,expect} from '@playwright/test';
test('product detail modal uses its selected compact width and fits mobile',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('/tests/e2e/modal-sizing-harness.html');
 const panel=page.getByText('Product details',{exact:true}).locator('..').locator('..');
 await expect(panel).toBeVisible();
 expect((await panel.boundingBox())!.width).toBeLessThanOrEqual(672);
 await page.setViewportSize({width:390,height:844});
 expect((await panel.boundingBox())!.width).toBeLessThanOrEqual(390);
});
