import type { Page } from '@playwright/test';

declare global {
  interface Window {
    __spoken: { text: string; lang: string }[];
    __wake: { requested: number; released: number };
  }
}

/**
 * Replace speechSynthesis with a fake whose voice list we control.
 * Real engines differ per OS/CI image, so tests must not depend on installed voices.
 */
export async function mockSpeech(page: Page, voices: { lang: string; name: string }[]) {
  await page.addInitScript((list) => {
    window.__spoken = [];
    class FakeUtterance {
      text: string;
      lang = '';
      rate = 1;
      voice: unknown = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    const fake = {
      speaking: false,
      pending: false,
      paused: false,
      onvoiceschanged: null,
      getVoices: () =>
        list.map((v) => ({ ...v, default: false, localService: true, voiceURI: v.name })),
      speak: (u: FakeUtterance) => window.__spoken.push({ text: u.text, lang: u.lang }),
      cancel() {},
      pause() {},
      resume() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => true,
    };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: FakeUtterance,
      configurable: true,
    });
  }, voices);
}

/** Fake Wake Lock API that records request/release calls. */
export async function mockWakeLock(page: Page) {
  await page.addInitScript(() => {
    window.__wake = { requested: 0, released: 0 };
    const wakeLock = {
      request: async () => {
        window.__wake.requested++;
        const handlers: (() => void)[] = [];
        return {
          released: false,
          type: 'screen',
          addEventListener: (_: string, fn: () => void) => handlers.push(fn),
          release: async () => {
            window.__wake.released++;
            handlers.forEach((fn) => fn());
          },
        };
      },
    };
    Object.defineProperty(navigator, 'wakeLock', { value: wakeLock, configurable: true });
  });
}
