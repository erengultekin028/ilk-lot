// İstemci hatalarını yakalayıp olay olarak kaydetme.

import { state } from '../viewmodels/app-state.js';
import { logEvent } from './event-log.js';

// ── Tarayıcı hataları ──
// Sahada katılımcının cihazında çıkan hatayı görmenin tek yolu bu. Aynı hata tekrar tekrar yazılmaz, oturum başına en fazla 20
export const errorState = { seen: {}, count: 0, pending: [] };

function captureError(kind, msg, extra) {
  var innerKey = kind + msg;
  if (errorState.seen[innerKey] || errorState.count >= 20) return;
  errorState.seen[innerKey] = 1;
  errorState.count++;
  var map = { kind: kind, msg: String(msg).slice(0, 300), stage: state.stage, tab: state.tab };
  for (var key in extra || {}) map[key] = extra[key];
  if (state.participantCode) logEvent('client_error', map);
  else errorState.pending.push(map);
}

addEventListener('error', function (event) {
  captureError('error', event.message, {
    src: (event.filename || '').slice(-60),
    line: event.lineno,
    col: event.colno,
    stack: event.error && event.error.stack ? String(event.error.stack).slice(0, 500) : null,
  });
});

addEventListener('unhandledrejection', function (event) {
  var reason = event.reason;
  captureError('promise', (reason && reason.message) || reason, {
    stack: reason && reason.stack ? String(reason.stack).slice(0, 500) : null,
  });
});
