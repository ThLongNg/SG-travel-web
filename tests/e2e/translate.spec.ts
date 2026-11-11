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

  test('cache: the same sentence again needs no API call; ★ saved works offline', async ({
    page,
    context,
  }) => {
    let calls = 0;
    await page.route('**/api/translate/', (route) => {
      calls++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reply),
      });
    });
    await page.goto('/spots/');
    await page.locator('.translate-fab').click();
    const ask = async () => {
      await page.locator('[data-tr-input]').fill('辛くしないでください');
      await page.locator('[data-tr-submit]').click();
      await expect(page.locator('[data-tr-vi]')).toHaveText(reply.vi);
    };
    await ask();
    await ask();
    expect(calls).toBe(1);

    await page.locator('[data-tr-save]').click();
    await expect(page.locator('[data-tr-save]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-tr-saved-list] li')).toHaveCount(1);

    // after a reload, offline: the saved phrase still opens and shows full screen
    await page.reload();
    await context.setOffline(true);
    await page.locator('.translate-fab').click();
    await page.locator('[data-tr-saved-list] [data-s-open]').click();
    await expect(page.locator('[data-tr-vi]')).toHaveText(reply.vi);
    await page.locator('[data-tr-show]').click();
    await expect(page.locator('#show-mode [data-sm-vi]')).toHaveText(reply.vi);
    await context.setOffline(false);
  });

  test('voice input fills the box and translates (vi→ja uses vi-VN)', async ({ page }) => {
    await page.addInitScript(() => {
      // Fake Web Speech API: speaks one Vietnamese sentence, then ends.
      class FakeRecognition {
        lang = '';
        interimResults = false;
        onresult: ((e: unknown) => void) | null = null;
        onerror: ((e: unknown) => void) | null = null;
        onend: (() => void) | null = null;
        start() {
          (window as unknown as { __srLang: string }).__srLang = this.lang;
          setTimeout(() => {
            this.onresult?.({ results: [[{ transcript: 'Em ăn cay được không?' }]] });
            this.onend?.();
          }, 50);
        }
        stop() {
          this.onend?.();
        }
      }
      const w = window as unknown as Record<string, unknown>;
      w.SpeechRecognition = FakeRecognition; // Chromium has an unprefixed one
      w.webkitSpeechRecognition = FakeRecognition;
    });
    let sent: unknown = null;
    await page.route('**/api/translate/', (route) => {
      sent = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          vi: 'Em ăn cay được không?',
          kana: '',
          ja: '辛いものは大丈夫ですか？',
          note: '',
        }),
      });
    });
    await page.goto('/');
    await page.locator('.translate-fab').click();
    await page.locator('[data-tr-dir="vi-ja"]').click();
    await page.locator('[data-tr-mic]').click();
    await expect(page.locator('[data-tr-ja-big]')).toHaveText('辛いものは大丈夫ですか？');
    expect(sent).toEqual({ text: 'Em ăn cay được không?', dir: 'vi-ja' });
    expect(await page.evaluate(() => (window as unknown as { __srLang: string }).__srLang)).toBe(
      'vi-VN',
    );
  });

  test('menu photo: items in Japanese with yen, ★ picks, これください → full screen', async ({
    page,
  }) => {
    let body: { mode?: string; mime?: string; image?: string } = {};
    await page.route('**/api/translate/', (route) => {
      body = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tip: '55kは5万5千ドンのことです。',
          items: [
            {
              vi: 'PHỞ BÒ TÁI',
              kana: 'フォー ボー タイ',
              ja: 'レア牛肉のフォー',
              desc: '薄切り牛肉',
              priceVnd: 55000,
              pick: true,
            },
            {
              vi: 'TRÀ ĐÁ',
              kana: 'チャー ダー',
              ja: '冷たいお茶',
              desc: '',
              priceVnd: 5000,
              pick: false,
            },
          ],
        }),
      });
    });
    await page.goto('/eat/');
    await page.locator('.translate-fab').click();
    // 1×1 PNG stands in for the camera photo
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    await page
      .locator('[data-tr-camera]')
      .setInputFiles({ name: 'menu.png', mimeType: 'image/png', buffer: png });
    const items = page.locator('[data-tr-menu-list] li');
    await expect(items).toHaveCount(2);
    expect(body.mode).toBe('menu');
    expect(body.mime).toBe('image/jpeg'); // resized/re-encoded on the device
    await expect(items.first().locator('[data-m-pick]')).toBeVisible();
    await expect(items.nth(1).locator('[data-m-pick]')).toBeHidden();
    await expect(items.first().locator('[data-m-price]')).toContainText('55,000ドン');
    await expect(items.first().locator('[data-m-price]')).toContainText('円');

    await items.first().locator('[data-m-order]').click();
    await expect(page.locator('#show-mode [data-sm-vi]')).toHaveText('Cho em phở bò tái nha');
  });
});
