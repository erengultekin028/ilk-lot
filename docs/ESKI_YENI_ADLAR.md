# Eski ve yeni adlar (b26 → b27 yeniden yapılandırma)

Bu belge, yeniden yapılandırmada değişen kod adlarının karşılık tablosudur. Eski testler, eski notlar ve eski ekran görüntüsü betikleri bu adları kullanır; güncellerken bu tabloya bak. **Değişmeyenler:** Firestore alan adları, olay adları (`session_start`, `cooldown_shown` …), CSV sütunları, `CONFIG` anahtarları, kayıtlı anlık görüntü anahtarları (`ti`, `dec`, `sim` …), `data-in`/`data-v` değerleri.

## Üst düzey işlevler ve sabitler

| Eski | Yeni (modül) |
|---|---|
| `APP_VERSION` | `APP_VERSION` (constants/app-config.js) |
| `QS` | `QUERY_PARAMS` (constants/app-config.js) |
| `HASH` | `HASH_PARAMS` (constants/app-config.js) |
| `CFG` | `CONFIG` (constants/app-config.js) |
| `QUICK` | `QUICK_TEST_MODE` (constants/app-config.js) |
| `DEMO` | `DEMO_MODE` (constants/app-config.js) |
| `PILOT` | `PILOT_MODE` (constants/app-config.js) |
| `FORCED_SESSION` | `FORCED_SESSION` (constants/app-config.js) |
| `CONSENT_VER` | `CONSENT_VERSION` (constants/app-config.js) |
| `simLim` | `simulationTickLimit` (models/market-simulation.js) |
| `simMin` | `simulationMinutesText` (models/market-simulation.js) |
| `tickSecText` | `tickSecondsText` (models/market-simulation.js) |
| `seedOf` | `hashSeed` (utils/random.js) |
| `_rs` | `mainRngState` (utils/random.js) |
| `rnd` | `random` (utils/random.js) |
| `rr` | `randomBetween` (utils/random.js) |
| `shuffle` | `shuffleArray` (utils/random.js) |
| `$` | `byId` (utils/dom.js) |
| `fmt` | `formatNumber` (utils/format.js) |
| `r2` | `round2` (utils/format.js) |
| `sgn` | `signPrefix` (utils/format.js) |
| `cls` | `directionClass` (utils/format.js) |
| `chg` | `formatPercentChange` (utils/format.js) |
| `tl` | `formatLira` (utils/format.js) |
| `esc` | `escapeHtml` (utils/format.js) |
| `mmss` | `formatMinutesSeconds` (utils/format.js) |
| `TQ` | `TEST_QUESTIONS` (constants/test-questions.js) |
| `ATT` | `ATTENTION_QUESTION` (constants/test-questions.js) |
| `tqSeq` | `testQuestionSequence` (constants/test-questions.js) |
| `SECTORS` | `SECTORS` (constants/stimulus-content.js) |
| `NEWS_CRISIS` | `CRISIS_HEADLINES` (constants/stimulus-content.js) |
| `NEWS_NORMAL` | `NORMAL_HEADLINES` (constants/stimulus-content.js) |
| `TASKNAMES` | `TASK_STOCKS` (constants/stimulus-content.js) |
| `makePath` | `makePricePath` (models/trial-generator.js) |
| `PAIR` | `PAIR_PARAMS` (models/trial-generator.js) |
| `buildSet` | `buildTrialSet` (models/trial-generator.js) |
| `TRS` | `TRIAL_SETS` (models/trial-generator.js) |
| `BT` | `currentBlockTrials` (models/trial-generator.js) |
| `buildPractice` | `buildPracticeTrials` (models/trial-generator.js) |
| `PR` | `PRACTICE_TRIALS` (models/trial-generator.js) |
| `fingerprint` | `stimulusFingerprint` (models/trial-generator.js) |
| `weekCh` | `lastWeekChangePercent` (models/trial-generator.js) |
| `S` | `state` (viewmodels/app-state.js) |
| `TOUR_TASK` | `TASK_TOUR_STEPS` (constants/tour-steps.js) |
| `TOUR_SIM` | `SIMULATOR_TOUR_STEPS` (constants/tour-steps.js) |
| `COMP` | `COMPREHENSION_POOLS` (constants/comprehension-questions.js) |
| `compNew` | `newComprehensionSelection` (models/comprehension.js) |
| `compQ` | `comprehensionQuestionAt` (models/comprehension.js) |
| `READING` | `READING_CARDS` (constants/glossary.js) |
| `SELL_WHY` | `SELL_REASONS` (constants/glossary.js) |
| `GLOSSARY` | `GLOSSARY` (constants/glossary.js) |
| `SIMBASE` | `STOCK_BASES` (constants/market-data.js) |
| `_r2` | `marketRngState` (utils/random.js) |
| `rnd2` | `marketRandom` (utils/random.js) |
| `simInit` | `initSimulation` (models/market-simulation.js) |
| `simCrises` | `activeCrises` (models/market-simulation.js) |
| `simCrisis` | `crisisAt` (models/market-simulation.js) |
| `simStockCrisis` | `stockCrisisAt` (models/market-simulation.js) |
| `SIMNEWS` | `SIMULATOR_NEWS` (constants/market-data.js) |
| `SIMCOL` | `STOCK_COLORS` (constants/market-data.js) |
| `simNewsList` | `newsItems` (models/market-simulation.js) |
| `simNewsAt` | `latestNewsAt` (models/market-simulation.js) |
| `simStep` | `stepSimulation` (models/market-simulation.js) |
| `FREE_LV` | `FREE_PLAY_LEVELS` (constants/free-play-data.js) |
| `FREE_SEC` | `FREE_PLAY_SECTORS` (constants/free-play-data.js) |
| `FREE_N` | `FREE_PLAY_NEWS` (constants/free-play-data.js) |
| `FREE_NEU` | `FREE_PLAY_NEUTRAL_NEWS` (constants/free-play-data.js) |
| `FREE_SC` | `FREE_PLAY_SCENARIOS` (constants/free-play-data.js) |
| `FREE_PF` | `FREE_PLAY_PORTFOLIOS` (constants/free-play-data.js) |
| `FREE_LIMS` | `FREE_PLAY_LOSS_LIMITS` (constants/free-play-data.js) |
| `freePick` | `pickRandomItem` (models/free-play-model.js) |
| `freePortfolio` | `applyFreePlayPortfolio` (models/free-play-model.js) |
| `freeInit` | `initFreePlay` (models/free-play-model.js) |
| `freePlan` | `planFreePlayEvents` (models/free-play-model.js) |
| `freeLimit` | `freePlayLossFloor` (models/free-play-model.js) |
| `freeLim` | `freePlayLossLimit` (models/free-play-model.js) |
| `freeLimitF` | `freePlayLossFloorFor` (models/free-play-model.js) |
| `simValue` | `portfolioValue` (models/market-simulation.js) |
| `simBase` | `findStockBase` (models/market-simulation.js) |
| `simCo` | `stockCompanyName` (models/market-simulation.js) |
| `simName` | `stockFullName` (models/market-simulation.js) |
| `toastT` | `toastTimer` (widgets/toast.js) |
| `note` | `showToast` (widgets/toast.js) |
| `QRLib` | `QRLib` (vendor/qr-lib.js) |
| `qrSvg` | `renderQrSvg` (widgets/qr-code.js) |
| `Store` | `participantRepository` (repositories/participant-repository.js) |
| `ALPHA` | `CODE_ALPHABET` (utils/participant-code.js) |
| `CODE_RE` | `CODE_PATTERN` (utils/participant-code.js) |
| `cryptoInt` | `secureRandomInt` (utils/participant-code.js) |
| `newCode` | `generateCode` (utils/participant-code.js) |
| `normCode` | `normalizeCode` (utils/participant-code.js) |
| `fmtCodeInput` | `formatCodeInput` (utils/participant-code.js) |
| `makeAlloc` | `buildAllocationList` (utils/participant-code.js) |
| `linkFor` | `participantLinkFor` (utils/participant-code.js) |
| `remember` | `rememberCode` (utils/participant-code.js) |
| `remembered` | `rememberedCode` (utils/participant-code.js) |
| `maskCode` | `maskCode` (utils/participant-code.js) |
| `EVQ` | `eventQueue` (services/event-log.js) |
| `evN` | `eventCounter` (services/event-log.js) |
| `flushing` | `flushInProgress` (services/event-log.js) |
| `log` | `logEvent` (services/event-log.js) |
| `ERRS_SEEN` | `SEEN_ERRORS` (services/error-capture.js) |
| `errCount` | `errorCount` (services/error-capture.js) |
| `preErr` | `pendingErrors` (services/error-capture.js) |
| `captureErr` | `captureError` (services/error-capture.js) |
| `syncState` | `syncStatus` (services/event-log.js) |
| `updDot` | `updateSyncIndicator` (widgets/sync-indicator.js) |
| `saveQueue` | `persistEventQueue` (services/event-log.js) |
| `flush` | `flushEvents` (services/event-log.js) |
| `snapshot` | `createSnapshot` (services/session-persistence.js) |
| `saveSnap` | `saveSnapshot` (services/session-persistence.js) |
| `restore` | `restoreSnapshot` (services/session-persistence.js) |
| `nextSession` | `findNextSession` (services/session-persistence.js) |
| `gapLeftMs` | `gapLeftMs` (services/session-persistence.js) |
| `codeFail` | `showCodeError` (viewmodels/session-lifecycle.js) |
| `boot` | `bootstrap` (viewmodels/session-lifecycle.js) |
| `enterCode` | `enterCode` (viewmodels/session-lifecycle.js) |
| `endSession` | `endSession` (viewmodels/session-lifecycle.js) |
| `csvCell` | `csvCell` (admin/admin-exports.js) |
| `toCsv` | `toCsv` (admin/admin-exports.js) |
| `saveFile` | `saveFile` (admin/admin-exports.js) |
| `summarizeSnap` | `summarizeSnapshot` (services/session-persistence.js) |
| `exportParticipants` | `exportParticipants` (admin/admin-exports.js) |
| `exportEvents` | `exportEvents` (admin/admin-exports.js) |
| `byNo` | `sortedByNumber` (admin/admin-exports.js) |
| `exportAlloc` | `exportAllocations` (admin/admin-exports.js) |
| `exportCards` | `exportCards` (admin/admin-exports.js) |
| `stageText` | `stageDescription` (admin/admin-dashboard.js) |
| `loadDash` | `loadDashboard` (admin/admin-dashboard.js) |
| `ringSvg` | `renderProgressRing` (admin/admin-dashboard.js) |
| `dashHtml` | `renderDashboard` (admin/admin-dashboard.js) |
| `exportPoster` | `exportPoster` (admin/admin-exports.js) |
| `adminHtml` | `renderAdminPanel` (admin/admin-view.js) |
| `ADMIN_ACT` | `ADMIN_ACTIONS` (admin/admin-actions.js) |
| `sec` | `section` (widgets/section.js) |
| `bar` | `progressBar` (widgets/section.js) |
| `cfld` | `consentField` (views/consent-view.js) |
| `consentSections` | `consentSections` (views/consent-view.js) |
| `consentText` | `consentText` (views/consent-view.js) |
| `vConsent` | `renderConsent` (views/consent-view.js) |
| `vStage` | `renderStage` (views/stage-view.js) |
| `vDemoLand` | `renderDemoLanding` (views/demo-view.js) |
| `vDemoEnd` | `renderDemoEnd` (views/demo-view.js) |
| `demoHint` | `demoHintHtml` (views/demo-view.js) |
| `DM` | `DEMOGRAPHIC_OPTIONS` (constants/ui-constants.js) |
| `vDemo` | `renderDemographics` (views/demographics-view.js) |
| `curTrial` | `currentTrial` (viewmodels/study-flow.js) |
| `CH` | `CHOICE_LABELS` (constants/ui-constants.js) |
| `progressHtml` | `trialProgressHtml` (views/trial-view.js) |
| `trialChart` | `renderTrialChart` (widgets/trial-chart.js) |
| `chooseHtml` | `chooseHtml` (views/trial-view.js) |
| `coolHtml` | `cooldownHtml` (views/trial-view.js) |
| `outcomeHtml` | `outcomeHtml` (views/trial-view.js) |
| `stressHtml` | `stressHtml` (views/trial-view.js) |
| `quizHtml` | `quizHtml` (views/trial-view.js) |
| `vTask` | `renderTrial` (views/trial-view.js) |
| `FW` | `FILM_WIDTH` (widgets/film-widget.js) |
| `FH` | `FILM_HEIGHT` (widgets/film-widget.js) |
| `FP` | `FILM_PADDING` (widgets/film-widget.js) |
| `filmRAF` | `filmAnimationFrame` (widgets/film-widget.js) |
| `filmD` | `filmData` (widgets/film-widget.js) |
| `FCOL` | `FILM_COLORS` (widgets/film-widget.js) |
| `filmData` | `buildFilmData` (widgets/film-widget.js) |
| `filmHtml` | `filmHtml` (widgets/film-widget.js) |
| `filmFrame` | `drawFilmFrame` (widgets/film-widget.js) |
| `startFilm` | `startFilm` (widgets/film-widget.js) |
| `vStress` | `renderStress` (views/trial-view.js) |
| `vBridge` | `renderBridge` (views/bridge-view.js) |
| `simSpark` | `renderSparkline` (widgets/price-chart.js) |
| `simNavHtml` | `simulatorNavHtml` (views/simulator-view.js) |
| `vSim` | `renderSimulator` (views/simulator-view.js) |
| `allocHtml` | `allocationHtml` (views/simulator-view.js) |
| `detailChart` | `renderDetailChart` (widgets/price-chart.js) |
| `detailInfo` | `stockDetailInfoHtml` (views/simulator-view.js) |
| `stockNews` | `stockNewsHtml` (views/simulator-view.js) |
| `simDetailHtml` | `stockDetailHtml` (views/simulator-view.js) |
| `simMarketHtml` | `marketTabHtml` (views/simulator-view.js) |
| `newsList` | `newsListHtml` (views/simulator-view.js) |
| `mcardHtml` | `stockCardHtml` (views/simulator-view.js) |
| `simAnalysisHtml` | `analysisTabHtml` (views/simulator-view.js) |
| `newsIsNew` | `isNewsFresh` (views/simulator-view.js) |
| `newsHtml` | `newsHtml` (views/simulator-view.js) |
| `newsUnread` | `hasUnreadNews` (views/simulator-view.js) |
| `newsDot` | `updateNewsDot` (views/simulator-view.js) |
| `simAlert` | `updateCrisisAlert` (views/simulator-view.js) |
| `bnNews` | `freePlayBannerNews` (views/simulator-view.js) |
| `simBanner` | `updateNewsBanner` (views/simulator-view.js) |
| `simLive` | `updateSimulatorLive` (views/simulator-view.js) |
| `tradeCalc` | `calculateTrade` (views/simulator-view.js) |
| `tradeSummaryHtml` | `tradeSummaryHtml` (views/simulator-view.js) |
| `simTradeHtml` | `tradeWindowHtml` (views/simulator-view.js) |
| `updTrade` | `updateTradePreview` (views/simulator-view.js) |
| `simWhyHtml` | `sellReasonHtml` (views/simulator-view.js) |
| `simCoolHtml` | `simulatorCooldownHtml` (views/simulator-view.js) |
| `vEnd` | `renderEnd` (views/end-view.js) |
| `decCounts` | `decisionCounts` (views/end-view.js) |
| `cardHtml` | `summaryCardHtml` (views/end-view.js) |
| `simSeries` | `simulationSeries` (widgets/price-chart.js) |
| `simChartGeo` | `simulationChartGeometry` (widgets/price-chart.js) |
| `simChartSvg` | `simulationChartSvg` (widgets/price-chart.js) |
| `cardMake` | `createSummaryCard` (views/end-view.js) |
| `cardRR` | `roundedRectPath` (views/end-view.js) |
| `FB_Q` | `PILOT_FEEDBACK_QUESTIONS` (constants/ui-constants.js) |
| `pilotFbHtml` | `pilotFeedbackHtml` (views/end-view.js) |
| `vAdmin` | `renderAdmin` (admin/admin-view.js) |
| `trm` | `termButtonHtml` (views/menu-view.js) |
| `termHtml` | `termHtml` (views/menu-view.js) |
| `helpHtml` | `helpHtml` (views/menu-view.js) |
| `FS_LV` | `FONT_SIZE_LEVELS` (constants/ui-constants.js) |
| `fsLevel` | `fontSizeLevel` (views/menu-view.js) |
| `fsHtml` | `fontSizeHtml` (views/menu-view.js) |
| `menuHtml` | `menuHtml` (views/menu-view.js) |
| `simDayTxt` | `dayText` (views/simulator-view.js) |
| `freeHtml` | `freePlayHeaderHtml` (views/free-play-view.js) |
| `freeEntryHtml` | `freePlayEntryHtml` (views/free-play-view.js) |
| `freeRadio` | `radioGroupHtml` (views/free-play-view.js) |
| `freeSpeedHtml` | `freePlaySpeedHtml` (views/free-play-view.js) |
| `freeOrderHtml` | `freePlayOrderHtml` (views/free-play-view.js) |
| `freeSetText` | `freePlaySettingsText` (views/free-play-view.js) |
| `vFreeMenu` | `renderFreePlayMenu` (views/free-play-view.js) |
| `vFreeEnd` | `renderFreePlayEnd` (views/free-play-view.js) |
| `render` | `render` (views/app-shell.js) |
| `setTxt` | `setText` (utils/dom.js) |
| `header` | `updateHeader` (views/app-shell.js) |
| `GP_LABELS` | `PROGRESS_LABELS` (constants/ui-constants.js) |
| `GP_W` | `PROGRESS_WEIGHTS` (constants/ui-constants.js) |
| `gpState` | `progressState` (views/app-shell.js) |
| `progress` | `updateProgressBar` (views/app-shell.js) |
| `taskAt` | `startMainTrial` (viewmodels/study-flow.js) |
| `resumeFlow` | `resumeFlow` (viewmodels/study-flow.js) |
| `startTrial` | `startTrial` (viewmodels/study-flow.js) |
| `choose` | `chooseOption` (viewmodels/study-flow.js) |
| `finalize` | `finalizeChoice` (viewmodels/study-flow.js) |
| `nextAfterOutcome` | `advanceAfterOutcome` (viewmodels/study-flow.js) |
| `maybeTour` | `maybeStartTour` (viewmodels/tour-controller.js) |
| `startTour` | `startTour` (viewmodels/tour-controller.js) |
| `applyTour` | `renderTour` (viewmodels/tour-controller.js) |
| `endTour` | `endTour` (viewmodels/tour-controller.js) |
| `modalOpen` | `isModalOpen` (widgets/modal.js) |
| `marketTick` | `marketTick` (viewmodels/market-controller.js) |
| `freeOrders` | `executeFreePlayOrders` (viewmodels/market-controller.js) |
| `tabTick` | `trackTabTime` (viewmodels/market-controller.js) |
| `pracEnd` | `endPractice` (viewmodels/market-controller.js) |
| `freeFinish` | `finishFreePlay` (viewmodels/market-controller.js) |
| `simEnd` | `endSimulation` (viewmodels/market-controller.js) |
| `simRec` | `recordTrade` (viewmodels/market-controller.js) |
| `doSimSell` | `sellStock` (viewmodels/market-controller.js) |
| `doSimBuy` | `buyStock` (viewmodels/market-controller.js) |
| `taps` | `logoTaps` (viewmodels/actions/ui-actions.js) |
| `ACT` | `actions` (viewmodels/actions/index.js) |
| `saveFb` | `savePilotFeedback` (viewmodels/pilot-feedback.js) |
| `scrubT` | `scrubTimer` (viewmodels/market-controller.js) |
| `scrubG` | `scrubGesture` (viewmodels/market-controller.js) |
| `scrubAt` | `scrubChartAt` (viewmodels/market-controller.js) |
| `scrubEnd` | `endChartScrub` (viewmodels/market-controller.js) |
| `dashAutoTick` | `dashboardAutoRefresh` (admin/admin-dashboard.js) |
| `openModal` | `openModal` (widgets/modal.js) |
| `closeModal` | `closeModal` (widgets/modal.js) |
| `askConfirm` | `askConfirm` (widgets/modal.js) |
| `doWithdraw` | `withdrawParticipant` (viewmodels/session-lifecycle.js) |
| `storeReady` | `storeReady` (viewmodels/session-lifecycle.js) |

