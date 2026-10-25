// Randomizasyon listesi üretimi (yönetim paneli): katılım kodları ve 4'lük bloklu A/B ataması.
// ARAŞTIRMA: Her 4 kişilik blokta 2 A + 2 B bulunur (sırası gizli rastgele); böylece gruplar her zaman dengeli doldurulur.

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
