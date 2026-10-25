// Yönetim paneli: canlı pano.

import { CONFIG } from '../constants/app-config.js';
import { render } from '../views/app-shell.js';
import { state } from '../viewmodels/app-state.js';
import { escapeHtml } from '../utils/format.js';
import { participantRepository } from '../repositories/participant-repository.js';
import { section } from '../widgets/section.js';
import { showToast } from '../widgets/toast.js';
import { TRIAL_SETS } from '../models/trial-generator.js';

// ═════════════════ CANLI PANO ═════════════════
// Sadece SÜREÇ gösterilir: katılım, ilerleme, veri kalitesi. Sonuç değişkenleri (panik satış vb.)
// veri toplama bitene kadar bilerek gösterilmez; ara sonuçlara bakmak analiz yanlılığı yaratır.
// Anlık görüntüden "şu an nerede" metni
function stageDescription(snapshot) {
  var length = TRIAL_SETS.X.length;
  if (snapshot.phase === 'sim')
    return snapshot.sim
      ? 'simülatör, gün ' + snapshot.sim.tick + '/' + CONFIG.simTicks
      : 'simülatör başlıyor';
  if (snapshot.phase === 'post')
    return '3. bölüm, ' + Math.min(snapshot.ti || 0, length) + '/' + length + ' karar';
  if (snapshot.phase === 'done' || snapshot.ended) return 'bitti';
  return snapshot.practiced
    ? '1. bölüm, ' + (snapshot.ti || 0) + '/' + length + ' karar'
    : 'hazırlık (form, test, alıştırma)';
}

export async function loadDashboard() {
  state.dashboardBusy = true;
  render();
  try {
    var participants = await participantRepository.listP(),
      alert = await participantRepository.listAlloc(),
      now = Date.now(),
      totalSessions = CONFIG.totalSessions;
    var isQuick = function (price) {
      for (var j = 1; j <= totalSessions; j++) {
        var startValue = price['sess_' + j];
        if (startValue && startValue.quick) return true;
      }
      return false;
    };
    var tmode = participants.filter(function (item) {
      return item.consentAt && !item.withdrawn && isQuick(item);
    }).length; // hızlı test modu oturumları sayılmaz (analizden de çıkarılır)
    var real = participants.filter(function (item) {
        return item.consentAt && !item.withdrawn && !isQuick(item);
      }),
      sess = [],
      flags = [],
      days = {},
      act = 0,
      done = 0,
      map = { A: 0, B: 0 },
      live = [];
    for (var i2 = 1; i2 <= totalSessions; i2++) sess.push({ c: 0, r: 0 });
    real.forEach(function (innerItem) {
      map[innerItem.grp] = (map[innerItem.grp] || 0) + 1;
      var all = true;
      for (var i = 1; i <= totalSessions; i++) {
        var snapshot = innerItem['sess_' + i];
        if (snapshot && snapshot.ended) sess[i - 1].c++;
        else {
          all = false;
          if (snapshot) {
            sess[i - 1].r++;
            var age = now - new Date(snapshot.updatedAt || innerItem.updatedAt || 0).getTime();
            if (age < 180000) act++;
            else if (age > 86400000)
              flags.push([innerItem.code, 'Oturum ' + i + ' yarıda kaldı (24 saatten fazla)']);
            // Ekranda ya da yeni durmuş (1 saat içinde): gözlemcinin yanına gidebileceği kişiler
            if (age <= 3600000)
              live.push({
                code: innerItem.code,
                min: Math.floor(age / 60000),
                at: stageDescription(snapshot),
              });
          }
        }
        if (
          snapshot &&
          snapshot.ended &&
          (snapshot.dec || []).length &&
          (snapshot.dec || []).every(function (item) {
            return item.final === snapshot.dec[0].final;
          })
        )
          flags.push([innerItem.code, 'Bütün kararlar aynı seçenek (dikkatsiz olabilir)']);
      }
      if (all) done++;
      if (innerItem.attPass === false) flags.push([innerItem.code, 'Dikkat kontrolünü geçemedi']);
      if (all && innerItem.post == null) flags.push([innerItem.code, 'Son test eksik']);
      var data = String(innerItem.consentAt).slice(0, 10);
      days[data] = (days[data] || 0) + 1;
    });
    state.dashboard = {
      at: now,
      codes: Object.keys(alert).length,
      cons: real.length,
      act: act,
      done: done,
      sess: sess,
      flags: flags,
      days: days,
      bal: map,
      live: live.sort(function (left, right) {
        return left.min - right.min;
      }),
      tmode: tmode,
      wd: participants.filter(function (item) {
        return item.withdrawn && !item.ineligible;
      }).length,
      inel: participants.filter(function (item) {
        return item.ineligible;
      }).length,
    };
  } catch (error) {
    showToast('Pano yüklenemedi: ' + ((error && error.code) || error));
  }
  state.dashboardBusy = false;
  render();
}

