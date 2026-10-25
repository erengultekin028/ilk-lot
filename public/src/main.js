// Uygulamanın giriş noktası: dinleyicileri bağlar, ilk çizimi yapar.

import { render } from './views/app-shell.js';
import { bootstrap } from './viewmodels/session-lifecycle.js';

import './viewmodels/event-bindings.js';
import { state } from './viewmodels/app-state.js';
import { actions } from './viewmodels/actions/index.js';
import { participantRepository } from './repositories/participant-repository.js';
import { CONFIG } from './constants/app-config.js';
import { initSimulation, stepSimulation } from './models/market-simulation.js';
import { updateSimulatorLive } from './views/simulator-view.js';
import { flushEvents } from './services/event-log.js';
import { stimulusFingerprint, TRIAL_SETS } from './models/trial-generator.js';

render();

bootstrap();

// Otomatik testler ve tarayıcı konsolu için erişim noktası (üretim davranışını değiştirmez)
window.ilkLot = {
  state,
  actions,
  participantRepository,
  config: CONFIG,
  render,
  initSimulation,
  stepSimulation,
  updateSimulatorLive,
  flushEvents,
  stimulusFingerprint,
  trialSets: TRIAL_SETS,
};