## Durum alanları (`S.x` → `state.y`)

| Eski | Yeni |
|---|---|
| `free` | `freePlay` |
| `prac` | `practice` |
| `order` | `setOrder` |
| `comp` | `comprehension` |
| `newsSeen` | `newsSeenDay` |
| `sim` | `simulation` |
| `syncErr` | `syncError` |
| `baseIn` | `baseUrlInput` |
| `code` | `participantCode` |
| `replay` | `isReplay` |
| `grp` | `group` |
| `ti` | `trialIndex` |
| `tab` | `tab` |
| `tabT` | `tabTimes` |
| `readMs` | `readingMs` |
| `tourSeen` | `seenTourSteps` |
| `helpN` | `helpOpenCount` |
| `guess` | `purposeGuess` |
| `dec` | `decisions` |
| `total` | `totalDecisions` |
| `pulses` | `pulses` |
| `practiced` | `practiceDone` |
| `cd` | `cooldownStats` |
| `simTab` | `marketTab` |
| `tabSince` | `tabActiveSince` |
| `busy` | `busy` |
| `codeErr` | `codeError` |
| `admin` | `adminRequested` |
| `codeIn` | `codeInput` |
| `pendingCode` | `pendingCode` |
| `welcome` | `welcomeBack` |
| `pre` | `preTest` |
| `preB3` | `preTestBigThree` |
| `post` | `postTest` |
| `manip` | `manipulationCheck` |
| `fb` | `pilotFeedback` |
| `waitUntil` | `waitUntil` |
| `waitSess` | `waitSession` |
| `consentAt` | `consentAt` |
| `consentOpen` | `consentOpenSections` |
| `consentDl` | `consentDownloaded` |
| `consentMs` | `consentMs` |
| `hasDemo` | `hasDemographics` |
| `dm` | `demographics` |
| `intro` | `introStep` |
| `filmP` | `filmProgress` |
| `dashBusy` | `dashboardBusy` |
| `dash` | `dashboard` |
| `dashAuto` | `dashboardAutoRefresh` |
| `landIn` | `landingUrlInput` |
| `posterMail` | `posterEmail` |
| `posterFoot` | `posterFooter` |
| `allocCache` | `allocationCache` |
| `adErr` | `adminError` |
| `wdCount` | `withdrawnCount` |
| `consentT0` | `consentStartedAt` |
| `consentChk` | `consentChecked` |
| `tq` | `testQuestion` |
| `movedCode` | `movedCode` |
| `demoUsed` | `demoCodeUsed` |
| `tr` | `trial` |
| `simDetail` | `detailSymbol` |
| `simRange` | `detailRangeDays` |
| `scrubDay` | `scrubDay` |
| `simTrade` | `tradeDraft` |
| `simCd` | `simulatorCooldown` |
| `debriefLogged` | `debriefLogged` |
| `cardUrl` | `summaryCardUrl` |
| `simSer` | `simulationSeriesCache` |
| `fbD` | `feedbackDraft` |
| `demoSpeed` | `demoSpeed` |
| `stressKey` | `stressKey` |
| `_k` | `renderKey` |
| `lastHiddenAt` | `lastHiddenAt` |
| `stressT0` | `stressStartedAt` |
| `cdt` | `cooldownTimer` |
| `simWhy` | `sellReasonDraft` |
| `selfRes` | `selfTestResults` |
| `attPass` | `attentionPassed` |
| `adminPrev` | `previousStage` |
| `readT0` | `readingStartedAt` |
| `_ok` | `confirmCallback` |
| `_focusBack` | `focusReturnElement` |

