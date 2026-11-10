// Hero video must not download when the user asked for less motion / less data (SPEC §1).
// Depends on VideoHero (owner: Agent A). The phase-0 stub always autoplays, so these are marked
import { expect, test, type Page } from '@playwright/test';

const VIDEO = /\.(mp4|webm)(\?|$)/i;

async function videoRequests(page: Page) {
  const hits: string[] = [];
  page.on('request', (r) => {
    if (VIDEO.test(r.url())) hits.push(r.url());
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  return hits;
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no video is requested, poster is shown', async ({ page }) => {
    const hits = await videoRequests(page);
    expect(hits).toEqual([]);
    const video = page.locator('.video-hero video');
    if (await video.count()) {
      expect(await video.evaluate((v: HTMLVideoElement) => v.currentSrc)).toBe('');
    }
  });
});

test.describe('save-data', () => {
  test('no video is requested when navigator.connection.saveData is on', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', {
        value: { saveData: true, effectiveType: '4g', addEventListener() {} },
        configurable: true,
      });
    });
    expect(await videoRequests(page)).toEqual([]);
  });
});

test('pages other than home never load video', async ({ page }) => {
  const hits: string[] = [];
  page.on('request', (r) => {
    if (VIDEO.test(r.url())) hits.push(r.url());
  });
  for (const path of ['/phrases/', '/guide/', '/contact/']) await page.goto(path);
  expect(hits).toEqual([]);
});
