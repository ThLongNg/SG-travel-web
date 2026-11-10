// Converter (/guide/), contact form validation (/contact/), keyboard use of the tab bar.
import { expect, test } from '@playwright/test';
import { rate } from '../../src/components/tools/rate.config';

const yen = (vnd: number) => Math.round(vnd * rate.jpyPerVnd).toLocaleString('ja-JP');

test.describe('VND ⇄ JPY converter', () => {
  test('converts both ways and shows the rate date', async ({ page }) => {
    await page.goto('/guide/');
    const [y, m, d] = rate.asOf.split('-').map(Number);
    await expect(page.locator('[data-rate-date]')).toContainText(`${y}年${m}月${d}日`);

    const vnd = page.locator('#cv-vnd');
    const jpy = page.locator('#cv-jpy');
    await vnd.fill('250000');
    await expect(jpy).toHaveValue(yen(250000));

    await jpy.fill('1000');
    await expect(vnd).toHaveValue(Math.round(1000 / rate.jpyPerVnd).toLocaleString('ja-JP'));

    await page.locator('[data-cv-quick="50000"]').click();
    await expect(vnd).toHaveValue('50,000');
    await expect(jpy).toHaveValue(yen(50000));
  });

  test('guide cards: deep links resolve and external links open safely', async ({ page }) => {
    // the home page links to /guide/#<guide id>; every card must carry that id
    await page.goto('/guide/#payment');
    // cards are collapsed by default; the deep-linked one opens itself
    await expect(page.locator('details#payment')).toHaveAttribute('open', '');
    await expect(page.locator('details#sim')).not.toHaveAttribute('open', '');
    await expect(page.locator('details#payment ol li')).toHaveCount(4);
    // eSIM purchase button (the card's call to action), visible once the card is opened
    await page.locator('details#sim summary').click();
    const esim = page.locator('details#sim a[href*="trip.com"]');
    await expect(esim).toBeVisible();
    await expect(esim).toHaveAttribute('target', '_blank');
    await expect(esim).toHaveAttribute('rel', /noopener/);
    // internal markers never reach readers
    await expect(page.locator('main')).not.toContainText('TODO');
    // food & souvenir tips live on their own page (/eat/), not here
    await expect(page.locator('details#shopping')).toHaveCount(0);
  });

  test('eat page: sign cards open a sheet, 見せる shows the order phrase, chips filter', async ({
    page,
  }) => {
    await page.goto('/eat/');
    await page.locator('[data-sheet-open="dish-pho"]').click();
    await expect(page.locator('dialog#dish-pho')).toHaveAttribute('open', '');
    await page.locator('dialog#dish-pho [data-show]').first().click();
    await expect(page.locator('#show-mode [data-sm-vi]')).toHaveText('Cho tôi một tô phở bò');
    await page.locator('#show-mode [data-show-close]').click();
    await page.locator('dialog#dish-pho [data-sheet-close]').click();

    // drinks chip leaves only drink cards in the food section
    await page.locator('section[aria-labelledby="eat-food"] [data-cat="drink"]').click();
    const visible = page.locator('section[aria-labelledby="eat-food"] li[data-item-cat]:visible');
    await expect(visible).toHaveCount(2);
    await expect(page.locator('details#shopping')).toHaveCount(1);
  });
});

test.describe('contact form', () => {
  test('shows Japanese validation errors', async ({ page }) => {
    await page.goto('/contact/');
    await page.getByRole('button', { name: '送信する' }).click();
    await expect(page.locator('[data-err]:visible')).toHaveCount(3);
    await expect(page.locator('#c-name-err')).toHaveText('必須項目です');
    await expect(page.locator('#c-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#c-name')).toBeFocused();

    await page.locator('#c-name').fill('山田 太郎');
    await page.locator('#c-email').fill('not-an-email');
    await page.locator('#c-message').fill('テストです');
    await page.getByRole('button', { name: '送信する' }).click();
    await expect(page.locator('#c-email-err')).toHaveText('メールアドレスの形式が正しくありません');
    await expect(page.locator('#c-name')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('posts to Formspree when configured, otherwise says 準備中', async ({ page }) => {
    await page.goto('/contact/');
    const configured = await page.locator('form[data-contact][data-configured]').count();
    let posted = false;
    await page.route('https://formspree.io/**', (route) => {
      posted = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.locator('#c-name').fill('山田 太郎');
    await page.locator('#c-email').fill('taro@example.com');
    await page.locator('#c-message').fill('テストです');
    await page.getByRole('button', { name: '送信する' }).click();
    const status = page.locator('[data-status]');
    if (configured) {
      await expect(status).toHaveText('送信しました。ありがとうございます。');
      expect(posted).toBe(true);
    } else {
      await expect(status).toHaveText('現在準備中です');
      expect(posted).toBe(false);
    }
  });
});

test.describe('tab bar keyboard access', () => {
  test('every tab is reachable with Tab and activates with Enter', async ({
    page,
    browserName,
  }) => {
    await page.goto('/privacy/');
    const links = page.locator('nav.glass-tabbar a');
    const n = await links.count();
    expect(n).toBe(5);

    const hrefs = await links.evaluateAll((els) => els.map((a) => a.getAttribute('href')));
    const outline = () =>
      page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);

    if (browserName === 'webkit') {
      // Safari (and Playwright WebKit) only moves Tab focus to links when the user enables
      // "Press Tab to highlight each item", so Tab can't be simulated here. Check instead that
      // every tab is focusable, shows a focus ring and activates with Enter.
      for (let i = 0; i < n; i++) {
        await links.nth(i).focus();
        await expect(links.nth(i)).toBeFocused();
        expect(await outline(), 'visible focus ring').not.toBe('none');
      }
      await links.nth(3).focus();
    } else {
      const inBar = () =>
        page.evaluate(() => !!document.activeElement?.closest('nav.glass-tabbar'));
      let steps = 0;
      while (!(await inBar()) && steps++ < 120) await page.keyboard.press('Tab');
      expect(await inBar(), 'reached the tab bar with the keyboard').toBe(true);

      const seen: (string | null)[] = [];
      for (let i = 0; i < n; i++) {
        seen.push(await page.evaluate(() => document.activeElement!.getAttribute('href')));
        expect(await outline(), 'visible focus ring').not.toBe('none');
        if (i < n - 1) await page.keyboard.press('Tab');
      }
      expect(seen).toEqual(hrefs);
      await page.keyboard.press('Shift+Tab'); // back to the 4th tab (会話帳)
    }

    // Activate "会話帳" with Enter.
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/phrases\/$/);
    await expect(page.locator('nav.glass-tabbar a[aria-current="page"]')).toHaveAttribute(
      'href',
      '/phrases/',
    );
  });
});

test.describe('spots: nearest first', () => {
  // Standing next to the Ben Duoc tunnels: the Cu Chi card must come first, with a distance badge.
  test.use({ geolocation: { latitude: 11.14, longitude: 106.46 }, permissions: ['geolocation'] });

  test('sorts cards by distance from the real location', async ({ page }) => {
    await page.goto('/spots/');
    await page.locator('[data-near]').click();
    const first = page.locator('li[data-spot]').first();
    await expect(first.locator('a').first()).toHaveAttribute('href', /\/spots\/cu-chi-tunnels\/$/);
    await expect(first.locator('[data-dist]')).toHaveText(/^\d+(\.\d)?k?m$/);
    await expect(page.locator('[data-near]')).toHaveAttribute('aria-pressed', 'true');
  });
});
