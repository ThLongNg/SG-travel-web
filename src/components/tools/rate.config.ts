// Owner: Agent C. Exchange rate used by the VND ⇄ JPY converter (/guide/) and formatPrice() in
// src/lib/format.ts. Keep the export name and shape.
//
// How to update: take the JPY per 1 VND rate from an official source (e.g. a Vietnamese bank's
// exchange-rate page), put it in `jpyPerVnd`, set `asOf` to the date you read it (YYYY-MM-DD)
// and `source` to the page name. The date is shown next to the converter.
//
// Taken from Vietcombank's JPY "cash buying" rate (what a bank pays for yen banknotes, i.e. what a
// tourist gets): 155.52 VND per 1 JPY, updated 23:00 on 2026-11-11 → 1 / 155.52 ≈ 0.00643.
// shortcut: static value, refresh by hand before the trip (rates drift a few % a month).
export const rate = {
  /** JPY per 1 VND */
  jpyPerVnd: 0.00643,
  /** ISO date the rate was taken */
  asOf: '2026-11-11',
  source: 'Vietcombank 為替レート（JPY 現金買い 155.52）',
} as const;
