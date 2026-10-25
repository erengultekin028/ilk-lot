// Yönetim paneli: CSV dışa aktarma, kartlar ve afiş.

import { adminState } from './admin-state.js';
import { escapeHtml } from '../utils/format.js';
import { adminRepository } from './admin-repository.js';
import { isAnalyzable } from './test-records.js';
import { renderQrSvg } from '../widgets/qr-code.js';
import { summarizeSnapshot } from '../services/session-persistence.js';
import { showToast } from '../widgets/toast.js';
import { saveFile } from '../utils/file-download.js';

// ═════════════════ DIŞA AKTARMA ═════════════════
function csvCell(value) {
  if (value == null) return '';
  value = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n;]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
}

function toCsv(rows) {
  return rows
    .map(function (item) {
      return item.map(csvCell).join(',');
    })
    .join('\n');
}

export async function exportParticipants() {
  let participants = await adminRepository.listParticipants();
  const rows = [
    [
      'app_version',
      'code',
      'grp',
      'set_order',
      'completed',
      'decisions',
      'panic_rate_pre',
      'panic_rate_post',
      'panic_rate_change',
      'sell_rate_crisis_pre',
      'sell_rate_crisis_post',
      'sell_rate_gain_pre',
      'sell_rate_loss_pre',
      'sell_rate_gain_post',
      'sell_rate_loss_post',
      'disposition_pre',
      'disposition_post',
      'buy_more_crisis_pre',
      'buy_more_crisis_post',
      'rt_median_pre_ms',
      'rt_median_post_ms',
      'sim_trades',
      'sim_sells',
      'sim_loss_sells',
      'sim_loss_sells_crisis',
      'sim_buys',
      'sim_sell_reasons',
      'cooldown_shown',
      'cooldown_cancel',
      'cooldown_proceed',
      'sim_time_portfolio_s',
      'sim_time_market_s',
      'sim_time_analysis_s',
      'reading_s',
      'stress_pre',
      'stress_sim',
      'stress_post',
      'updated_at',
      'test_mode',
      'pre_test',
      'pre_test_b3',
      'post_test',
      'attention_pass',
      'comprehension_first_try',
      'help_opens',
      'manip_saw_wait',
      'purpose_guess',
      'age',
      'gender',
      'field',
      'year',
      'invest_exp',
      'sim_exp',
      'consent_version',
      'consent_sections_opened',
      'consent_downloaded',
      'consent_read_s',
      'pilot_clear',
      'pilot_duration',
      'pilot_unease',
    ],
  ];
  participants = participants.filter(isAnalyzable);
  participants.forEach(function (item) {
    const snapshot = item['sess_1'];
    if (!snapshot) return;
    const data = item.demo || {};
    const feedback = item.fb || {};
    rows.push(
      summarizeSnapshot(item.code, item.grp, '1', snapshot).concat([
        item.pre,
        item.preB3 != null ? item.preB3 : '',
        item.post,
        item.attPass == null ? '' : item.attPass ? 1 : 0,
        item.comp != null
          ? item.comp
          : snapshot.comp && snapshot.comp.score != null
            ? snapshot.comp.score
            : '',
        snapshot.helpN || 0,
        item.manip || '',
        item.guess || '',
        data.age || '',
        data.gender || '',
        data.field || '',
        data.year || '',
        (data.inv || []).join('|'),
        data.sim || '',
        item.consentVer || '',
        (item.consentOpened || []).length,
        item.consentDl ? 1 : 0,
        item.consentMs != null ? Math.round(item.consentMs / 1000) : '',
        feedback.clear != null ? feedback.clear : '',
        feedback.dur || '',
        feedback.unease || '',
      ])
    );
  });
  await saveFile('ilklot_katilimcilar_' + new Date().toISOString().slice(0, 10) + '.csv', toCsv(rows));
}