function renderProgressRing(fraction) {
  var result = 34,
    value = 2 * Math.PI * result,
    position = value * (1 - fraction);
  return (
    '<svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true"><circle cx="44" cy="44" r="' +
    result +
    '" fill="none" stroke="var(--sf2)" stroke-width="10"/><circle cx="44" cy="44" r="' +
    result +
    '" fill="none" stroke="var(--up)" stroke-width="10" stroke-linecap="round" stroke-dasharray="' +
    value.toFixed(1) +
    '" stroke-dashoffset="' +
    position.toFixed(1) +
    '" transform="rotate(-90 44 44)"/><text x="44" y="50" text-anchor="middle" font-family="Bricolage Grotesque,system-ui" font-weight="800" font-size="19" fill="var(--tx)">%' +
    Math.round(fraction * 100) +
    '</text></svg>'
  );
}

export function renderDashboard() {
  var dashboard = state.dashboard;
  if (!dashboard)
    return section(
      'Canlı pano',
      '<p class="muted" style="margin:0 0 12px">Katılım ve veri kalitesini tek ekranda gör.</p><button class="button is-primary" data-a="refreshDashboard"' +
        (state.dashboardBusy ? ' disabled' : '') +
        '>' +
        (state.dashboardBusy ? 'Yükleniyor…' : 'Panoyu yükle') +
        '</button>'
    );
  var totalSessions = CONFIG.totalSessions,
    cons = Math.max(1, dashboard.cons);
  // Günlük katılım: son 14 gün
  var items = [],
    today = new Date();
  for (var i = 13; i >= 0; i--) {
    var innerValue = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
    items.push([innerValue, dashboard.days[innerValue] || 0]);
  }
  var max = Math.max.apply(
      0,
      items
        .map(function (item) {
          return item[1];
        })
        .concat([1])
    ),
    bw = 300 / 14;
  var bars =
    '<svg viewBox="0 0 300 100" width="100%" role="img" aria-label="Son 14 günde onam veren katılımcı sayısı">' +
    items
      .map(function (item, index) {
        var height = (item[1] / max) * 58;
        return (
          '<rect x="' +
          (index * bw + 3).toFixed(1) +
          '" y="' +
          (78 - height).toFixed(1) +
          '" width="' +
          (bw - 6).toFixed(1) +
          '" height="' +
          Math.max(height, 1.5).toFixed(1) +
          '" rx="3" fill="' +
          (item[1] ? 'var(--ac)' : 'var(--sf2)') +
          '"/>' +
          (item[1]
            ? '<text x="' +
              (index * bw + bw / 2).toFixed(1) +
              '" y="' +
              (74 - height).toFixed(1) +
              '" font-size="9" font-weight="700" text-anchor="middle" fill="var(--tx)">' +
              item[1] +
              '</text>'
            : '') +
          (index % 3 === 1 || index === 13
            ? '<text x="' +
              (index * bw + bw / 2).toFixed(1) +
              '" y="94" font-size="8.5" text-anchor="middle" fill="var(--mu)">' +
              item[0].slice(8, 10) +
              '.' +
              item[0].slice(5, 7) +
              '</text>'
            : '')
        );
      })
      .join('') +
    '</svg>';
  var sideBar = dashboard.sess
    .map(function (item, index) {
      var value = (item.c / cons) * 100,
        result = (item.r / cons) * 100;
      return (
        '<div class="metric"><div class="metric-header"><span>Oturum ' +
        (index + 1) +
        '</span><b class="tabular-number">' +
        item.c +
        ' bitti · ' +
        item.r +
        ' sürüyor</b></div><div class="stack-bar" style="height:10px;margin:0;background:var(--sf2);border-radius:5px"><i style="width:' +
        value +
        '%;background:var(--up)"></i><i style="width:' +
        result +
        '%;background:var(--ac)"></i></div></div>'
      );
    })
    .join('');
  var tabBar = dashboard.bal.A + dashboard.bal.B || 1;
  return section(
    'Canlı pano',
    '<div style="display:flex;align-items:center;gap:14px;margin:2px 0 14px">' +
      renderProgressRing(dashboard.done / cons) +
      '<div><div style="font:700 15px var(--fd)">Tüm oturumları bitiren</div><div class="muted small-text">' +
      dashboard.done +
      ' / ' +
      dashboard.cons +
      ' katılımcı</div><div class="muted" style="font-size:11px;margin-top:4px">Son güncelleme ' +
      new Date(dashboard.at).toLocaleTimeString('tr-TR').slice(0, 5) +
      '</div></div></div>' +
      '<div class="kpi-grid"><div class="card-valuepi"><span>Dağıtılan kod</span><b>' +
      dashboard.codes +
      '</b></div><div class="card-valuepi"><span>Onam veren</span><b>' +
      dashboard.cons +
      '</b></div><div class="card-valuepi"><span>Şu an aktif</span><b style="color:var(--up)">' +
      dashboard.act +
      '</b></div><div class="card-valuepi"><span>Çekilen / 18 altı</span><b>' +
      dashboard.wd +
      ' <i>/ ' +
      dashboard.inel +
      '</i></b></div></div>' +
      '<div style="font-weight:700;margin:6px 0 4px">Şu an ekranda ya da yeni durmuş</div>' +
      (dashboard.live.length
        ? '<div>' +
          dashboard.live
            .slice(0, 12)
            .map(function (item) {
              return (
                '<div class="flag-row"><code>' +
                escapeHtml(item.code) +
                '</code><span class="muted" style="text-align:right">' +
                escapeHtml(item.at) +
                ' · ' +
                (item.min < 3
                  ? '<b style="color:var(--up)">aktif</b>'
                  : '<b style="color:var(--wt)">' + item.min + ' dk önce durdu</b>') +
                '</span></div>'
              );
            })
            .join('') +
          (dashboard.live.length > 12
            ? '<p class="muted small-text">+' + (dashboard.live.length - 12) + ' kişi daha</p>'
            : '') +
          '</div>'
        : '<p class="muted small-text" style="margin:0 0 8px">Şu an ekranda kimse yok.</p>') +
      '<label class="consent-check" style="margin:10px 0 4px"><input type="checkbox" data-in="dashAuto"' +
      (state.dashboardAutoRefresh ? ' checked' : '') +
      '><span>Her 30 saniyede yenile (bu ekran açıkken)</span></label>' +
      (dashboard.tmode
        ? '<p class="muted small-text" style="margin:4px 0 0">Hızlı test modunda ' +
          dashboard.tmode +
          ' oturum var; sayılmadı.</p>'
        : '') +
      '<div style="font-weight:700;margin:14px 0 2px">Oturum ilerlemesi</div>' +
      sideBar +
      '<div style="font-weight:700;margin:18px 0 6px">Günlük katılım (son 14 gün)</div>' +
      bars +
      '<div style="font-weight:700;margin:14px 0 6px">Grup dengesi (sadece sayı)</div><div class="stack-bar" style="height:10px;margin:0"><i style="width:' +
      (dashboard.bal.A / tabBar) * 100 +
      '%;background:var(--mu2)"></i><i style="width:' +
      (dashboard.bal.B / tabBar) * 100 +
      '%;background:var(--ln)"></i></div><div class="card-labelegenews-day" style="margin-top:6px"><span>A: ' +
      dashboard.bal.A +
      '</span><span>B: ' +
      dashboard.bal.B +
      '</span></div>' +
      '<div style="font-weight:700;margin:18px 0 4px">Veri kalitesi uyarıları (' +
      dashboard.flags.length +
      ')</div>' +
      (dashboard.flags.length
        ? '<div>' +
          dashboard.flags
            .slice(0, 12)
            .map(function (item) {
              return (
                '<div class="flag-row"><code>' +
                escapeHtml(item[0]) +
                '</code><span class="muted" style="text-align:right">' +
                escapeHtml(item[1]) +
                '</span></div>'
              );
            })
            .join('') +
          (dashboard.flags.length > 12
            ? '<p class="muted small-text">+' + (dashboard.flags.length - 12) + ' uyarı daha</p>'
            : '') +
          '</div>'
        : '<p class="muted small-text" style="margin:0">Uyarı yok.</p>') +
      '<div class="is-wrongsheet-titlee is-info" style="margin:16px 0 10px"><span>Sonuç değişkenleri (panik satış, elden çıkarma etkisi vb.) veri toplama bitene kadar bilerek gösterilmez. Ara sonuçlara bakmak analiz yanlılığı yaratır.</span></div><button class="button" data-a="refreshDashboard"' +
      (state.dashboardBusy ? ' disabled' : '') +
      '>' +
      (state.dashboardBusy ? 'Yükleniyor…' : 'Yenile') +
      '</button>'
  );
}

// Pano otomatik yenileme: yalnızca panel açıkken ve bir kutuya yazılmıyorsa (yazılan alanlar silinmesin)
export function dashboardAutoRefresh() {
  if (!state.dashboardAutoRefresh || state.stage !== 'admin' || state.dashboardBusy || !state.dashboard)
    return false;
  var activeElement = document.activeElement;
  if (activeElement && /^(INPUT|TEXTAREA)$/.test(activeElement.tagName) && activeElement.type !== 'checkbox')
    return false;
  loadDashboard();
  return true;
}
