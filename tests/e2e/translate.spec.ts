// 翻訳 bubble: opens from any page, sends the text to /api/translate (mocked here — no API cost),
// shows Vietnamese + kana + back-translation, and hands off to the full-screen 見せるモード.
import { expect, test } from '@playwright/test';

const reply = {
  vi: 'Đừng làm cay nha chị',
  kana: 'ドゥン ラム カイ ニャー チ',
  ja: '辛くしないでくださいね',
  note: '男性には chị を anh（アン）に',
};

test.describe('translate bubble', () => {
  test('ja→vi: result, kana, back-translation, then full screen', async ({ page }) => {
    let sent: unknown = null;
    await page.route('**/api/translate/', async (route) => {
      sent = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reply),
      });
    });
    await page.goto('/spots/');
    await page.locator('.translate-fab').click();
    await expect(page.locator('dialog#translate-sheet')).toHaveAttribute('open', '');

    await page.locator('[data-tr-input]').fill('辛くしないでください');
    await page.locator('[data-tr-submit]').click();
    await expect(page.locator('[data-tr-vi]')).toHaveText(reply.vi);
    await expect(page.locator('[data-tr-kana]')).toHaveText(reply.kana);
    await expect(page.locator('[data-tr-back]')).toHaveText(reply.ja);
    await expect(page.locator('[data-tr-note]')).toHaveText(reply.note);
    expect(sent).toEqual({ text: '辛くしないでください', dir: 'ja-vi' });

    await page.locator('[data-tr-show]').click();
    await expect(page.locator('#show-mode')).toHaveAttribute('open', '');
    await expect(page.locator('#show-mode [data-sm-vi]')).toHaveText(reply.vi);
    await expect(page.locator('#show-mode [data-sm-kana]')).toHaveText(reply.kana);
  });

  test('vi→ja puts the Japanese on top and hides 全画面', async ({ page }) => {
    await page.route('**/api/translate/', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          vi: 'Em đi đâu?',
          kana: 'エム ディー ダウ',
          ja: 'どこに行きますか？',
          note: '',
        }),
      }),
    );
    await page.goto('/');
    await page.locator('.translate-fab').click();
    await page.locator('[data-tr-dir="vi-ja"]').click();
    await page.locator('[data-tr-input]').fill('Em đi đâu?');
    await page.locator('[data-tr-submit]').click();
    await expect(page.locator('[data-tr-ja-big]')).toHaveText('どこに行きますか？');
    await expect(page.locator('[data-tr-show]')).toBeHidden();
    await expect(page.locator('[data-tr-note-wrap]')).toBeHidden();
  });

  test('explains when the service is not configured', async ({ page }) => {
    await page.route('**/api/translate/', (route) => route.fulfill({ status: 503, body: '{}' }));
    await page.goto('/guide/');
    await page.locator('.translate-fab').click();
    await page.locator('[data-tr-input]').fill('こんにちは');
    await page.locator('[data-tr-submit]').click();
    await expect(page.locator('[data-tr-error]')).toContainText('準備中');
  });
});