## Eylemler (`ACT.x` / `data-a` değeri)

| Eski | Yeni |
|---|---|
| `consent` | `acceptConsent` |
| `consentDl` | `downloadConsentText` |
| `welcomeGo` | `continueFromWelcome` |
| `notMe` | `rejectRememberedCode` |
| `code` | `submitCode` |
| `demoCode` | `useDemoCode` |
| `demoReset` | `resetDemoData` |
| `dm` | `setDemographic` |
| `demoDone` | `finishDemographics` |
| `testStart` | `startTest` |
| `tans` | `answerTest` |
| `introNext` | `nextIntroStep` |
| `introDone` | `finishIntro` |
| `startMain` | `startMainStudy` |
| `guess` | `submitPurposeGuess` |
| `guessSkip` | `skipPurposeGuess` |
| `choose` | `chooseDecision` |
| `next` | `nextTrial` |
| `stress` | `answerStress` |
| `fbPick` | `pickFeedbackAnswer` |
| `fbSend` | `sendFeedback` |
| `fbSkip` | `skipFeedback` |
| `manip` | `answerManipulationCheck` |
| `film` | `playFilm` |
| `quiz` | `answerQuiz` |
| `quizNext` | `nextQuiz` |
| `cardMake` | `downloadSummaryCard` |
| `pracStart` | `startPracticeSimulator` |
| `pracSkip` | `skipPracticeSimulator` |
| `simStart` | `startSimulation` |
| `simTab` | `switchMarketTab` |
| `simDetail` | `openStockDetail` |
| `simBack` | `closeStockDetail` |
| `simRange` | `setChartRange` |
| `postStart` | `startPostBlock` |
| `simOpen` | `openTradeWindow` |
| `simClose` | `closeTradeWindow` |
| `simSide` | `setTradeSide` |
| `simQty` | `setTradeQuantity` |
| `simGo` | `submitTrade` |
| `simWhyBack` | `cancelSellReason` |
| `simWhy` | `chooseSellReason` |
| `simSellGo` | `confirmSell` |
| `simCdBack` | `cancelCooldown` |
| `simCdGo` | `confirmAfterCooldown` |
| `freeOpen` | `openFreePlay` |
| `freeLvl` | `selectFreePlayLevel` |
| `freeLim` | `selectFreePlayLimit` |
| `freeSc` | `selectFreePlayScenario` |
| `freePf` | `selectFreePlayPortfolio` |
| `bnClose` | `closeNewsBanner` |
| `freeSpeed` | `setFreePlaySpeed` |
| `freeOrder` | `setFreePlayOrder` |
| `freeMenu` | `showFreePlayMenu` |
| `freeStart` | `startFreePlay` |
| `freeQuit` | `quitFreePlay` |
| `freeEnd` | `endFreePlay` |
| `freeBack` | `leaveFreePlay` |
| `tourNext` | `nextTourStep` |
| `tourSkip` | `skipTour` |
| `term` | `openTerm` |
| `help` | `openHelp` |
| `menu` | `openMenu` |
| `withdraw` | `requestWithdraw` |
| `moveDev` | `moveDevice` |
| `moveBack` | `cancelMoveDevice` |
| `mOk` | `confirmModal` |
| `mCancel` | `cancelModal` |
| `fs` | `setFontSize` |
| `theme` | `toggleTheme` |
| `logo` | `tapLogo` |
| `adminClose` | `closeAdmin` |
| `adDemo` | `startDemo` |
| `demoExit` | `exitDemo` |
| `demoSpeed` | `setDemoSpeed` |
| `demoCrisis` | `skipToNextCrisis` |
| `demoStart` | `startDemoSimulation` |
| `adDash` | `refreshDashboard` |
| `adPoster` | `downloadPoster` |
| `adPosterQR` | `downloadPosterQr` |
| `adLogin` | `adminLogin` |
| `adLogout` | `adminLogout` |
| `adLoadAlloc` | `loadAllocations` |
| `adGen` | `generateAllocations` |
| `_gen` | `generateAllocationsConfirmed` |
| `adCards` | `downloadCards` |
| `adExpAlloc` | `downloadAllocations` |
| `adExpP` | `downloadParticipants` |
| `adExpE` | `downloadEvents` |
| `adReset` | `resetLocalData` |
| `adWd` | `countWithdrawn` |
| `adSelf` | `runSelfTest` |
| `adSelfCopy` | `copySelfTest` |
| `adQuick` | `toggleQuickMode` |

