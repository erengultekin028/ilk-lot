// Eylemler: onam, form, testler, giriş akışı.

import { actions } from './index.js';
import { saveFile } from '../../utils/file-download.js';
import { render } from '../../views/app-shell.js';
import { state } from '../app-state.js';
import { comprehensionQuestionAt } from '../../models/comprehension.js';
import { COMPREHENSION_POOLS } from '../../constants/comprehension-questions.js';
import { consentText } from '../../views/consent-view.js';
import { createSummaryCard } from '../../views/end-view.js';
import { eventLog, flushEvents, logEvent } from '../../services/event-log.js';
import { startFilm } from '../../widgets/film-widget.js';
import { participantRepository } from '../../repositories/participant-repository.js';
import { savePilotFeedback } from '../pilot-feedback.js';
import { byId } from '../../utils/dom.js';
import { bootstrap, endSession, enrollAndStart, startParticipation } from '../session-lifecycle.js';
import { saveSnapshot } from '../../services/session-persistence.js';
import { advanceAfterOutcome, chooseOption, startTrial } from '../study-flow.js';
import { ATTENTION_QUESTION, TEST_QUESTIONS, testQuestionSequence } from '../../constants/test-questions.js';
import { showToast } from '../../widgets/toast.js';
import { DEMOGRAPHIC_OPTIONS, PILOT_FEEDBACK_QUESTIONS } from '../../constants/ui-constants.js';

