// Eylemler: onam, form, testler, giriş akışı.

import { actions } from './index.js';
import { saveFile } from '../../admin/admin-exports.js';
import { render } from '../../views/app-shell.js';
import { state } from '../app-state.js';
import { comprehensionQuestionAt } from '../../models/comprehension.js';
import { COMPREHENSION_POOLS } from '../../constants/comprehension-questions.js';
import { consentText } from '../../views/consent-view.js';
import { byId } from '../../utils/dom.js';
import { createSummaryCard } from '../../views/end-view.js';
import { eventLog, flushEvents, logEvent } from '../../services/event-log.js';
import { startFilm } from '../../widgets/film-widget.js';
import { askConfirm } from '../../widgets/modal.js';
import { rememberCode } from '../../utils/participant-code.js';
import { participantRepository } from '../../repositories/participant-repository.js';
import { savePilotFeedback } from '../pilot-feedback.js';
import { endSession, enterCode } from '../session-lifecycle.js';
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
    // Linkten ya da hatırlanan koddan geldiyse kod ekranı atlanır
    if (state.pendingCode) {
      state.busy = true;
      render();
      enterCode(state.pendingCode);
      return;
    }
    state.stage = 'code';
    render();
    setTimeout(function () {
      var codeInputElement = byId('code-input');
      if (codeInputElement) codeInputElement.focus();
    }, 50);
  },
  downloadConsentText: function () {
    state.consentDownloaded = 1;
    saveFile('ilklot_onam_metni.txt', consentText()).catch(function () {
      showToast('Metin indirilemedi.');
    });
  },
  continueFromWelcome: function () {
    state.busy = true;
    render();
    enterCode(state.welcomeBack.code);
  },
  rejectRememberedCode: function () {
    rememberCode(null);
    state.pendingCode = null;
    state.welcomeBack = null;
    state.codeError = '';
    state.stage = 'consent';
    render();
  },
  submitCode: function () {
    var codeInputElement = byId('code-input');
    state.codeInput = codeInputElement ? codeInputElement.value : state.codeInput;
    state.busy = true;
    render();
    enterCode(state.codeInput);
  },
  useDemoCode: function (value) {
    state.codeInput = value;
    enterCode(value);
  },
  resetDemoData: function () {
    askConfirm(
      'Demo verisini sıfırla',
      'Bu cihazdaki tüm demo kayıtları silinir ve yeni demo kodları oluşturulur.',
      'Sıfırla',
      true,
      function () {
        participantRepository.resetLocal();
        rememberCode(null);
        state.allocationCache = null;
        state.demoCodeUsed = null;
        state.codeInput = '';
        state.codeError = '';
        state.stage = 'code';
        render();
      }
    );
  },
  setDemographic: function (value) {
    var price = value.split('|'),
      key = price[0],
      position = DEMOGRAPHIC_OPTIONS[key][+price[1]],
      demographics = state.demographics;
    if (key === 'inv') {
      if (position === 'Hiç yapmadım')
        demographics.inv = demographics.inv[0] === 'Hiç yapmadım' ? [] : ['Hiç yapmadım'];
      else {
        demographics.inv = demographics.inv.filter(function (item) {
          return item !== 'Hiç yapmadım';
        });
        var j = demographics.inv.indexOf(position);
        j < 0 ? demographics.inv.push(position) : demographics.inv.splice(j, 1);
      }
    } else demographics[key] = demographics[key] === position ? null : position;
    render();
  },
  finishDemographics: async function () {
    var demographics = state.demographics;
    if (!demographics.adult) return;
    if (demographics.adult === 'Hayır') {
      var participantCode = state.participantCode,
        group = state.group;
      // 18 yaş altı: hiçbir demografik veri saklanmaz, kayıt kapatılır
      rememberCode(null);
      state.allocationCache = null;
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
    var demo = {
      age: demographics.age || null,
      gender: demographics.gender || null,
      field: demographics.field || null,
      year: demographics.year || null,
      inv: demographics.inv,
      sim: demographics.sim || null,
    };
    participantRepository
      .saveP(state.participantCode, { demo: demo, demoAt: new Date().toISOString() })
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
    var testQuestion = state.testQuestion,
      innerTestQuestionSequence = testQuestionSequence(testQuestion.kind),
      innerItem = innerTestQuestionSequence[testQuestion.i];
    if (innerItem === 'att') {
      state.attentionPassed = +value === ATTENTION_QUESTION[2];
      logEvent('attention_check', { pass: state.attentionPassed, choice: +value });
      participantRepository
        .saveP(state.participantCode, { attPass: state.attentionPassed })
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
      var length = innerTestQuestionSequence.filter(function (item) {
          return item !== 'att';
        }).length,
        sc = Math.round((testQuestion.sc / length) * 100),
        map = {};
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
      participantRepository.saveP(state.participantCode, map).catch(function () {});
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
    var comprehension = state.comprehension,
      question = comprehensionQuestionAt(comprehension.i);
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
    var comprehension = state.comprehension;
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
      participantRepository.saveP(state.participantCode, { comp: comprehension.score }).catch(function () {});
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
    var group = (byId('purpose-guess') || {}).value || '';
    state.purposeGuess = group.trim().slice(0, 400);
    logEvent('purpose_guess', { len: state.purposeGuess.length });
    participantRepository.saveP(state.participantCode, { guess: state.purposeGuess }).catch(function () {});
    flushEvents();
    render();
  },
  skipPurposeGuess: function () {
    state.purposeGuess = '';
    participantRepository.saveP(state.participantCode, { guess: '' }).catch(function () {});
    render();
  },
  chooseDecision: function (value) {
    if (state.trial && state.trial.phase === 'choose') chooseOption(value);
  },
  nextTrial: advanceAfterOutcome,
  answerStress: function (innerValue) {
    var stressKey = state.stressKey,
      value = +innerValue || null;
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
  pickFeedbackAnswer: function (value) {
    var price = String(value).split('|');
    if (
      !PILOT_FEEDBACK_QUESTIONS.some(function (item) {
        return item[0] === price[0] && item[2].indexOf(price[1]) >= 0;
      })
    )
      return;
    state.feedbackDraft = state.feedbackDraft || {};
    state.feedbackDraft[price[0]] = state.feedbackDraft[price[0]] === price[1] ? null : price[1];
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
    participantRepository.saveP(state.participantCode, { manip: value }).catch(function () {});
    flushEvents();
    render();
  },
  playFilm: function () {
    state.filmProgress = 0;
    startFilm();
  },
};
