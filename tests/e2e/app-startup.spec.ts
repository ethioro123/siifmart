import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
const version = (JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string }).version;
test('opens the signed-out app with the release version and no uncaught browser errors', async ({ page }) => {
 const errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await expect(page.getByText(`SIIFMART Operations v${version}`,{exact:true})).toBeVisible({timeout:30000});
 expect(errors).toEqual([]);
});