export const flowActions = {
  acceptConsent: function () {
    if (!state.consentChecked) {
      showToast('Devam etmek için onay kutusunu işaretle.');
      return;
    }
    state.consentAt = new Date().toISOString();
    state.consentMs = Date.now() - (state.consentStartedAt || Date.now());
    // Bu cihazda daha önce yuva alınmışsa aynı kayıtla devam edilir; yoksa sıradaki yuva alınır
    if (state.pendingCode) {
      startParticipation(state.pendingCode);
      return;
    }
    enrollAndStart();
  },
  downloadConsentText: function () {
    state.consentDownloaded = 1;
    saveFile('ilklot_onam_metni.txt', consentText()).catch(function () {
      showToast('Metin indirilemedi.');
    });
  },
  continueFromWelcome: function () {
    startParticipation(state.welcomeBack.code);
  },
  retryConnection: function () {
    state.stage = 'boot';
    render();
    bootstrap();
  },
  setDemographic: function (innerValue) {
    const value = innerValue.split('|');
    const key = value[0];
    const position = DEMOGRAPHIC_OPTIONS[key][+value[1]];
    const demographics = state.demographics;
    if (key === 'inv') {
      if (position === 'Hiç yapmadım')
        demographics.inv = demographics.inv[0] === 'Hiç yapmadım' ? [] : ['Hiç yapmadım'];
      else {
        demographics.inv = demographics.inv.filter(function (item) {
          return item !== 'Hiç yapmadım';
        });
        const j = demographics.inv.indexOf(position);
        j < 0 ? demographics.inv.push(position) : demographics.inv.splice(j, 1);
      }
    } else demographics[key] = demographics[key] === position ? null : position;
    render();
  },
  finishDemographics: async function () {
    const demographics = state.demographics;
    if (!demographics.adult) return;
    if (demographics.adult === 'Hayır') {
      const participantCode = state.participantCode;
      const group = state.group;
      // 18 yaş altı: hiçbir demografik veri saklanmaz, kayıt kapatılır
      try {
        await participantRepository.withdraw(participantCode, group, { ineligible: true });
      } catch (error) {}
      try {
        localStorage.removeItem('ilklot:q:' + participantCode);
      } catch (error) {}
      eventLog.queue = [];
      state.participantCode = null;
      state.stage = 'inelig';
      render();
      return;
    }
    const demo = {
      age: demographics.age || null,
      gender: demographics.gender || null,
      field: demographics.field || null,
      year: demographics.year || null,
      inv: demographics.inv,
      sim: demographics.sim || null,
    };
    participantRepository
      .saveParticipant(state.participantCode, { demo: demo, demoAt: new Date().toISOString() })
      .catch(function () {});
    logEvent('demographics_done', {});
    state.hasDemographics = true;
    state.stage = 'pre';
    render();
  },
  startTest: function (value) {
    state.testQuestion = { kind: value, i: 0, sc: 0 };
    render();
  },
  answerTest: function (value) {
    const testQuestion = state.testQuestion;
    const innerTestQuestionSequence = testQuestionSequence(testQuestion.kind);
    const innerItem = innerTestQuestionSequence[testQuestion.i];
    if (innerItem === 'att') {
      state.attentionPassed = +value === ATTENTION_QUESTION[2];
      logEvent('attention_check', { pass: state.attentionPassed, choice: +value });
      participantRepository
        .saveParticipant(state.participantCode, { attPass: state.attentionPassed })
        .catch(function () {});
    } else {
      logEvent('test_answer', {
        kind: testQuestion.kind,
        q: innerItem,
        choice: +value,
        correct: +value === TEST_QUESTIONS[innerItem][2],
        dk: TEST_QUESTIONS[innerItem][1][+value] === 'Bilmiyorum',
      });
      if (+value === TEST_QUESTIONS[innerItem][2]) {
        testQuestion.sc++;
        if (innerItem < 3) testQuestion.sc3 = (testQuestion.sc3 || 0) + 1;
      }
    }
    testQuestion.i++;
    if (testQuestion.i >= innerTestQuestionSequence.length) {
      const length = innerTestQuestionSequence.filter(function (item) {
        return item !== 'att';
      }).length;
      const sc = Math.round((testQuestion.sc / length) * 100);
      const map = {};
      if (testQuestion.kind === 'pre') {
        state.preTest = sc;
        state.preTestBigThree = Math.round(((testQuestion.sc3 || 0) / 3) * 100);
        state.stage = 'intro';
        state.introStep = 0;
        map.pre = sc;
        map.preB3 = state.preTestBigThree;
      } else {
        state.postTest = sc;
        map.post = sc;
      }
      map[testQuestion.kind + 'At'] = new Date().toISOString();
      logEvent('test_done', {
        kind: testQuestion.kind,
        score: sc,
        b3: testQuestion.kind === 'pre' ? state.preTestBigThree : undefined,
      });
      participantRepository.saveParticipant(state.participantCode, map).catch(function () {});
      flushEvents();
      state.testQuestion = null;
    }
    render();
  },
  nextIntroStep: function () {
    if (state.introStep < 2) {
      state.introStep++;
      render();
    } else actions.finishIntro();
  },
  finishIntro: function () {
    logEvent('intro_done', {});
    state.stage = 'task';
    state.trial = { mode: 'practice', i: 0 };
    startTrial();
  },
  startMainStudy: function () {
    logEvent('task_start', { block: 'pre' });
    state.phase = 'pre';
    state.block = 'pre';
    state.trialIndex = 0;
    state.trial = { mode: 'main', i: 0 };
    startTrial();
  },
  answerQuiz: function (value) {
    const comprehension = state.comprehension;
    const question = comprehensionQuestionAt(comprehension.i);
    if (comprehension.sel === question.a) return;
    value = +value;
    if (comprehension.first[comprehension.i] == null)
      comprehension.first[comprehension.i] = value === question.a;
    comprehension.att[comprehension.i] = (comprehension.att[comprehension.i] || 0) + 1;
    comprehension.sel = value;
    logEvent('comprehension_answer', { q: comprehension.i, choice: value, correct: value === question.a });
    render();
  },
  nextQuiz: function () {
    const comprehension = state.comprehension;
    logEvent('comprehension', {
      q: comprehension.i,
      form: (comprehension.f || [])[comprehension.i] || 0,
      firstCorrect: comprehension.first[comprehension.i],
      attempts: comprehension.att[comprehension.i],
    });
    comprehension.i++;
    comprehension.sel = null;
    if (comprehension.i >= COMPREHENSION_POOLS.length) {
      comprehension.score = comprehension.first.filter(Boolean).length;
      participantRepository
        .saveParticipant(state.participantCode, { comp: comprehension.score })
        .catch(function () {});
      state.practiceDone = true;
      state.trial.phase = 'ready';
      saveSnapshot();
      flushEvents();
    }
    render();
  },
  downloadSummaryCard: function () {
    createSummaryCard();
  },
  submitPurposeGuess: function () {
    const group = (byId('purpose-guess') || {}).value || '';
    state.purposeGuess = group.trim().slice(0, 400);
    logEvent('purpose_guess', { len: state.purposeGuess.length });
    participantRepository
      .saveParticipant(state.participantCode, { guess: state.purposeGuess })
      .catch(function () {});
    flushEvents();
    render();
  },
  skipPurposeGuess: function () {
    state.purposeGuess = '';
    participantRepository.saveParticipant(state.participantCode, { guess: '' }).catch(function () {});
    render();
  },
  chooseDecision: function (value) {
    if (state.trial && state.trial.phase === 'choose') chooseOption(value);
  },
  nextTrial: advanceAfterOutcome,
  answerStress: function (innerValue) {
    const stressKey = state.stressKey;
    const value = +innerValue || null;
    state.pulses[stressKey] = { v: value, ms: Date.now() - (state.stressStartedAt || Date.now()) };
    logEvent('stress_rating', { block: stressKey, value: value, skipped: !value });
    if (stressKey === 'b_pre') {
      state.stage = 'bridge';
      state.bridge = 'sim';
      state.readingStartedAt = Date.now();
      saveSnapshot();
      render();
      return;
    }
    if (stressKey === 'b_sim') {
      state.phase = 'post';
      state.block = 'post';
      state.trialIndex = 0;
      state.stage = 'bridge';
      state.bridge = 'post';
      saveSnapshot();
      render();
      return;
    }
    saveSnapshot();
    endSession();
  },
  pickFeedbackAnswer: function (innerValue) {
    const value = String(innerValue).split('|');
    if (
      !PILOT_FEEDBACK_QUESTIONS.some(function (item) {
        return item[0] === value[0] && item[2].indexOf(value[1]) >= 0;
      })
    )
      return;
    state.feedbackDraft = state.feedbackDraft || {};
    state.feedbackDraft[value[0]] = state.feedbackDraft[value[0]] === value[1] ? null : value[1];
    render();
  },
  sendFeedback: function () {
    savePilotFeedback(false);
  },
  skipFeedback: function () {
    savePilotFeedback(true);
  },
  answerManipulationCheck: function (value) {
    state.manipulationCheck = value;
    logEvent('manipulation_check', { answer: value });
    participantRepository.saveParticipant(state.participantCode, { manip: value }).catch(function () {});
    flushEvents();
    render();
  },
  playFilm: function () {
    state.filmProgress = 0;
    startFilm();
  },
};