export async function exportEvents() {
  const participants = (await adminRepository.listParticipants()).filter(isAnalyzable);
  const rows = [['app_version', 'code', 'grp', 'session', 'n', 'ts', 'trial_index', 'type', 'data']];
  for (let i = 0; i < participants.length; i++) {
    const events = await adminRepository.listEvents(participants[i].code);
    events.sort(function (left, right) {
      return left.session === right.session
        ? left.n - right.n
        : String(left.session).localeCompare(String(right.session));
    });
    events.forEach(function (item) {
      rows.push([
        item.v || '',
        item.code,
        item.grp,
        item.session,
        item.n,
        item.ts,
        item.ti,
        item.type,
        item.data,
      ]);
    });
  }
  await saveFile('ilklot_olaylar_' + new Date().toISOString().slice(0, 10) + '.csv', toCsv(rows));
}

function sortedByNumber(map) {
  return Object.keys(map).sort(function (left, right) {
    return (map[left].no || 0) - (map[right].no || 0);
  });
}

// Araştırmacı listesi: grup SADECE burada var, katılımcıya gösterilmez
export async function exportAllocations() {
  const allocations = await adminRepository.listAllocations();
  const rows = [['no', 'code', 'grp', 'set_order', 'block']];
  sortedByNumber(allocations).forEach(function (item) {
    rows.push([
      allocations[item].no,
      item,
      allocations[item].grp,
      allocations[item].order === 1 ? 'Y→X' : 'X→Y',
      allocations[item].block,
    ]);
  });
  await saveFile('ilklot_liste_GIZLI.csv', toCsv(rows));
}

