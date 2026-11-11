// SEO head tags, static SEO/PWA files, and offline behaviour of the service worker.
import { expect, test } from '@playwright/test';
import { builtRoutes } from './routes';

test.describe('SEO', () => {
  test('phrases page head: canonical, hreflang, OG, breadcrumb JSON-LD', async ({ page }) => {
    await page.goto('/vi/phrases/');
    const head = page.locator('head');
    await expect(head.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/vi\/phrases\/$/);
    for (const [lang, path] of [
      ['ja', '/phrases/'],
      ['vi', '/vi/phrases/'],
      ['en', '/en/phrases/'],
      ['x-default', '/phrases/'],
    ]) {
      await expect(head.locator(`link[rel="alternate"][hreflang="${lang}"]`)).toHaveAttribute(
        'href',
        new RegExp(`^https?://[^/]+${path}$`),
      );
    }
    await expect(head.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/og\/phrases\.png$/,
    );
    await expect(head.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'vi_VN');
    await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );

    const ld = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? '{}')));
    const crumbs = ld.find((o) => o['@type'] === 'BreadcrumbList');
    expect(crumbs.itemListElement).toHaveLength(2);
    expect(crumbs.itemListElement[1].item).toMatch(/\/vi\/phrases\/$/);
  });

  test('spot page has TouristAttraction JSON-LD and a hero OG image', async ({ page }) => {
    const href = builtRoutes().find((r) => /^\/spots\/[^/]+\/$/.test(r.path))?.path;
    test.skip(!href, 'no spot pages built');
    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    const ld = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? '{}')));
    const spot = ld.find((o) => o['@type'] === 'TouristAttraction');
    expect(spot?.name).toBeTruthy();
    expect(spot?.geo?.latitude).toEqual(expect.any(Number));
    expect(ld.some((o) => o['@type'] === 'BreadcrumbList')).toBe(true);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/_astro\/.+\.jpg$/,
    );
  });

  test('robots.txt, sitemap and manifest are served', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.ok()).toBe(true);
    expect(await robots.text()).toMatch(/Sitemap: https?:\/\/.+\/sitemap-index\.xml/);
    expect((await request.get('/sitemap-index.xml')).ok()).toBe(true);
    const manifest = await (await request.get('/manifest.webmanifest')).json();
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  });
});

test.describe('PWA offline', () => {
  test.use({ serviceWorkers: 'allow' });

  test('phrasebook and viewed pages work offline; video is never cached', async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'offline emulation + SW is reliable in Chromium only');
    await page.goto('/guide/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload(); // now controlled → this page is cached
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await page.goto('/', { waitUntil: 'domcontentloaded' }); // home has the hero video
    await page.waitForTimeout(1000);

    await context.setOffline(true);
    // Precached at install time, never visited:
    await page.goto('/en/phrases/');
    await expect(page.locator('[data-phrase]').first()).toBeVisible();
    // /eat/ is precached too: dish photos load and "show the address" still works with no signal.
    await page.goto('/eat/');
    await page.locator('[data-sheet-open="dish-pho"]').click();
    await expect(page.locator('dialog#dish-pho img').first()).toHaveJSProperty('complete', true);
    await page.locator('dialog#dish-pho .shop-item [data-show]').first().click();
    await expect(page.locator('#show-mode [data-sm-vi]')).toHaveText(/Pasteur/);
    await page.locator('#show-mode [data-show-close]').click();
    // Visited while online:
    await page.goto('/guide/');
    await expect(page.locator('#cv-vnd')).toBeVisible();
    // Never visited and not precached → offline fallback page.
    await page.goto('/privacy/');
    await expect(page.locator('h1')).toHaveText('オフラインです');
    await context.setOffline(false);

    const cachedVideo = await page.evaluate(async () => {
      const urls: string[] = [];
      for (const name of await caches.keys()) {
        for (const req of await (await caches.open(name)).keys()) urls.push(req.url);
      }
      return urls.filter((u) => /\.(mp4|webm)$/i.test(u));
    });
    expect(cachedVideo).toEqual([]);
  });
});
