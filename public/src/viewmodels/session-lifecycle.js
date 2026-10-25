// Oturumun açılışı, kod girişi ve bitişi.

import { APP_VERSION, CONFIG, CONSENT_VERSION } from '../constants/app-config.js';
import { render } from '../views/app-shell.js';
import { state } from './app-state.js';
import { byId } from '../utils/dom.js';
import { errorState } from '../services/error-capture.js';
import { eventLog, flushEvents, logEvent } from '../services/event-log.js';
import { normalizeCode, rememberCode, rememberedCode } from '../utils/participant-code.js';
import { participantRepository } from '../repositories/participant-repository.js';
import { hashSeed } from '../utils/random.js';
import {
  findNextSession,
  gapLeftMs,
  restoreSnapshot,
  saveSnapshot,
} from '../services/session-persistence.js';
import { showToast } from '../widgets/toast.js';
import { stimulusFingerprint } from '../models/trial-generator.js';
function showCodeError(message) {
  state.busy = false;
  state.codeError = message;
  state.stage = 'code';
  render();
  const codeErrorElement = byId('code-error');
  if (codeErrorElement) {
    codeErrorElement.classList.remove('is-shaking');
    void codeErrorElement.offsetWidth;
    codeErrorElement.classList.add('is-shaking');
  }
}

