// Tanıtım modu ekranları.

import { CONFIG } from '../constants/app-config.js';
import { render } from './app-shell.js';
import { state } from '../viewmodels/app-state.js';
import { formatNumber, formatPercentChange } from '../utils/format.js';
import { portfolioValue, tickSecondsText } from '../models/market-simulation.js';
import { participantRepository } from '../repositories/participant-repository.js';

// Tanıtım modu (?demo=1) ekranları. Bekleme ekranı hiç çıkmaz ve hiçbir veri kaydedilmez; bunlar ekranda da söylenir.
export function renderDemoLanding() {
  return (
    '<div class="row-titlesheet-titleage"><div class="muted small-text" style="font-weight:700">Tanıtım</div><h1>Piyasa simülatörünü dene</h1><p>Elinde 6 hisseden oluşan bir portföy ve ₺' +
    formatNumber(CONFIG.cash0, 0) +
    ' nakit var. Fiyatlar her ' +
    tickSecondsText() +
    ' saniyede bir gün ilerler; hisse alıp satabilirsin. Bu bir tanıtım: <b style="color:var(--tx)">hiçbir veri kaydedilmez</b> ve çalışmaya katılmış sayılmazsın.</p><div class="is-wrongsheet-titlee is-info" style="margin:4px 0 12px"><span><b style="color:var(--tx)">Önemli:</b> Hisse adları gerçek BIST şirketleridir, ama fiyatlar, grafikler ve haberler araştırma için kurgulanmıştır. Bu şirketlerin gerçek durumunu yansıtmaz.</span></div>' +
    '<div class="stage-actions"><button class="button is-primary" data-a="startDemoSimulation">Simülatörü başlat</button><button class="button" data-a="openFreePlay">Serbest mod: kendi kurallarınla oyna</button></div></div>'
  );
}

export function renderDemoEnd() {
  var simulation = state.simulation,
    portfolioTotal = portfolioValue(),
    change = (portfolioTotal / simulation.v0 - 1) * 100;
  return (
    '<div class="row-titlesheet-titleage"><div class="muted small-text" style="font-weight:700">Tanıtım bitti</div><h1>Simülatör bitti</h1><p>Portföyünün değeri ₺' +
    formatNumber(portfolioTotal, 0) +
    ' (' +
    formatPercentChange(change) +
    '), ' +
    simulation.trades.length +
    ' işlem yaptın. Hiçbir veri kaydedilmedi.</p><p class="muted small-text">Gerçek çalışmaya katılmak istersen araştırmacının verdiği kartı kullan.</p><div class="stage-actions"><button class="button is-primary" data-a="startDemoSimulation">Baştan dene</button><button class="button" data-a="openFreePlay">Serbest mod: kendi kurallarınla oyna</button></div></div>'
  );
}

// Sadece yerel demo modunda: denemek isteyen biri kod bulmak için araştırmacı paneline girmek zorunda kalmasın.
// Firebase modunda (gerçek pilot) bu ipucu hiç görünmez.
export function demoHintHtml() {
  if (participantRepository.mode() !== 'local') return '';
  var allocationCache = state.allocationCache;
  if (!allocationCache) {
    Promise.all([participantRepository.listAlloc(), participantRepository.listP()]).then(function (result) {
      state.allocationCache = result[0];
      state.demoCodeUsed = {};
      result[1].forEach(function (item) {
        if (item.withdrawn) state.demoCodeUsed[item.code] = 1;
      });
      if (state.stage === 'code') render();
    });
    return '';
  }
  var isValid = function (key) {
      return !(state.demoCodeUsed || {})[key];
    },
    keys = Object.keys(allocationCache).sort(function (left, right) {
      return (allocationCache[left].no || 0) - (allocationCache[right].no || 0);
    }),
    allocations = keys.filter(function (item) {
      return allocationCache[item].grp === 'A' && isValid(item);
    })[0],
    bounds = keys.filter(function (item) {
      return allocationCache[item].grp === 'B' && isValid(item);
    })[0];
  return (
    '<div class="is-wrongsheet-titlee is-info" style="margin-top:16px;display:block"><div>' +
    (participantRepository.memMode()
      ? 'Demo modu: bu görünüm kayıt tutmaya izin vermiyor, veriler sayfa kapanınca silinir.'
      : 'Demo modu: kayıtlar sadece bu cihazda tutulur ve kodlar her cihazda farklıdır.') +
    ' Denemek için bir koda dokun:</div><div class="chip-list" style="margin-top:10px">' +
    (allocations
      ? '<button class="chip" data-a="useDemoCode" data-v="' +
        allocations +
        '">' +
        allocations +
        ' · bekleme süreli</button>'
      : '') +
    (bounds
      ? '<button class="chip" data-a="useDemoCode" data-v="' + bounds + '">' + bounds + ' · kontrol</button>'
      : '') +
    '</div><button class="card-labelirow-subtitlecard-value" style="padding:10px 0 0;color:var(--act)" data-a="resetDemoData">Demo verisini sıfırla</button></div>'
  );
}
