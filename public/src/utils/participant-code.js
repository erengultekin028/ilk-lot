// Katılım kodu üretimi, doğrulama ve biçimlendirme; randomizasyon listesi üretimi.

import { CONFIG, DEMO_MODE } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';

// ═════════════════ KOD VE RANDOMİZASYON ═════════════════
// Kod: 12 karakter, KM7D-P2XR-9TQA biçiminde. Karıştırılan karakterler (0/O, 1/I) alfabede yok.
// 32^12 ≈ 10^18 olasılık: tahmin etmek pratikte imkânsız. Sıra numarası koda gömülü değil, sadece araştırmacıda.
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function secureRandomInt(max) {
  const items = new Uint32Array(1);
  (window.crypto || window.msCrypto).getRandomValues(items);
  return items[0] % max;
}

function generateCode() {
  let text = '';
  for (let i = 0; i < 12; i++) {
    text += CODE_ALPHABET[secureRandomInt(32)];
    if (i === 3 || i === 7) text += '-';
  }
  return text;
}

// Boşluk, tire, küçük harf fark etmez; 12 karakter değilse geçersiz
export function normalizeCode(input) {
  const text = String(input || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return text.length === 12 ? text.slice(0, 4) + '-' + text.slice(4, 8) + '-' + text.slice(8) : null;
}

// Yazarken 4'erli gruplara ayırır: "km7dp2" → "KM7D-P2"
export function formatCodeInput(input) {
  return String(input || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)
    .replace(/(.{4})(?=.)/g, '$1-');
}

// Blok randomizasyon: her 4 kişilik blokta 2 A + 2 B, sırası gizli rastgele. Grup sayıları hiçbir zaman 2'den fazla açılmaz
export function buildAllocationList(count, blockSize, startIndex) {
  const map = {};
  let i = 0;
  startIndex = startIndex || 0;
  while (i < count) {
    const items = [];
    for (var key = 0; key < blockSize; key++) items.push([key < blockSize / 2 ? 'A' : 'B', key % 2]);
    for (key = items.length - 1; key > 0; key--) {
      const j = secureRandomInt(key + 1);
      const innerValue = items[key];
      items[key] = items[j];
      items[j] = innerValue;
    }
    for (key = 0; key < items.length && i < count; key++, i++) {
      var value;
      do {
        value = generateCode();
      } while (map[value]);
      map[value] = {
        grp: items[key][0],
        order: items[key][1],
        no: startIndex + i + 1,
        block: Math.floor((startIndex + i) / blockSize) + 1,
      };
    }
  }
  return map;
}

export function participantLinkFor(code) {
  const base = (state.baseUrlInput || CONFIG.baseUrl || location.origin + location.pathname).split('#')[0];
  return base + '#k=' + code;
}

export function rememberCode(code) {
  if (DEMO_MODE) return;
  try {
    code ? localStorage.setItem('ilklot:me', code) : localStorage.removeItem('ilklot:me');
  } catch (error) {}
}

export function rememberedCode() {
  if (DEMO_MODE) return null;
  try {
    return localStorage.getItem('ilklot:me');
  } catch (error) {
    return null;
  }
}

export function maskCode(code) {
  return '••••-••••-' + String(code).slice(-4);
}
