// Tam yedek (JSON): tüm katılımcı kayıtları, olayları ve randomizasyon listesi tek dosyada (saf işlevler: DOM ve Firebase yok).
// Çekilmiş ve test olarak işaretlenmiş kayıtlar da DAHİLDİR (yedek eksiksiz olmalı; işaretler kayıtta durur).
// GİZLİLİK: Dosya grup bilgisini (randomizasyon listesi) içerir; "GIZLI" adıyla indirilir ve katılımcıyla paylaşılmaz.
// users/claims (tarayıcı kimliği ↔ kod eşleşmesi) bilerek yedeğe girmez: kişisel olmasa da gereksiz bir bağdır.

export const BACKUP_FORMAT = 'ilklot-tam-yedek';
export const BACKUP_FORMAT_VERSION = 1;

// participants: [belge], eventsByCode: { kod: [olay] }, allocations: { kod: { grp, order, no, block } }
export function buildBackup(input) {
  const participants = (input.participants || []).map(function (item) {
    const events = (input.eventsByCode && input.eventsByCode[item.code]) || [];
    return { ...item, events: events };
  });
  const eventCount = participants.reduce(function (sum, item) {
    return sum + item.events.length;
  }, 0);
  const markedCount = participants.filter(function (item) {
    return item.testRecord === true;
  }).length;
  const withdrawnCount = participants.filter(function (item) {
    return item.withdrawn === true && item.testRecord !== true;
  }).length;
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: input.appVersion || '',
    exportedAt: input.exportedAt || '',
    exportedBy: input.exportedBy || null,
    counts: {
      participants: participants.length,
      events: eventCount,
      allocations: Object.keys(input.allocations || {}).length,
      testRecords: markedCount,
      withdrawn: withdrawnCount,
    },
    allocations: input.allocations || {},
    participants: participants,
  };
}

// Dosyanın bütünlüğünü denetler (geri yükleme ya da arşiv kontrolü): sayımlar içerikle uyuşuyor mu
export function verifyBackup(backup) {
  const problems = [];
  if (!backup || backup.format !== BACKUP_FORMAT) problems.push('Biçim tanınmıyor.');
  else {
    const participants = backup.participants || [];
    if (backup.counts.participants !== participants.length) problems.push('Katılımcı sayısı uyuşmuyor.');
    const eventCount = participants.reduce(function (sum, item) {
      return sum + (item.events ? item.events.length : 0);
    }, 0);
    if (backup.counts.events !== eventCount) problems.push('Olay sayısı uyuşmuyor.');
    if (backup.counts.allocations !== Object.keys(backup.allocations || {}).length)
      problems.push('Liste sayısı uyuşmuyor.');
    participants.forEach(function (item) {
      if (!item.code) problems.push('Kodsuz katılımcı kaydı var.');
    });
  }
  return problems;
}

export function backupFileName(isoDate) {
  return 'ilklot_tam_yedek_GIZLI_' + String(isoDate).slice(0, 10) + '.json';
}
