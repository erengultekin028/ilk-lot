// Test kayıtlarını ayırma mantığı (saf işlevler: DOM ve Firebase yok, ayrı test edilebilir).
// Politika A (soft delete): kayıt silinmez; "withdrawn: true" ile işaretlenir, böylece pano ve dışa aktarma onu zaten dışarıda bırakır.
// Gerçek çekilmeden ayırt edilsin diye ek olarak testRecord alanları yazılır; işaret geri alınabilir.
// Veri sözleşmesine eklenen isteğe bağlı alanlar: testRecord, testMarkedAt, testMarkedBy, testPrevWithdrawn, testUnmarkedAt.

// Sürüm dizesinden ("2026.10.25-b31") yapı numarasını (31) çıkarır; tanınmazsa 0
export function buildNumber(version) {
  const match = /-b(\d+)$/.exec(String(version || ''));
  return match ? Number(match[1]) : 0;
}

// Bir katılımcı belgesinden tablo satırı çıkarır. slotNumber: randomizasyon listesindeki yuva numarası (yoksa null)
export function describeRecord(participant, slotNumber) {
  const session = participant.sess_1 || null;
  const cooldown = session && session.cd ? session.cd : null;
  const version = participant.lastVersion || (session && session.v) || '';
  return {
    code: participant.code,
    grp: participant.grp || '',
    slot: slotNumber == null ? null : slotNumber,
    version: version,
    build: buildNumber(version),
    consentAt: participant.consentAt || null,
    updatedAt: participant.updatedAt || (session && session.updatedAt) || null,
    started: !!session,
    ended: !!(session && session.ended),
    cooldownShown: cooldown && cooldown.n ? cooldown.n : 0,
    withdrawn: !!participant.withdrawn,
    marked: participant.testRecord === true,
  };
}

// Süzgeçler. currentBuild: şu anki uygulamanın yapı numarası
export const RECORD_FILTERS = [
  ['unmarked', 'İşaretsiz'],
  ['old', 'Eski sürüm'],
  ['cooldown', 'Bekleme ekranı görenler'],
  ['incomplete', 'Tamamlanmayan'],
  ['marked', 'İşaretli'],
];

export function matchesFilter(row, filterKey, currentBuild) {
  if (filterKey === 'marked') return row.marked;
  if (row.marked) return false;
  if (filterKey === 'old') return row.build < currentBuild;
  if (filterKey === 'cooldown') return row.cooldownShown > 0;
  if (filterKey === 'incomplete') return !row.ended;
  return true; // unmarked
}

export function filterRecords(rows, filterKey, currentBuild) {
  return rows.filter(function (row) {
    return matchesFilter(row, filterKey, currentBuild);
  });
}

// İşaretleme: kayıt çekilmiş gibi davranır (withdrawn) ve test olarak not edilir. Önceki çekilme durumu geri alma için saklanır.
export function markFields(participant, markedBy, nowIso) {
  return {
    withdrawn: true,
    testRecord: true,
    testMarkedAt: nowIso,
    testMarkedBy: markedBy || null,
    testPrevWithdrawn: !!participant.withdrawn,
  };
}

// Geri alma: çekilme durumu işaretlemeden önceki haline döner (gerçek çekilme korunur)
export function unmarkFields(participant, nowIso) {
  return {
    withdrawn: participant.testPrevWithdrawn === true,
    testRecord: false,
    testUnmarkedAt: nowIso,
  };
}

// Seçilen kodlar için yazılacak güncellemeler: [{ code, fields }]. Zaten işaretli ya da işaretsiz olanlar atlanır.
export function planMark(sourceByCode, codes, markedBy, nowIso) {
  return codes
    .filter(function (code) {
      return sourceByCode[code] && sourceByCode[code].testRecord !== true;
    })
    .map(function (code) {
      return { code: code, fields: markFields(sourceByCode[code], markedBy, nowIso) };
    });
}

export function planUnmark(sourceByCode, codes, nowIso) {
  return codes
    .filter(function (code) {
      return sourceByCode[code] && sourceByCode[code].testRecord === true;
    })
    .map(function (code) {
      return { code: code, fields: unmarkFields(sourceByCode[code], nowIso) };
    });
}

// Dışa aktarma ve pano için: bu kayıt analize girer mi? (çekilmemiş ve test değil)
export function isAnalyzable(participant) {
  return !participant.withdrawn && participant.testRecord !== true;
}
