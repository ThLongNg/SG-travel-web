// Smoke test for every route × every viewport, with a screenshot of each Japanese page
// saved to tests/screenshots/<project>/<page>.jpg for visual review.
import { expect, test } from '@playwright/test';
import { builtRoutes, isVideoPage } from './routes';

const routes = builtRoutes();

for (const route of routes) {
  test(`smoke ${route.path}`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const res = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    expect(res?.status(), 'HTTP status').toBeLessThan(400);
    if (!isVideoPage(route.path)) await page.waitForLoadState('load');

    await expect(page.locator('main#main')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
    // site.name per locale (ja: サイゴン・トラベル, vi/en: Saigon Travel)
    await expect(page).toHaveTitle(route.ja ? /サイゴン・トラベル/ : /Saigon Travel/);
    await expect(page.locator('nav.glass-tabbar')).toBeVisible();
    expect(await page.locator('html').getAttribute('lang')).toMatch(/^(ja|vi|en)$/);

    // No horizontal overflow on mobile (the classic "page wiggles sideways" bug).
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, 'horizontal overflow (px)').toBeLessThanOrEqual(1);

    expect(errors, 'uncaught page errors').toEqual([]);

    if (route.ja) {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `tests/screenshots/${info.project.name}/${route.name}.jpg`,
        fullPage: true,
        type: 'jpeg',
        quality: 70,
        animations: 'disabled',
      });
    }
  });
}

test('404 page', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist/', { waitUntil: 'domcontentloaded' });
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1').first()).toBeVisible();
});