// Açılış: linkte kod varsa ya da bu cihaz bir katılımcıyı hatırlıyorsa onu karşıla
export async function bootstrap() {
  await storeReady;
  const fromLink = normalizeCode(HASH_PARAMS.get('k'));
  const code = fromLink || rememberedCode();
  // Kodu adres çubuğundan ve geçmişten kaldır (ekran görüntüsünde ya da yan bakışta görünmesin)
  if (fromLink)
    try {
      history.replaceState(
        null,
        '',
        location.pathname + location.search + (state.adminRequested ? '#admin' : '')
      );
    } catch (error) {}
  if (!code) {
    state.stage = 'consent';
    return render();
  }
  try {
    const allocation = await participantRepository.getAlloc(code);
    if (!allocation) {
      rememberCode(null);
      state.codeInput = code;
      state.codeError = fromLink
        ? 'Bu link geçersiz. Kartındaki kodu kontrol et ya da araştırmacıya sor.'
        : '';
      state.stage = 'consent';
      state.pendingCode = null;
      return render();
    }
    const value = (await participantRepository.getP(code)) || {};
    if (value.withdrawn) {
      rememberCode(null);
      state.stage = 'withdrawn';
      return render();
    }
    state.pendingCode = code;
    state.welcomeBack = {
      code: code,
      next: findNextSession(value),
    };
    state.stage = value.consentAt ? 'welcome' : 'consent';
    render();
  } catch (error) {
    state.stage = 'consent';
    render();
  }
}
export async function enterCode(rawCode) {
  await storeReady;
  const code = normalizeCode(rawCode);
  state.codeError = '';
  if (!code) return showCodeError('Kod 12 karakter olmalı, örneğin KM7D-P2XR-9TQA.');
  state.busy = true;
  render();
  try {
    const allocation = await participantRepository.getAlloc(code);
    // Demo modunda kod listesi her cihazda ayrı üretilir: başka cihazda indirilen kart kodu burada geçersizdir
    if (!allocation) {
      rememberCode(null);
      return showCodeError(
        participantRepository.mode() === 'local'
          ? 'Bu kod bu cihazın demo listesinde yok. Demo modunda her cihazın kodları farklıdır; aşağıdaki demo kodlarından birine dokun.'
          : 'Bu kod listede yok. Kartındaki kodu kontrol et.'
      );
    }
    const value = (await participantRepository.getP(code)) || {};
    if (value.withdrawn) {
      rememberCode(null);
      return showCodeError(
        participantRepository.mode() === 'local'
          ? 'Bu demo kodla daha önce çalışmadan çekilmişsin. Aşağıdaki diğer demo kodlarından birine dokun ya da demo verisini sıfırla.'
          : 'Bu kodla çalışmadan çekilmişsin. Tekrar katılmak istersen araştırmacıyla konuş.'
      );
    }
    const nextX = findNextSession(value);
    // Tüm oturumlar bitti: son oturumun sonuna götür (son test / bilgilendirme eksikse orada tamamlanır)
    if (!nextX) {
      const items = String(CONFIG.totalSessions);
      CONFIG.session = items;
      state.participantCode = code;
      state.group = allocation.grp;
      state.setOrder = allocation.order != null ? allocation.order : hashSeed(code) % 2;
      state.preTest = value.pre != null ? value.pre : null;
      state.preTestBigThree = value.preB3 != null ? value.preB3 : null;
      state.postTest = value.post != null ? value.post : null;
      state.manipulationCheck = value.manip;
      state.pilotFeedback = value.fb;
      rememberCode(code);
      if (value['sess_' + items]) restoreSnapshot(value['sess_' + items]);
      state.ended = true;
      state.busy = false;
      state.stage = 'end';
      return render();
    }
    const wait = gapLeftMs(nextX.prev);
    if (wait > 0) {
      state.busy = false;
      state.waitUntil = Date.now() + wait;
      state.waitSession = nextX.n;
      state.stage = 'wait';
      rememberCode(code);
      return render();
    }
    CONFIG.session = nextX.n;
    rememberCode(code);
    // İlk onam zamanı katılımcı kaydına yazılır; sonraki oturumlarda onam tekrar sorulmaz
    if (state.consentAt && !value.consentAt)
      await participantRepository.saveP(code, {
        code: code,
        grp: allocation.grp,
        consentAt: state.consentAt,
        quick: undefined,
        consentVer: CONSENT_VERSION,
        consentOpened: Object.keys(state.consentOpenSections || {}),
        consentDl: !!state.consentDownloaded,
        consentMs: state.consentMs,
      });
    state.participantCode = code;
    state.group = allocation.grp;
    state.setOrder = allocation.order != null ? allocation.order : hashSeed(code) % 2;
    state.preTest = value.pre != null ? value.pre : null;
    state.preTestBigThree = value.preB3 != null ? value.preB3 : null;
    state.postTest = value.post != null ? value.post : null;
    state.manipulationCheck = value.manip;
    state.hasDemographics = !!value.demo;
    // Önceki oturumdan gönderilemeyen olaylar varsa kuyruğa geri al
    try {
      const parsed = JSON.parse(localStorage.getItem('ilklot:q:' + code) || '[]');
      if (parsed.length) eventLog.queue = parsed;
    } catch (error) {}
    // Olay numarası sürekliliği: anlık görüntü eski kalmış olabilir; saklı sayaç ve kuyruktaki en büyük numaradan devam edilir
    eventLog.counter = 0;
    try {
      eventLog.counter = Math.max(0, parseInt(localStorage.getItem('ilklot:evn:' + code) || '0', 10) || 0);
    } catch (error) {}
    eventLog.queue.forEach(function (item) {
      if (item.n > eventLog.counter) eventLog.counter = item.n;
    });
    const snapshot = value['sess_' + CONFIG.session];
    if (snapshot && snapshot.seed === CONFIG.seed) {
      restoreSnapshot(snapshot);
      state.busy = false;
      if (state.ended) {
        state.stage = 'end';
        render();
        return;
      }
      state.stage = state.practiceDone ? 'app' : state.preTest == null ? 'pre' : 'intro';
      logEvent('session_resume', {
        ti: state.trialIndex,
      });
      render();
      showToast('Kaldığın yerden devam ediyorsun.');
      return;
    }
    await participantRepository.saveP(code, {
      code: code,
      grp: allocation.grp,
      firstSeen: value.firstSeen || new Date().toISOString(),
    });
    errorState.pending.forEach(function (item) {
      logEvent('client_error', item);
    });
    errorState.pending = [];
    if (state.consentAt)
      logEvent('consent_given', {
        ver: CONSENT_VERSION,
        opened: Object.keys(state.consentOpenSections || {}),
        dl: !!state.consentDownloaded,
        ms: state.consentMs,
      });
    logEvent('session_start', {
      theme: document.documentElement.getAttribute('data-theme') || 'light',
      quick: false,
      v: APP_VERSION,
      seed: CONFIG.seed,
      order: state.setOrder,
      fp: stimulusFingerprint(),
      ua: navigator.userAgent.slice(0, 120),
      screen: innerWidth + 'x' + innerHeight,
      consentAt: state.consentAt,
    });
    // İlk kez gelen: ön test → tanıtım → alıştırma. Sonraki oturumlar doğrudan piyasaya
    state.busy = false;
    if (state.preTest == null) {
      state.stage = state.hasDemographics ? 'pre' : 'demo';
      state.demographics = {
        inv: [],
      };
      state.introStep = 0;
    } else {
      state.stage = 'app';
      saveSnapshot();
    }
    render();
    flushEvents();
  } catch (error) {
    state.busy = false;
    state.codeError = 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.';
    render();
  }
}
export function endSession() {
  if (state.ended) return;
  state.ended = true;
  state.phase = 'done';
  state.endedAt = new Date().toISOString();
  state.filmProgress = null;
  logEvent('session_end', {
    total: Math.round(state.totalDecisions),
    decisions: state.decisions.length,
    fp: stimulusFingerprint(),
  });
  state.stage = 'end';
  render();
  saveSnapshot();
  flushEvents();
}
export async function withdrawParticipant() {
  const participantCode = state.participantCode;
  const group = state.group;
  rememberCode(null);
  state.allocationCache = null;
  try {
    await participantRepository.withdraw(participantCode, group);
  } catch (error) {
    showToast('Çekilme kaydedilemedi, bağlantını kontrol edip tekrar dene.');
    return;
  }
  try {
    localStorage.removeItem('ilklot:q:' + participantCode);
    localStorage.removeItem('ilklot:evn:' + participantCode);
  } catch (error) {}
  clearInterval(state.cooldownTimer);
  eventLog.queue = [];
  state.participantCode = null;
  state.ended = true;
  state.trial = null;
  state.stage = 'withdrawn';
  render();
}
const storeReady = participantRepository.init();