## DOM kimlikleri (id)

| Eski | Yeni |
|---|---|
| `ae` | `admin-email` |
| `ap` | `admin-password` |
| `an` | `allocation-count` |
| `abu` | `poster-base-url` |
| `cbtn` | `consent-button` |
| `ci` | `code-input` |
| `cerr` | `code-error` |
| `tc` | `tour-chart` |
| `tpos` | `tour-position` |
| `tnews` | `tour-news` |
| `tcrowd` | `tour-crowd` |
| `tch` | `tour-choices` |
| `cdn` | `cooldown-number` |
| `cdg` | `cooldown-confirm` |
| `fclip` | `film-clip` |
| `fcr` | `film-clip-rect` |
| `fph` | `film-playhead` |
| `fcap` | `film-caption` |
| `salert` | `crisis-alert` |
| `sbanner` | `news-banner` |
| `sana` | `analysis-panel` |
| `shero` | `portfolio-hero` |
| `sv` | `portfolio-value` |
| `sch` | `portfolio-change` |
| `sinv` | `invested-value` |
| `scash` | `cash-value` |
| `sday` | `day-counter` |
| `sfree` | `free-play-panel` |
| `salloc` | `allocation-section` |
| `sallocb` | `allocation-bars` |
| `snews` | `news-section` |
| `slist` | `stock-list` |
| `scrublb` | `scrub-label` |
| `dinfo` | `detail-info` |
| `dchart` | `detail-chart` |
| `dord` | `order-section` |
| `dnews` | `detail-news` |
| `mnews` | `market-news` |
| `mgrid` | `market-grid` |
| `mc-` | `market-card-` |
| `simq` | `trade-quantity` |
| `tsum` | `trade-summary` |
| `tgo` | `trade-submit` |
| `gq` | `purpose-guess` |
| `fsl` | `font-size-label` |
| `fspl` | `speed-label` |
| `mtitle` | `modal-title` |
| `toast` | `toast` |
| `sdot` | `sync-dot` |
| `view` | `main-view` |
| `disc` | `disclaimer` |
| `nav` | `simulator-nav` |
| `qb` | `quick-test-banner` |
| `db` | `mode-banner` |
| `tm` | `timer-chip` |
| `tmt` | `timer-text` |
| `mn` | `menu-button` |
| `hp` | `help-button` |
| `app` | `app` |
| `gp` | `study-progress` |
| `tour` | `tour-popup` |
| `modal` | `modal` |
| `mbox` | `modal-box` |
| `bk` | `back-button` |

