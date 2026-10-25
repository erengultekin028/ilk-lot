// Test kayıtlarını ayırma mantığının denetimi (public/src/admin/test-records.js). Çalıştırma: node tools/check-test-records.mjs
import assert from 'node:assert/strict';
import {
  buildNumber,
  describeRecord,
  filterRecords,
  isAnalyzable,
  planMark,
  planUnmark,
} from '../public/src/admin/test-records.js';

const NOW = '2026-10-25T18:00:00.000Z';
let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log('GEÇTİ  ' + name);
}

const participants = {
  OLD1: {
    code: 'OLD1',
    grp: 'A',
    lastVersion: '2026.10.25-b27',
    sess_1: { cd: { n: 2, v: 0, g: 0 }, ended: false },
  },
  OLD2: { code: 'OLD2', grp: 'B', lastVersion: '2026.10.25-b29', sess_1: { ended: true } },
  NEW1: { code: 'NEW1', grp: 'A', lastVersion: '2026.10.25-b31', sess_1: { ended: true, cd: { n: 1 } } },
  NEW2: { code: 'NEW2', grp: 'B', lastVersion: '2026.10.25-b31' }, // oturum başlamamış
  WD1: { code: 'WD1', grp: 'A', withdrawn: true, lastVersion: '2026.10.25-b31' }, // gerçek çekilme
  TST1: {
    code: 'TST1',
    grp: 'A',
    withdrawn: true,
    testRecord: true,
    testPrevWithdrawn: false,
    lastVersion: '2026.10.25-b28',
  },
};
const rows = Object.values(participants).map((item, index) => describeRecord(item, index + 1));
const codes = (list) => list.map((row) => row.code).sort();

check('sürüm numarası yapı kısmından okunur; tanınmayan sürüm 0 olur', () => {
  assert.equal(buildNumber('2026.10.25-b31'), 31);
  assert.equal(buildNumber(''), 0);
  assert.equal(buildNumber(undefined), 0);
  assert.equal(buildNumber('x'), 0);
});

check('süzgeçler: işaretsiz, eski sürüm, bekleme ekranı görenler, tamamlanmayan, işaretli', () => {
  assert.deepEqual(codes(filterRecords(rows, 'unmarked', 31)), ['NEW1', 'NEW2', 'OLD1', 'OLD2', 'WD1']);
  assert.deepEqual(codes(filterRecords(rows, 'old', 31)), ['OLD1', 'OLD2']);
  assert.deepEqual(codes(filterRecords(rows, 'cooldown', 31)), ['NEW1', 'OLD1']);
  assert.deepEqual(codes(filterRecords(rows, 'incomplete', 31)), ['NEW2', 'OLD1', 'WD1']);
  assert.deepEqual(codes(filterRecords(rows, 'marked', 31)), ['TST1']);
});

check(
  'işaretleme: kayıt çekilmiş gibi kapanır, önceki çekilme durumu saklanır; işaretli kayıt atlanır',
  () => {
    const plan = planMark(participants, ['OLD1', 'WD1', 'TST1', 'YOK'], 'a@b.c', NOW);
    assert.deepEqual(
      plan.map((item) => item.code),
      ['OLD1', 'WD1']
    );
    assert.deepEqual(plan[0].fields, {
      withdrawn: true,
      testRecord: true,
      testMarkedAt: NOW,
      testMarkedBy: 'a@b.c',
      testPrevWithdrawn: false,
    });
    assert.equal(plan[1].fields.testPrevWithdrawn, true); // gerçek çekilme korunacak
  }
);

check(
  'geri alma: gerçek çekilme korunur, test için çekilmiş sayılan kayıt yeniden açılır; işaretsiz kayıt atlanır',
  () => {
    const marked = {
      ...participants,
      WD1: { ...participants.WD1, ...planMark(participants, ['WD1'], 'a@b.c', NOW)[0].fields },
      OLD1: { ...participants.OLD1, ...planMark(participants, ['OLD1'], 'a@b.c', NOW)[0].fields },
    };
    const plan = planUnmark(marked, ['WD1', 'OLD1', 'NEW1'], NOW);
    assert.deepEqual(
      plan.map((item) => item.code),
      ['WD1', 'OLD1']
    );
    assert.equal(plan[0].fields.withdrawn, true); // gerçekten çekilmişti
    assert.equal(plan[1].fields.withdrawn, false); // yalnızca test için kapatılmıştı
    assert.equal(plan[1].fields.testRecord, false);
  }
);

check('analize girer: çekilen de test kaydı da girmez', () => {
  assert.equal(isAnalyzable(participants.NEW1), true);
  assert.equal(isAnalyzable(participants.WD1), false);
  assert.equal(isAnalyzable(participants.TST1), false);
  assert.equal(isAnalyzable({ code: 'X', testRecord: true }), false);
});

console.log('\n' + passed + ' denetim geçti.');
