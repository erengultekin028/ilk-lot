// Oturumun açılışı, katılım (anonim giriş + yuva ataması) ve bitişi.
// Akış: sayfa açılır → Firebase'e bağlanılır, anonim giriş yapılır → bu kullanıcının kodu var mı bakılır
// (varsa kaldığı yerden devam, yoksa onam ekranı) → onamdan sonra sıradaki yuva alınır → çalışma başlar.

import { APP_VERSION, CONFIG, CONSENT_VERSION } from '../constants/app-config.js';
import { render } from '../views/app-shell.js';
import { state } from './app-state.js';
import { errorState } from '../services/error-capture.js';
import { eventLog, flushEvents, logEvent } from '../services/event-log.js';
import { participantRepository } from '../repositories/participant-repository.js';
import { enrollmentRepository } from '../repositories/enrollment-repository.js';
import { connectFirebase } from '../services/firebase-service.js';
import { signInAnonymouslyIfNeeded } from '../services/auth-service.js';
import { hashSeed } from '../utils/random.js';
import {
  findNextSession,
  gapLeftMs,
  restoreSnapshot,
  saveSnapshot,
} from '../services/session-persistence.js';
import { showToast } from '../widgets/toast.js';
import { stimulusFingerprint } from '../models/trial-generator.js';

// Katılım sırasında oluşan hatayı onam ekranında gösterir (kod ekranı kalktı)
function showEnrollmentError(message) {
  state.busy = false;
  state.enrollError = message;
  state.stage = 'consent';
  render();
}

// Bağlantı kurulamadığında tekrar dene ekranı: veri yerel kayda DÜŞMEZ, çalışma başlamaz
function showConnectionError(error) {
  state.busy = false;
  state.stage = 'connection-error';
  state.connectionError = (error && error.message) || String(error);
  render();
}

// Açılış: Firebase'e bağlan, anonim giriş yap; bu kullanıcı daha önce katıldıysa onu karşıla
export async function bootstrap() {
  try {
    await connectFirebase();
    const user = await signInAnonymouslyIfNeeded();
    const enrollment = await enrollmentRepository.findEnrollment(user.uid);
    if (!enrollment) {
      state.stage = 'consent';
      return render();
    }
    const participant = (await participantRepository.getParticipant(enrollment.code)) || {};
    if (participant.withdrawn) {
      state.stage = 'withdrawn';
      return render();
    }
    state.pendingCode = enrollment.code;
    state.welcomeBack = { code: enrollment.code, next: findNextSession(participant) };
    state.stage = participant.consentAt ? 'welcome' : 'consent';
    render();
  } catch (error) {
    showConnectionError(error);
  }
}

// Onam kabul edildikten sonra: kullanıcının kodu yoksa sıradaki yuvayı al, sonra çalışmayı başlat
export async function enrollAndStart() {
  state.enrollError = '';
  state.busy = true;
  render();
  try {
    const user = await signInAnonymouslyIfNeeded();
    const enrollment = await enrollmentRepository.enroll(user.uid);
    await startParticipation(enrollment.code);
  } catch (error) {
    showEnrollmentError(
      (error && error.message) || 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.'
    );
  }
}

// Katılımcı kodu belli olduktan sonra oturumu başlatır ya da kaldığı yerden sürdürür.
// ARAŞTIRMA: grup (A/B) ve set sırası kayıtlı atamadan okunur; katılımcı değiştiremez.
export async function startParticipation(code) {
  state.enrollError = '';
  state.busy = true;
  render();
  try {
    const allocation = await enrollmentRepository.getAllocation(code);
    if (!allocation) throw new Error('Katılım kaydın bulunamadı. Araştırmacıyla iletişime geç.');
    const value = (await participantRepository.getParticipant(code)) || {};
    if (value.withdrawn) {
      state.busy = false;
      state.stage = 'withdrawn';
      return render();
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
      state.manipulationCheck = value.manip || null;
      state.pilotFeedback = value.fb || null;
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
      return render();
    }
    CONFIG.session = nextX.n;
    // İlk onam zamanı katılımcı kaydına yazılır; sonraki oturumlarda onam tekrar sorulmaz
    if (state.consentAt && !value.consentAt)
      await participantRepository.saveParticipant(code, {
        code: code,
        grp: allocation.grp,
        consentAt: state.consentAt,
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
    state.manipulationCheck = value.manip || null;
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
    await participantRepository.saveParticipant(code, {
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
    showEnrollmentError(
      (error && error.message) || 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.'
    );
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