## CSS sınıfları

| Eski | Yeni |
|---|---|
| `up` | `price-up` |
| `dn` | `price-down` |
| `mu` | `muted` |
| `sm` | `small-text` |
| `num` | `tabular-number` |
| `hr` | `header-actions` |
| `score` | `timer-chip` |
| `icon` | `icon-button` |
| `on` | `is-active` |
| `nw` | `has-news` |
| `show` | `is-visible` |
| `top` | `is-top` |
| `lbl` | `hero-label` |
| `val` | `hero-value` |
| `hsub` | `hero-sub` |
| `seg` | `segmented-control` |
| `sec` | `card-section` |
| `sh` | `card-header` |
| `sb` | `card-body` |
| `row` | `list-row` |
| `list` | `row-list` |
| `av` | `nav-available` |
| `rm` | `row-main` |
| `s` | `row-title` |
| `n` | `row-subtitle` |
| `rr` | `row-right` |
| `rp` | `row-primary` |
| `rc` | `row-secondary` |
| `rs` | `row-side` |
| `chev` | `chevron` |
| `t-up` | `tag-up` |
| `t-dn` | `tag-down` |
| `t-h` | `tag-hold` |
| `btn` | `button` |
| `pri` | `is-primary` |
| `danger` | `is-danger` |
| `ghost-dn` | `ghost-danger` |
| `chips` | `chip-list` |
| `info` | `is-info` |
| `foot` | `footnote` |
| `met` | `metric` |
| `mh` | `metric-header` |
| `stack` | `stack-bar` |
| `flim` | `free-play-limit` |
| `kv` | `key-value` |
| `kvs` | `key-value-list` |
| `fbar` | `loss-bar` |
| `hot` | `is-hot` |
| `flvs` | `level-list` |
| `flv` | `level-option` |
| `stats` | `stat-row` |
| `stat` | `stat` |
| `open` | `is-open` |
| `grab` | `sheet-grabber` |
| `shh` | `sheet-header` |
| `t` | `sheet-title` |
| `sp` | `span-item` |
| `lab` | `field-label` |
| `more` | `more-details` |
| `q` | `question` |
| `q2` | `question-spaced` |
| `big-sum` | `big-summary` |
| `count` | `countdown` |
| `act` | `stage-actions` |
| `opt` | `option` |
| `ok` | `is-correct` |
| `no` | `is-wrong` |
| `giant` | `giant-number` |
| `wrapc` | `summary-card` |
| `k` | `card-value` |
| `l` | `card-label` |
| `gauge-t` | `gauge-text` |
| `json` | `json-block` |
| `scale` | `scale` |
| `scale-l` | `scale-labels` |
| `steps` | `steps` |
| `pend` | `is-pending` |
| `err` | `is-error` |
| `gl-up` | `glow-up` |
| `gl-dn` | `glow-down` |
| `gl-strong` | `glow-strong` |
| `dir` | `direction-badge` |
| `ar` | `arrow` |
| `fl` | `flash` |
| `ft` | `film-title` |
| `cap` | `film-caption` |
| `lg` | `film-legend` |
| `mk` | `film-marker` |
| `off` | `is-off` |
| `crisis` | `is-crisis` |
| `kpis` | `kpi-grid` |
| `flag` | `flag-row` |
| `shake` | `is-shaking` |
| `choices` | `choice-list` |
| `tt` | `tour-text` |
| `tb` | `tour-footer` |
| `tn` | `tour-count` |
| `ts` | `tour-skip` |
| `hl` | `highlight` |
| `touring` | `is-touring` |
| `qcard` | `question-card` |
| `okmsg` | `success-message` |
| `gl` | `glossary-list` |
| `nm` | `news-meta` |
| `nl` | `news-label` |
| `nb` | `news-badge` |
| `nt` | `news-title` |
| `nall` | `news-all` |
| `nd` | `news-day` |
| `neg` | `is-negative` |
| `fresh` | `is-fresh` |
| `mgrid` | `market-grid` |
| `mcard` | `market-card` |
| `salert` | `crisis-alert-box` |
| `sbn` | `news-banner-box` |
| `sbt` | `news-banner-button` |
| `sbl` | `news-banner-label` |
| `sbx` | `news-banner-text` |
| `sbc` | `news-banner-close` |
| `srow` | `stock-row` |
| `rnw` | `news-flag` |
| `ifacts` | `info-facts` |
| `how` | `how-list` |
| `itabs` | `info-tabs` |
| `rd` | `rounded-box` |
| `shint` | `sheet-hint` |
| `r1` | `stock-row-top` |
| `t1` | `stock-symbol` |
| `plb` | `profit-loss-block` |
| `pc` | `percent-chip` |
| `eq` | `equation` |
| `eqc` | `equation-cell` |
| `tot` | `is-total` |
| `op` | `operator` |
| `avgl` | `average-line` |
| `cells` | `cell-grid` |
| `c3` | `three-columns` |
| `cell` | `cell` |
| `term` | `term-button` |
| `pos` | `position-box` |
| `ph` | `position-title` |
| `unit` | `unit-text` |
| `fx` | `fx-note` |
| `alloc` | `allocation-bar` |
| `alegend` | `allocation-legend` |
| `dhead` | `detail-header` |
| `rng` | `range-selector` |
| `dact` | `detail-actions` |
| `hist` | `history-list` |
| `tside` | `trade-side` |
| `qlab` | `quantity-label` |
| `qrow` | `quantity-row` |
| `qb` | `quantity-button` |
| `qchips` | `quantity-chips` |
| `tsum` | `trade-summary-box` |
| `gs` | `progress-steps` |
| `gb` | `progress-track` |
| `cur` | `is-current` |
| `done` | `is-done` |
| `csum` | `consent-summary` |
| `cdet` | `consent-details` |
| `cchk` | `consent-check` |
| `todo` | `placeholder-highlight` |
| `fsel` | `font-size-selector` |
| `fsl` | `selector-label` |
| `fsz` | `font-size-section` |
| `wrap` | `is-wrapped` |
| `enter` | `is-entering` |

## Kaldırılanlar

- Kodla giriş (kod ekranı, `#k=` bağlantısı, kart/QR dağıtımı, cihaz taşıma): yerine anonim giriş + sıralı yuva.
- Tanıtım modu (`?demo=1`), hızlı test modu (`?hizli=1`), pilot adres parametresi (`?pilot=1`), `?oturum=`, yerel (localStorage) kayıt kipi ve örnek kodlar.
- Yönetim paneli katılımcı uygulamasından çıkarıldı: `public/admin/`.
