// 指さし会話帳: filtering, speech (vi-VN), and 見せるモード (full screen, wake lock, replay, close).
import { expect, test } from '@playwright/test';
import { mockSpeech, mockWakeLock } from './mocks';

const VI_VOICE = [
  { lang: 'ja-JP', name: 'Kyoko' },
  { lang: 'vi-VN', name: 'Linh' },
];

test.describe('phrasebook', () => {
  test('scene chips and search filter the cards', async ({ page }) => {
    await page.goto('/phrases/');
    const sections = page.locator('[data-group-section]');
    const total = await sections.count();
    expect(total).toBeGreaterThan(1);
    const cards = page.locator('[data-phrase]:visible');
    const all = await cards.count();

    // Pick the second scene chip → only that section remains.
    const chip = page.locator('[data-group]').nth(1);
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-group-section]:visible')).toHaveCount(1);
    expect(await cards.count()).toBeLessThan(all);

    // Search covers every scene, accepts Vietnamese without diacritics and hiragana.
    const first = page.locator('[data-phrase]').first();
    const vi = (await first.getAttribute('data-vi'))!;
    // Strip Vietnamese diacritics (combining marks U+0300–U+036F after NFD).
    const plain = [...vi.normalize('NFD')]
      .filter((c) => c.charCodeAt(0) < 0x300 || c.charCodeAt(0) > 0x36f)
      .join('')
      .replace(/đ/g, 'd');
    await page.locator('#phrase-search').fill(plain.toLowerCase());
    await expect(page.locator('[data-group="all"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(`[data-phrase][data-vi="${vi}"]`)).toBeVisible();

    await page.locator('#phrase-search').fill('zzzzzz');
    await expect(page.locator('[data-empty]')).toBeVisible();
    await expect(cards).toHaveCount(0);
  });

  test('no Vietnamese voice → play buttons hidden, note shown', async ({ page }) => {
    await mockSpeech(page, [{ lang: 'ja-JP', name: 'Kyoko' }]);
    await page.goto('/phrases/');
    await expect(page.locator('[data-no-voice]')).toBeVisible({ timeout: 4000 });
    await expect(page.locator('[data-speak]:visible')).toHaveCount(0);
  });

  test('Vietnamese voice → play button speaks with vi-VN', async ({ page }) => {
    await mockSpeech(page, VI_VOICE);
    await page.goto('/phrases/');
    const card = page.locator('[data-phrase]').first();
    const vi = (await card.getAttribute('data-vi'))!;
    await card.locator('[data-speak]').click();
    expect(await page.evaluate(() => window.__spoken)).toEqual([{ text: vi, lang: 'vi-VN' }]);
    await expect(page.locator('[data-no-voice]')).toBeHidden();
  });
});

test.describe('見せるモード', () => {
  test('opens full screen with huge Vietnamese, keeps screen awake, replays, closes', async ({
    page,
  }) => {
    await mockSpeech(page, VI_VOICE);
    await mockWakeLock(page);
    await page.goto('/phrases/');
    const card = page.locator('[data-phrase]').first();
    const vi = (await card.getAttribute('data-vi'))!;
    await card.locator('[data-show]').click();

    const dialog = page.locator('#show-mode');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '見せるモード' })).toBeVisible();
    const big = dialog.locator('[data-sm-vi]');
    await expect(big).toHaveText(vi);
    const fontSize = await big.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(44);

    // Covers the whole viewport.
    const box = (await dialog.boundingBox())!;
    const vp = page.viewportSize()!;
    expect(box.width).toBeGreaterThanOrEqual(vp.width - 1);
    expect(box.height).toBeGreaterThanOrEqual(vp.height - 1);

    // Wake lock taken, caption shown; spoken once on open, again on replay.
    await expect(dialog.locator('[data-sm-wake]')).toBeVisible();
    expect(await page.evaluate(() => window.__wake.requested)).toBe(1);
    await page.screenshot({
      path: `tests/screenshots/${test.info().project.name}/phrases--show-mode.jpg`,
      type: 'jpeg',
      quality: 75,
      animations: 'disabled',
    });
    await dialog.getByRole('button', { name: 'もう一度再生' }).click();
    expect((await page.evaluate(() => window.__spoken)).map((s) => s.text)).toEqual([vi, vi]);

    await dialog.getByRole('button', { name: '閉じる' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => window.__wake.released)).toBe(1);

    // Esc also closes.
    await card.locator('[data-show]').click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('swipe down closes', async ({ page }) => {
    await page.goto('/phrases/');
    await page.locator('[data-phrase] [data-show]').first().click();
    const dialog = page.locator('#show-mode');
    await expect(dialog).toBeVisible();
    const supported = await page.evaluate(() => {
      try {
        new Touch({ identifier: 0, target: document.body });
        return true;
      } catch {
        return false;
      }
    });
    test.skip(!supported, 'synthetic Touch events unsupported (WebKit) — covered on Pixel 7');
    await dialog.evaluate((el) => {
      const touch = (y: number) => [
        new Touch({ identifier: 1, target: el, clientX: 150, clientY: y }),
      ];
      el.dispatchEvent(new TouchEvent('touchstart', { touches: touch(200), bubbles: true }));
      el.dispatchEvent(new TouchEvent('touchmove', { touches: touch(380), bubbles: true }));
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }));
    });
    await expect(dialog).toBeHidden();
  });

  test('without a Vietnamese voice the replay button is hidden', async ({ page }) => {
    await mockSpeech(page, []);
    await page.goto('/phrases/');
    await page.locator('[data-phrase] [data-show]').first().click();
    await expect(page.locator('#show-mode')).toBeVisible();
    await expect(page.locator('[data-sm-replay]')).toBeHidden();
  });
});
