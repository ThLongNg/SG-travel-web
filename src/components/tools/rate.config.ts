// Owner: Agent C. Exchange rate used by the VND ⇄ JPY converter (/guide/) and formatPrice() in
// src/lib/format.ts. Keep the export name and shape.
//
// How to update: take the JPY per 1 VND rate from an official source (e.g. a Vietnamese bank's
// exchange-rate page), put it in `jpyPerVnd`, set `asOf` to the date you read it (YYYY-MM-DD)
// and `source` to the page name. The date is shown next to the converter.
//
// TODO: 要確認 — placeholder value carried over from phase 0, not a verified rate.
export const rate = {
  /** JPY per 1 VND */
  jpyPerVnd: 0.006,
  /** ISO date the rate was taken */
  asOf: '2026-11-11',
  source: 'TODO: 要確認',
} as const;
