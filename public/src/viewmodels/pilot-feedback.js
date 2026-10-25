// Pilot geri bildirim formunun kaydı.

import { PILOT_MODE } from '../constants/app-config.js';
import { render } from '../views/app-shell.js';
import { state } from './app-state.js';
import { flushEvents, logEvent } from '../services/event-log.js';
import { participantRepository } from '../repositories/participant-repository.js';

// Pilot geri bildirimi: hiçbiri seçilmeden gönderilirse atlama sayılır. Atlayan da bir daha sorulmaz.
export function savePilotFeedback(skip) {
  if (!PILOT_MODE || !state.participantCode || state.pilotFeedback) return;
  const data = state.feedbackDraft || {};
  if (!skip && !data.clear && !data.dur && !data.unease) skip = true;
  const position = skip
    ? { skip: 1 }
    : { clear: data.clear ? +data.clear : null, dur: data.dur || null, unease: data.unease || null };
  position.at = new Date().toISOString();
  state.pilotFeedback = position;
  logEvent('pilot_feedback', position);
  participantRepository.saveP(state.participantCode, { fb: position }).catch(function () {});
  flushEvents();
  render();
}
