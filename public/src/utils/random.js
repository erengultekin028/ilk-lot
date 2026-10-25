// Tohumlu rastgele sayı üreticileri. Herkes aynı uyaranı görsün diye tüm rastgelelik tohumludur.

import { CONFIG } from '../constants/app-config.js';

// ═════════════════ TOHUMLU RASTGELELİK ═════════════════
// Uyaranlar (grafikler, haberler, sonuçlar) bu tohumdan üretilir: herkes aynı 16 anı aynı sırayla görür.
export function hashSeed(text) {
  let html = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    html = Math.imul(html ^ text.charCodeAt(i), 3432918353);
    html = (html << 13) | (html >>> 19);
  }
  return html >>> 0;
}

export const rngState = { main: hashSeed(CONFIG.seed), market: 1 };

export function random() {
  rngState.main = (rngState.main + 0x6d2b79f5) >>> 0;
  let value = rngState.main;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

export function randomBetween(min, max) {
  return min + random() * (max - min);
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const value = array[i];
    array[i] = array[j];
    array[j] = value;
  }
  return array;
}

export function marketRandom() {
  rngState.market = (rngState.market + 0x6d2b79f5) >>> 0;
  let value = rngState.market;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}
