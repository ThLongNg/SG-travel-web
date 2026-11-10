// Owner: Agent C. UI strings needed by C's pages that are not (yet) keys in src/i18n/ja.json.
// Proposed as new keys in docs/change-requests/agent-C.md — the Integrator can move them into the
// i18n JSON files and replace `xt()` with `t()`. Missing vi/en entries fall back to Japanese.
import type { Locale } from '../../lib/i18n';

const ja = {
  'phrases.all': 'すべて',
  'phrases.count': '{n}フレーズ',
  'phrases.groupsLabel': 'シーンで選ぶ',
  'phrases.showModeHeading': '見せるモード',
  'phrases.wakeLockOn': '表示中は画面がスリープしません',
  'phrases.swipeToClose': '下にスワイプして閉じる',
  'phrases.searchResults': '検索結果',
  'guide.categories': '旅の基本情報',
  'guide.jumpTo': '項目へ移動',
  'guide.cat.visa': 'ビザ・入国',
  'guide.cat.money': 'お金・両替',
  'guide.cat.sim': 'SIM・通信',
  'guide.cat.grab': 'Grab・移動',
  'guide.cat.tip': 'チップ',
  'guide.cat.safety': '安全・トラブル',
  'guide.cat.hygiene': '衛生・飲み水',
  'guide.cat.power': '電圧・プラグ',
  'guide.cat.weather': '季節と天気',
  'guide.cat.manners': 'マナー・文化',
  'guide.amount': '金額',
  'guide.quick': 'よく使う金額',
  'guide.rateSource': '出典',
  'contact.or': 'または',
  'contact.requiredTag': '必須',
  'contact.formTitle': 'フォームで送る',
  'contact.lineLead': 'LINE公式アカウントからも受け付けています。',
  'contact.privacyNote': '送信内容の取り扱いは{link}をご覧ください。',
  'contact.errorSummary': '入力内容を確認してください。',
  'offline.title': 'オフラインです',
  'offline.lead': '保存済みの指さし会話帳は電波がなくても使えます。',
} as const;

export type XKey = keyof typeof ja;

const en: Partial<Record<XKey, string>> = {
  'phrases.all': 'All',
  'phrases.count': '{n} phrases',
  'phrases.groupsLabel': 'Choose a situation',
  'phrases.showModeHeading': 'Show mode',
  'phrases.wakeLockOn': 'The screen stays on while this is shown',
  'phrases.swipeToClose': 'Swipe down to close',
  'phrases.searchResults': 'Results',
  'guide.categories': 'Travel basics',
  'guide.jumpTo': 'Jump to a topic',
  'guide.amount': 'Amount',
  'guide.quick': 'Common amounts',
  'guide.rateSource': 'Source',
  'contact.or': 'or',
  'contact.requiredTag': 'Required',
  'contact.formTitle': 'Send a message',
  'contact.lineLead': 'You can also reach us on our LINE Official Account.',
  'contact.privacyNote': 'See our {link} for how we handle your message.',
  'contact.errorSummary': 'Please check the highlighted fields.',
};

const vi: Partial<Record<XKey, string>> = {
  'phrases.all': 'Tất cả',
  'phrases.count': '{n} câu',
  'phrases.groupsLabel': 'Chọn tình huống',
  'phrases.showModeHeading': 'Chế độ hiển thị',
  'phrases.wakeLockOn': 'Màn hình sẽ không tắt khi đang hiển thị',
  'phrases.swipeToClose': 'Vuốt xuống để đóng',
  'phrases.searchResults': 'Kết quả',
  'guide.categories': 'Thông tin cơ bản',
  'guide.jumpTo': 'Đi tới mục',
  'guide.amount': 'Số tiền',
  'guide.quick': 'Số tiền thường dùng',
  'guide.rateSource': 'Nguồn',
  'contact.or': 'hoặc',
  'contact.requiredTag': 'Bắt buộc',
  'contact.formTitle': 'Gửi tin nhắn',
  'contact.lineLead': 'Bạn cũng có thể liên hệ qua LINE Official Account.',
  'contact.privacyNote': 'Xem {link} để biết cách chúng tôi xử lý thông tin.',
  'contact.errorSummary': 'Vui lòng kiểm tra lại các mục đã đánh dấu.',
};

const dicts: Record<Locale, Partial<Record<XKey, string>>> = { ja, vi, en };

/** Like t() for C's extra strings; falls back to Japanese. */
export function xt(lang: Locale, key: XKey, vars: Record<string, string | number> = {}): string {
  const s = dicts[lang][key] ?? ja[key];
  return s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
