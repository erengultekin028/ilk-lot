// Tam yedek mantığının denetimi (public/src/admin/backup.js). Çalıştırma: node tools/check-backup.mjs
import assert from 'node:assert/strict';
import { BACKUP_FORMAT, backupFileName, buildBackup, verifyBackup } from '../public/src/admin/backup.js';

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log('GEÇTİ  ' + name);
}

const participants = [
  { code: 'AAAA', grp: 'A', consentAt: '2026-10-25T10:00:00Z' },
  { code: 'BBBB', grp: 'B', withdrawn: true },
  { code: 'CCCC', grp: 'A', withdrawn: true, testRecord: true },
];
const eventsByCode = {
  AAAA: [
    { type: 'session_start', n: 1 },
    { type: 'trial_show', n: 2 },
  ],
  BBBB: [{ type: 'session_start', n: 1 }],
};
const allocations = { AAAA: { grp: 'A', no: 1 }, BBBB: { grp: 'B', no: 2 }, CCCC: { grp: 'A', no: 3 } };
const input = {
  participants,
  eventsByCode,
  allocations,
  appVersion: '2026.10.25-b34',
  exportedAt: '2026-10-26T09:00:00Z',
  exportedBy: 'a@b.c',
};

check('yedek: katılımcılar olaylarıyla birleşir; çekilmiş ve test kayıtları da dahildir', () => {
  const backup = buildBackup(input);
  assert.equal(backup.format, BACKUP_FORMAT);
  assert.equal(backup.participants.length, 3);
  assert.deepEqual(backup.participants.find((item) => item.code === 'AAAA').events.length, 2);
  assert.deepEqual(backup.participants.find((item) => item.code === 'CCCC').events, []); // olayı olmayan kayıt boş dizi alır
  assert.equal(backup.participants.find((item) => item.code === 'BBBB').withdrawn, true);
  assert.equal(backup.participants.find((item) => item.code === 'CCCC').testRecord, true);
});

check('yedek: sayımlar içerikle uyuşur (katılımcı, olay, liste, test kaydı, gerçek çekilme)', () => {
  const backup = buildBackup(input);
  assert.deepEqual(backup.counts, {
    participants: 3,
    events: 3,
    allocations: 3,
    testRecords: 1,
    withdrawn: 1,
  });
  assert.equal(backup.appVersion, '2026.10.25-b34');
  assert.equal(backup.exportedBy, 'a@b.c');
});

check('yedek: doğrulama sağlam yedekte sorun bulmaz; sayım ya da kod bozulursa yakalar', () => {
  assert.deepEqual(verifyBackup(buildBackup(input)), []);
  const bozukSayim = buildBackup(input);
  bozukSayim.counts.events = 99;
  assert.ok(verifyBackup(bozukSayim).length > 0);
  const eksikKatilimci = buildBackup(input);
  eksikKatilimci.participants.pop();
  assert.ok(verifyBackup(eksikKatilimci).length > 0);
  const kodsuz = buildBackup(input);
  delete kodsuz.participants[0].code;
  assert.ok(verifyBackup(kodsuz).length > 0);
  assert.ok(verifyBackup({ format: 'baska' }).length > 0);
});

check('yedek: girdi nesneleri değiştirilmez ve JSON olarak gidip gelir', () => {
  const kopya = JSON.stringify(input);
  const backup = buildBackup(input);
  assert.equal(JSON.stringify(input), kopya);
  assert.deepEqual(JSON.parse(JSON.stringify(backup)), backup);
});

check('yedek: dosya adı tarih taşır ve GIZLI işaretlidir', () => {
  assert.equal(backupFileName('2026-10-26T09:00:00Z'), 'ilklot_tam_yedek_GIZLI_2026-10-26.json');
});

console.log('\n' + passed + ' denetim geçti.');