// ═════════════════ POSTER ═════════════════
// Yazdırılabilir A4/A3 poster. Tüm ölçüler mm × k ile verilir; A3'te k = √2 ve her şey orantılı büyür.
// Metin tanıtım sayfasıyla aynı: araştırmanın amacı genel, hipotez yok.
export async function exportPoster(size) {
  const unit = (adminState.landingUrlInput || '').trim();
  if (!/^https?:\/\//.test(unit)) {
    showToast('Önce tanıtım sayfasının adresini yaz (https:// ile).');
    return;
  }
  const key = size === 'A3' ? 1.4142 : 1;
  const simulation = function (value) {
    return (value * key).toFixed(2) + 'mm';
  };
  const mail = escapeHtml((adminState.posterEmail || '').trim());
  const foot = escapeHtml((adminState.posterFooter || '').trim());
  const fact = function (other, value) {
    return '<div class="f"><b>' + other + '</b><span>' + value + '</span></div>';
  };
  const html =
    '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>İlk Lot poster ' +
    size +
    '</title><style>' +
    '@page{size:' +
    size +
    ';margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    'html,body{margin:0;background:#F4F4F4}body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#111111}' +
    '.p{width:' +
    simulation(210) +
    ';height:' +
    simulation(297) +
    ';margin:0 auto;display:flex;flex-direction:column;overflow:hidden;background:#F4F4F4}' +
    '.top{background:#111111;color:#F0F0F2;padding:' +
    simulation(18) +
    ' ' +
    simulation(16) +
    ' ' +
    simulation(26) +
    ';position:relative}' +
    '.brand{display:flex;align-items:center;gap:' +
    simulation(3) +
    ';font-weight:800;font-size:' +
    simulation(6) +
    '}' +
    '.tag{display:inline-block;margin-top:' +
    simulation(10) +
    ';font-size:' +
    simulation(3.4) +
    ';font-weight:700;letter-spacing:.04em;padding:' +
    simulation(1.4) +
    ' ' +
    simulation(3.2) +
    ';border-radius:99px;background:rgba(242,169,59,.18);color:#F6BE63}' +
    'h1{font-size:' +
    simulation(19) +
    ';line-height:.98;letter-spacing:-.035em;margin:' +
    simulation(5) +
    ' 0 0;font-weight:850}h1 em{font-style:normal;color:#F2A93B}' +
    '.lead{font-size:' +
    simulation(5) +
    ';line-height:1.4;color:#C7CEDD;margin:' +
    simulation(6) +
    ' 0 0;max-width:' +
    simulation(150) +
    '}' +
    '.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:' +
    simulation(3) +
    ';margin:-' +
    simulation(12) +
    ' ' +
    simulation(12) +
    ' 0;position:relative}' +
    '.f{background:#fff;border:1px solid #D8D8D8;border-radius:' +
    simulation(4) +
    ';padding:' +
    simulation(3.6) +
    ' ' +
    simulation(3.2) +
    '}.f b{display:block;font-size:' +
    simulation(6.4) +
    ';letter-spacing:-.02em}.f span{display:block;font-size:' +
    simulation(3) +
    ';color:#595959;margin-top:' +
    simulation(0.8) +
    ';line-height:1.3}' +
    '.mid{flex:1;display:grid;grid-template-columns:' +
    simulation(84) +
    ' 1fr;gap:' +
    simulation(9) +
    ';align-items:center;padding:' +
    simulation(12) +
    ' ' +
    simulation(14) +
    '}' +
    '.qr{background:#fff;border-radius:' +
    simulation(6) +
    ';padding:' +
    simulation(4) +
    ';border:' +
    simulation(1.2) +
    ' solid #F2A93B}.qr svg{display:block;width:100%;height:auto}' +
    '.cta b{display:block;font-size:' +
    simulation(9) +
    ';line-height:1.05;letter-spacing:-.02em}.cta p{font-size:' +
    simulation(4.2) +
    ';color:#595959;margin:' +
    simulation(4) +
    ' 0 0;line-height:1.45}.cta .u{font-size:' +
    simulation(3.2) +
    ';font-weight:700;color:#000000;word-break:break-all;margin-top:' +
    simulation(4) +
    '}' +
    '.ft{display:flex;justify-content:space-between;gap:' +
    simulation(6) +
    ';padding:' +
    simulation(6) +
    ' ' +
    simulation(14) +
    ';border-top:1px solid #D8D8D8;font-size:' +
    simulation(3.2) +
    ';color:#595959}' +
    '@media screen{body{padding:20px 0}.p{box-shadow:0 10px 40px rgba(0,0,0,.15)}}' +
    '</style></head><body><div class="p">' +
    '<div class="top"><div class="brand"><svg width="' +
    simulation(9) +
    '" height="' +
    simulation(9) +
    '" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#111111"/><rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#3A3A40" stroke-width="2"/><circle cx="32" cy="42" r="14" fill="#F2A93B"/><text x="32" y="48" text-anchor="middle" font-family="Georgia,serif" font-size="18" font-weight="700" fill="#111111">₺</text><line x1="32" y1="28" x2="32" y2="19" stroke="#4FC795" stroke-width="3" stroke-linecap="round"/><path d="M32 22 C24 22 21 16 21 13 C28 13 32 17 32 22Z" fill="#4FC795"/><path d="M32 22 C40 22 43 16 43 13 C36 13 32 17 32 22Z" fill="#4FC795"/></svg>İlk Lot</div>' +
    '<span class="tag">Katılımcı aranıyor · Üniversite araştırması</span><h1>Piyasa düşerken<br><em>ne yaparsın?</em></h1>' +
    '<p class="lead">Üniversite öğrencilerinin yatırım kararlarını inceleyen bir araştırma. Gerçek para yok; telefonundan, sanal bir piyasada.</p></div>' +
    '<div class="facts">' +
    fact('~30 dk', 'tek oturum, telefondan') +
    fact('₺0', 'gerçek para yok') +
    fact('Anonim', 'ad, e-posta istenmez') +
    fact('18+', 'üniversite öğrencileri') +
    '</div>' +
    '<div class="mid"><div class="qr">' +
    renderQrSvg(unit, 400) +
    '</div><div class="cta"><b>Okut,<br>bilgi al,<br>katıl.</b><p>Telefonunun kamerasını QR koda tut. Araştırmanın ayrıntıları, gizlilik ve katılım adımları açılır.</p><div class="u">' +
    escapeHtml(unit.replace(/^https?:\/\//, '')) +
    '</div>' +
    (mail
      ? '<p style="margin-top:' +
        simulation(3) +
        '">İletişim: <b style="display:inline;font-size:inherit">' +
        mail +
        '</b></p>'
      : '') +
    '</div></div>' +
    '<div class="ft"><span>' +
    (foot || 'İlk Lot araştırması') +
    '</span><span>Yatırım tavsiyesi değildir.</span></div>' +
    '</div></body></html>';
  await saveFile('ilklot_poster_' + size + '.html', html);
}
