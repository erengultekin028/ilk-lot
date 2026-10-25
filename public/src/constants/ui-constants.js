// Arayüz sabitleri: etiketler, seçenekler, ilerleme ağırlıkları, geri bildirim soruları.

import { CONFIG } from './app-config.js';
import { formatNumber } from '../utils/format.js';

// ───────────────── Demografik form ─────────────────
// Sadece analizde kontrol değişkeni olacak, kimlik belirlemeyen kaba kategoriler.
// 18 yaş sorusu zorunlu (katılım koşulu), gerisi isteğe bağlı.
export const DEMOGRAPHIC_OPTIONS = {
  adult: ['Evet', 'Hayır'],
  age: ['18–20', '21–23', '24–26', '27 ve üzeri', 'Belirtmek istemiyorum'],
  gender: ['Kadın', 'Erkek', 'Diğer', 'Belirtmek istemiyorum'],
  field: ['İktisadi ve idari bilimler', 'Mühendislik ve fen', 'Sağlık', 'Sosyal ve beşeri', 'Diğer'],
  year: ['Hazırlık / 1', '2', '3', '4 ve üzeri', 'Lisansüstü'],
  inv: ['Hisse senedi', 'Kripto', 'Yatırım fonu', 'Altın / döviz', 'Hiç yapmadım'],
  sim: ['Evet', 'Hayır'],
};

export const CHOICE_LABELS = {
  sat: ['Sat', 'Hissenin tamamını sat, parayı al'],
  tut: ['Tut', 'Bir şey yapma, hisse sende kalsın'],
  al: ['Daha al', '₺' + formatNumber(CONFIG.addAmount, 0) + "'lik daha al"],
};

// Pilot geri bildirimi (yalnızca PILOT açıkken, bilgilendirmeden SONRA): 3 isteğe bağlı soru. Gerçek veri toplamada hiç çıkmaz.
export const PILOT_FEEDBACK_QUESTIONS = [
  [
    'clear',
    'Ne yapman gerektiğini ilk dakikada anladın mı?',
    ['1', '2', '3', '4', '5'],
    '1 = hiç anlamadım, 5 = tamamen anladım',
  ],
  ['dur', 'Toplam süre sana nasıl geldi?', ['Çok kısa', 'Uygun', 'Uzun', 'Çok uzun']],
  ['unease', 'Çalışma sırasında rahatsız ya da çok gergin hissettin mi?', ['Hayır', 'Biraz', 'Evet']],
];

// Yazı boyutu seçici (b22): Normal / Büyük / Çok büyük; tercih cihazda tutulur, seçim katılımcı koduyla fs_set olayı olarak kaydedilir
export const FONT_SIZE_LEVELS = [
  ['Normal', 'Normal yazı boyutu'],
  ['Büyük', 'Büyük yazı boyutu'],
  ['Çok büyük', 'Çok büyük yazı boyutu'],
];

// ═════════════════ GENEL İLERLEME ═════════════════
// 5 adım: Hazırlık → 1. bölüm → 2. bölüm (simülatör) → 3. bölüm → Bitiş. Geçerli adım, kendi içindeki ilerlemeyle kısmen dolar
export const PROGRESS_LABELS = ['Hazırlık', '1. bölüm', '2. bölüm', '3. bölüm', 'Bitiş'];

export const PROGRESS_WEIGHTS = [0.18, 0.19, 0.28, 0.19, 0.16];
