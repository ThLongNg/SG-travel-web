// Shared client helpers for Vietnamese speech (speechSynthesis, vi-VN) and 見せるモード.
// Used by the phrasebook (/phrases/) and the eat & shop page (/eat/). Needs <ShowMode> on the page.
//
// - [data-speak] buttons are hidden while the device has no Vietnamese voice.
// - [data-no-voice] notes are shown once we know there is no Vietnamese voice.

export interface PhraseTools {
  speak: (vi: string) => void;
  show: (ja: string, vi: string, kana: string) => void;
}

export function phraseTools(): PhraseTools | null {
  const dialog = document.querySelector<HTMLDialogElement>('#show-mode');
  if (!dialog) return null;

  // ───── Speech (vi-VN) ─────
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let voice: SpeechSynthesisVoice | null = null;
  let decided = false;
  const replay = dialog.querySelector<HTMLButtonElement>('[data-sm-replay]')!;
  const smNoVoice = dialog.querySelector<HTMLElement>('[data-sm-novoice]')!;
  const render = () => {
    for (const b of document.querySelectorAll<HTMLElement>('[data-speak]')) b.hidden = !voice;
    for (const n of document.querySelectorAll<HTMLElement>('[data-no-voice]'))
      n.hidden = !decided || !!voice;
    replay.hidden = !voice;
    smNoVoice.hidden = !decided || !!voice;
  };
  const pickVoice = () => {
    const voices = synth?.getVoices() ?? [];
    voice =
      voices.find((v) => /^vi[-_]VN$/i.test(v.lang)) ??
      voices.find((v) => /^vi\b/i.test(v.lang)) ??
      null;
    if (voice || voices.length) decided = true;
    render();
  };
  if (synth) {
    pickVoice();
    synth.addEventListener?.('voiceschanged', pickVoice);
    // Some engines never fire voiceschanged when they have no voices at all.
    setTimeout(() => {
      decided = true;
      pickVoice();
    }, 1500);
  } else {
    decided = true;
    render();
  }
  const speak = (text: string) => {
    if (!synth || !voice) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang || 'vi-VN';
    u.rate = 0.85;
    synth.speak(u);
  };

  // ───── 見せるモード ─────
  const smJa = dialog.querySelector<HTMLElement>('[data-sm-ja]')!;
  const smVi = dialog.querySelector<HTMLElement>('[data-sm-vi]')!;
  const smKana = dialog.querySelector<HTMLElement>('[data-sm-kana]')!;
  const wakeNote = dialog.querySelector<HTMLElement>('[data-sm-wake]')!;
  let lock: WakeLockSentinel | null = null;

  const keepAwake = async () => {
    if (!('wakeLock' in navigator) || lock) return;
    try {
      lock = await navigator.wakeLock.request('screen');
      wakeNote.hidden = false;
      lock.addEventListener('release', () => {
        lock = null;
        wakeNote.hidden = true;
      });
    } catch {
      wakeNote.hidden = true; // denied (battery saver, not visible…): the mode still works
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (dialog.open && document.visibilityState === 'visible') void keepAwake();
  });

  const show = (ja: string, vi: string, kana: string) => {
    smJa.textContent = ja;
    smVi.textContent = vi;
    smKana.textContent = kana;
    // a bottom sheet may be open underneath; the show mode goes on top of it
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    void keepAwake();
    speak(vi);
  };
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    synth?.cancel();
    void lock?.release();
    lock = null;
    wakeNote.hidden = true;
  });
  dialog.querySelector('[data-show-close]')!.addEventListener('click', () => dialog.close());
  replay.addEventListener('click', () => speak(smVi.textContent ?? ''));

  // Swipe down to close
  const inner = dialog.querySelector<HTMLElement>('.show-mode__inner')!;
  let y0: number | null = null;
  let dy = 0;
  dialog.addEventListener(
    'touchstart',
    (e) => {
      y0 = e.touches[0].clientY;
      dy = 0;
    },
    { passive: true },
  );
  dialog.addEventListener(
    'touchmove',
    (e) => {
      if (y0 === null) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      inner.style.transform = `translateY(${dy}px)`;
    },
    { passive: true },
  );
  dialog.addEventListener('touchend', () => {
    inner.style.transform = '';
    if (dy > 100) dialog.close();
    y0 = null;
    dy = 0;
  });

  return { speak, show };
}
