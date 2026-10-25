// Üst düzey bildirimlerin eski ad -> yeni ad ve hedef modül tablosu.
// Biçim: 'eskiAd | yeniAd | modül'. Modül kimlikleri MODULES içinde tanımlıdır.
// ExpressionStatement'lar sıra numarasıyla (#N, exprs.mjs çıktısındaki numara) belirtilir: '#4 | - | modül'.

export const MODULES = {
  // ── constants ──
  'app-config': ['constants/app-config.js', 'Uygulama sürümü, çalışma ayarları (CONFIG) ve çalışma kipi bayrakları. Tüm modüller buradan okur; pilot başladıktan sonra ölçüt ayarları DEĞİŞTİRİLMEZ.'],
  'test-questions': ['constants/test-questions.js', 'Ön test ve son test soruları (Big Three + araştırmacı maddeleri) ile dikkat sorusu.'],
  'stimulus-content': ['constants/stimulus-content.js', 'Karar anı uyaranlarının sabit içeriği: sektörler, haber başlıkları, hisse sembolleri.'],
  'tour-steps': ['constants/tour-steps.js', 'Rehberli tur adımları (karar görevi ve simülatör).'],
  'comprehension-questions': ['constants/comprehension-questions.js', 'Anlama kontrolü soru havuzları (üç havuz, her biri altı soru).'],
  'glossary': ['constants/glossary.js', 'Sözlük, okuma kartları ve satış gerekçesi seçenekleri.'],
  'market-data': ['constants/market-data.js', 'Piyasa simülatörünün sabit verileri: hisse tabanı, haber takvimi, hisse renkleri.'],
  'free-play-data': ['constants/free-play-data.js', 'Serbest mod seviyeleri, senaryoları, portföyleri ve haber havuzları.'],
  'ui-constants': ['constants/ui-constants.js', 'Arayüz sabitleri: etiketler, seçenekler, ilerleme ağırlıkları, geri bildirim soruları.'],
  // ── utils ──
  'random': ['utils/random.js', 'Tohumlu rastgele sayı üreticileri. Herkes aynı uyaranı görsün diye tüm rastgelelik tohumludur.'],
  'format': ['utils/format.js', 'Sayı, para, yüzde ve süre biçimlendirme; HTML kaçışlama.'],
  'dom': ['utils/dom.js', 'Küçük DOM yardımcıları.'],
  'participant-code': ['utils/participant-code.js', 'Katılım kodu üretimi, doğrulama ve biçimlendirme; randomizasyon listesi üretimi.'],
  // ── models ──
  'trial-generator': ['models/trial-generator.js', 'Karar anı uyaranlarının üretimi (X/Y setleri, alıştırma), fiyat yolu ve uyaran parmak izi.'],
  'market-simulation': ['models/market-simulation.js', 'Piyasa simülatörü motoru: fiyat adımı, krizler, haberler, portföy değeri.'],
  'free-play-model': ['models/free-play-model.js', 'Serbest mod: olay/haber takvimi üretimi, portföy kurulumu, kayıp sınırı hesapları.'],
  'comprehension': ['models/comprehension.js', 'Anlama kontrolü soru seçimi.'],
  // ── viewmodels ──
  'app-state': ['viewmodels/app-state.js', 'Uygulamanın tek durum nesnesi (ViewModel durumu).'],
  'study-flow': ['viewmodels/study-flow.js', 'Çalışma akışı: karar anı başlatma, seçim, sonuç, kaldığı yerden devam.'],
  'market-controller': ['viewmodels/market-controller.js', 'Simülatör denetleyicisi: piyasa adımı, alım/satım, bitiş, grafik gezinme.'],
  'tour-controller': ['viewmodels/tour-controller.js', 'Rehberli tur denetleyicisi.'],
  'session-lifecycle': ['viewmodels/session-lifecycle.js', 'Oturumun açılışı, kod girişi ve bitişi.'],
  'pilot-feedback': ['viewmodels/pilot-feedback.js', 'Pilot geri bildirim formunun kaydı.'],
  // ── services ──
  'participant-repository': ['repositories/participant-repository.js', 'Veri katmanı: yerel/Firebase kayıt, randomizasyon listesi, olay yazma, araştırmacı girişi.'],
  'event-log': ['services/event-log.js', 'Olay kaydı kuyruğu, gönderim ve eşzamanlama durumu.'],
  'error-capture': ['services/error-capture.js', 'İstemci hatalarını yakalayıp olay olarak kaydetme.'],
  'session-persistence': ['services/session-persistence.js', 'Oturum anlık görüntüsü: kaydet, geri yükle, özetle.'],
  // ── widgets ──
  'toast': ['widgets/toast.js', 'Kısa süreli bildirim kutusu.'],
  'modal': ['widgets/modal.js', 'Pencere (modal) açma/kapama ve onay penceresi.'],
  'section': ['widgets/section.js', 'Bölüm kutusu ve ilerleme çubuğu bileşenleri.'],
  'trial-chart': ['widgets/trial-chart.js', 'Karar anı fiyat grafiği.'],
  'price-chart': ['widgets/price-chart.js', 'Simülatör grafikleri: mini grafik, hisse detay grafiği, portföy seyri.'],
  'film-widget': ['widgets/film-widget.js', 'Bilgilendirme ekranındaki karar filmi.'],
  'qr-code': ['widgets/qr-code.js', 'QR kodu SVG üretimi.'],
  'qr-lib': ['vendor/qr-lib.js', 'QR kod kütüphanesi (Kazuhiko Arase, MIT lisansı). Yeniden yazılmadı.'],
  'sync-indicator': ['widgets/sync-indicator.js', 'Başlıktaki eşzamanlama göstergesi.'],
  // ── views ──
  'app-shell': ['views/app-shell.js', 'Uygulama kabuğu: ekran çizimi, başlık, ilerleme çubuğu.'],
  'consent-view': ['views/consent-view.js', 'Katmanlı onam ekranı ve onam metni.'],
  'stage-view': ['views/stage-view.js', 'Ekran yönlendirici (aşamaya göre doğru görünümü seçer).'],
  'demographics-view': ['views/demographics-view.js', 'Form (demografi) ekranı.'],
  'demo-view': ['views/demo-view.js', 'Tanıtım modu ekranları.'],
  'trial-view': ['views/trial-view.js', 'Karar anı ekranları: seçim, bekleme, sonuç, gerginlik, anlama kontrolü.'],
  'bridge-view': ['views/bridge-view.js', 'Bölümler arası bilgi ekranları.'],
  'simulator-view': ['views/simulator-view.js', 'Piyasa simülatörü ekranları: portföy, piyasa, analiz, hisse detayı, işlem penceresi.'],
  'end-view': ['views/end-view.js', 'Bitiş ve bilgilendirme ekranı, karar kartı.'],
  'free-play-view': ['views/free-play-view.js', 'Serbest mod ekranları.'],
  'menu-view': ['views/menu-view.js', 'Menü, sözlük, yardım ve yazı boyutu görünümleri.'],
  'admin-view': ['admin/admin-view.js', 'Yönetim paneli görünümleri.'],
  'admin-exports': ['admin/admin-exports.js', 'Yönetim paneli: CSV dışa aktarma, kartlar ve afiş.'],
  'admin-dashboard': ['admin/admin-dashboard.js', 'Yönetim paneli: canlı pano.'],
  'admin-actions': ['admin/admin-actions.js', 'Yönetim paneli eylemleri.'],
  'actions-flow': ['viewmodels/actions/flow-actions.js', 'Eylemler: onam, form, testler, giriş akışı.'],
  'actions-market': ['viewmodels/actions/market-actions.js', 'Eylemler: simülatör ve işlem.'],
  'actions-free-play': ['viewmodels/actions/free-play-actions.js', 'Eylemler: serbest mod.'],
  'actions-ui': ['viewmodels/actions/ui-actions.js', 'Eylemler: menü, tema, yazı boyutu, pencereler, çekilme.'],
  'actions-index': ['viewmodels/actions/index.js', 'Tüm eylem gruplarını tek nesnede birleştirir ve tıklama olaylarını eylemlere yönlendirir.'],
  'event-bindings': ['viewmodels/event-bindings.js', 'Belge düzeyi olay dinleyicileri ve zamanlayıcılar.'],
  'main': ['main.js', 'Uygulamanın giriş noktası: dinleyicileri bağlar, ilk çizimi yapar.'],
};

// Boşluklar ve satır sonları serbest; her satır 'eskiAd | yeniAd | modül'
export const TOP = `
# 02_core.js
APP_VERSION | APP_VERSION | app-config
QS | QUERY_PARAMS | app-config
HASH | HASH_PARAMS | app-config
CFG | CONFIG | app-config
QUICK | QUICK_TEST_MODE | app-config
#2 | - | app-config
DEMO | DEMO_MODE | app-config
PILOT | PILOT_MODE | app-config
FORCED_SESSION | FORCED_SESSION | app-config
#3 | - | app-config
CONSENT_VER | CONSENT_VERSION | app-config
simLim | simulationTickLimit | market-simulation
simMin | simulationMinutesText | market-simulation
tickSecText | tickSecondsText | market-simulation
seedOf | hashSeed | random
_rs | mainRngState | random
rnd | random | random
rr | randomBetween | random
shuffle | shuffleArray | random
$ | byId | dom
fmt | formatNumber | format
r2 | round2 | format
sgn | signPrefix | format
cls | directionClass | format
chg | formatPercentChange | format
tl | formatLira | format
esc | escapeHtml | format
mmss | formatMinutesSeconds | format
TQ | TEST_QUESTIONS | test-questions
ATT | ATTENTION_QUESTION | test-questions
tqSeq | testQuestionSequence | test-questions
SECTORS | SECTORS | stimulus-content
NEWS_CRISIS | CRISIS_HEADLINES | stimulus-content
NEWS_NORMAL | NORMAL_HEADLINES | stimulus-content
TASKNAMES | TASK_STOCKS | stimulus-content
makePath | makePricePath | trial-generator
PAIR | PAIR_PARAMS | trial-generator
buildSet | buildTrialSet | trial-generator
TRS | TRIAL_SETS | trial-generator
BT | currentBlockTrials | trial-generator
buildPractice | buildPracticeTrials | trial-generator
PR | PRACTICE_TRIALS | trial-generator
fingerprint | stimulusFingerprint | trial-generator
weekCh | lastWeekChangePercent | trial-generator
S | state | app-state
TOUR_TASK | TASK_TOUR_STEPS | tour-steps
TOUR_SIM | SIMULATOR_TOUR_STEPS | tour-steps
COMP | COMPREHENSION_POOLS | comprehension-questions
compNew | newComprehensionSelection | comprehension
compQ | comprehensionQuestionAt | comprehension
READING | READING_CARDS | glossary
SELL_WHY | SELL_REASONS | glossary
GLOSSARY | GLOSSARY | glossary
SIMBASE | STOCK_BASES | market-data
_r2 | marketRngState | random
rnd2 | marketRandom | random
simInit | initSimulation | market-simulation
simCrises | activeCrises | market-simulation
simCrisis | crisisAt | market-simulation
simStockCrisis | stockCrisisAt | market-simulation
SIMNEWS | SIMULATOR_NEWS | market-data
SIMCOL | STOCK_COLORS | market-data
simNewsList | newsItems | market-simulation
simNewsAt | latestNewsAt | market-simulation
simStep | stepSimulation | market-simulation
FREE_LV | FREE_PLAY_LEVELS | free-play-data
FREE_SEC | FREE_PLAY_SECTORS | free-play-data
FREE_N | FREE_PLAY_NEWS | free-play-data
FREE_NEU | FREE_PLAY_NEUTRAL_NEWS | free-play-data
FREE_SC | FREE_PLAY_SCENARIOS | free-play-data
FREE_PF | FREE_PLAY_PORTFOLIOS | free-play-data
FREE_LIMS | FREE_PLAY_LOSS_LIMITS | free-play-data
freePick | pickRandomItem | free-play-model
freePortfolio | applyFreePlayPortfolio | free-play-model
freeInit | initFreePlay | free-play-model
freePlan | planFreePlayEvents | free-play-model
freeLimit | freePlayLossFloor | free-play-model
freeLim | freePlayLossLimit | free-play-model
freeLimitF | freePlayLossFloorFor | free-play-model
simValue | portfolioValue | market-simulation
simBase | findStockBase | market-simulation
simCo | stockCompanyName | market-simulation
simName | stockFullName | market-simulation
toastT | toastTimer | toast
note | showToast | toast
# 03_qr.js
QRLib | QRLib | qr-lib
qrSvg | renderQrSvg | qr-code
# 04_study.js
Store | participantRepository | participant-repository
ALPHA | CODE_ALPHABET | participant-code
CODE_RE | CODE_PATTERN | participant-code
cryptoInt | secureRandomInt | participant-code
newCode | generateCode | participant-code
normCode | normalizeCode | participant-code
fmtCodeInput | formatCodeInput | participant-code
makeAlloc | buildAllocationList | participant-code
linkFor | participantLinkFor | participant-code
remember | rememberCode | participant-code
remembered | rememberedCode | participant-code
maskCode | maskCode | participant-code
EVQ | eventQueue | event-log
evN | eventCounter | event-log
flushing | flushInProgress | event-log
log | logEvent | event-log
ERRS_SEEN | SEEN_ERRORS | error-capture
errCount | errorCount | error-capture
preErr | pendingErrors | error-capture
captureErr | captureError | error-capture
#4 | - | error-capture
#5 | - | error-capture
syncState | syncStatus | event-log
updDot | updateSyncIndicator | sync-indicator
#6 | - | event-log
#7 | - | event-log
saveQueue | persistEventQueue | event-log
flush | flushEvents | event-log
snapshot | createSnapshot | session-persistence
saveSnap | saveSnapshot | session-persistence
restore | restoreSnapshot | session-persistence
nextSession | findNextSession | session-persistence
gapLeftMs | gapLeftMs | session-persistence
codeFail | showCodeError | session-lifecycle
boot | bootstrap | session-lifecycle
enterCode | enterCode | session-lifecycle
endSession | endSession | session-lifecycle
csvCell | csvCell | admin-exports
toCsv | toCsv | admin-exports
saveFile | saveFile | admin-exports
summarizeSnap | summarizeSnapshot | session-persistence
exportParticipants | exportParticipants | admin-exports
exportEvents | exportEvents | admin-exports
byNo | sortedByNumber | admin-exports
exportAlloc | exportAllocations | admin-exports
exportCards | exportCards | admin-exports
stageText | stageDescription | admin-dashboard
loadDash | loadDashboard | admin-dashboard
ringSvg | renderProgressRing | admin-dashboard
dashHtml | renderDashboard | admin-dashboard
exportPoster | exportPoster | admin-exports
adminHtml | renderAdminPanel | admin-view
ADMIN_ACT | ADMIN_ACTIONS | admin-actions
# 05_entry.js
sec | section | section
bar | progressBar | section
cfld | consentField | consent-view
consentSections | consentSections | consent-view
consentText | consentText | consent-view
vConsent | renderConsent | consent-view
vStage | renderStage | stage-view
vDemoLand | renderDemoLanding | demo-view
vDemoEnd | renderDemoEnd | demo-view
demoHint | demoHintHtml | demo-view
DM | DEMOGRAPHIC_OPTIONS | ui-constants
vDemo | renderDemographics | demographics-view
# 06_task.js
curTrial | currentTrial | study-flow
CH | CHOICE_LABELS | ui-constants
progressHtml | trialProgressHtml | trial-view
trialChart | renderTrialChart | trial-chart
chooseHtml | chooseHtml | trial-view
coolHtml | cooldownHtml | trial-view
outcomeHtml | outcomeHtml | trial-view
stressHtml | stressHtml | trial-view
quizHtml | quizHtml | trial-view
vTask | renderTrial | trial-view
FW | FILM_WIDTH | film-widget
FH | FILM_HEIGHT | film-widget
FP | FILM_PADDING | film-widget
filmRAF | filmAnimationFrame | film-widget
filmD | filmData | film-widget
FCOL | FILM_COLORS | film-widget
filmData | buildFilmData | film-widget
filmHtml | filmHtml | film-widget
filmFrame | drawFilmFrame | film-widget
startFilm | startFilm | film-widget
vStress | renderStress | trial-view
vBridge | renderBridge | bridge-view
simSpark | renderSparkline | price-chart
simNavHtml | simulatorNavHtml | simulator-view
vSim | renderSimulator | simulator-view
allocHtml | allocationHtml | simulator-view
detailChart | renderDetailChart | price-chart
detailInfo | stockDetailInfoHtml | simulator-view
stockNews | stockNewsHtml | simulator-view
simDetailHtml | stockDetailHtml | simulator-view
simMarketHtml | marketTabHtml | simulator-view
newsList | newsListHtml | simulator-view
mcardHtml | stockCardHtml | simulator-view
simAnalysisHtml | analysisTabHtml | simulator-view
newsIsNew | isNewsFresh | simulator-view
newsHtml | newsHtml | simulator-view
newsUnread | hasUnreadNews | simulator-view
newsDot | updateNewsDot | simulator-view
simAlert | updateCrisisAlert | simulator-view
bnNews | freePlayBannerNews | simulator-view
simBanner | updateNewsBanner | simulator-view
simLive | updateSimulatorLive | simulator-view
tradeCalc | calculateTrade | simulator-view
tradeSummaryHtml | tradeSummaryHtml | simulator-view
simTradeHtml | tradeWindowHtml | simulator-view
updTrade | updateTradePreview | simulator-view
simWhyHtml | sellReasonHtml | simulator-view
simCoolHtml | simulatorCooldownHtml | simulator-view
vEnd | renderEnd | end-view
decCounts | decisionCounts | end-view
cardHtml | summaryCardHtml | end-view
simSeries | simulationSeries | price-chart
simChartGeo | simulationChartGeometry | price-chart
simChartSvg | simulationChartSvg | price-chart
cardMake | createSummaryCard | end-view
cardRR | roundedRectPath | end-view
FB_Q | PILOT_FEEDBACK_QUESTIONS | ui-constants
pilotFbHtml | pilotFeedbackHtml | end-view
vAdmin | renderAdmin | admin-view
trm | termButtonHtml | menu-view
termHtml | termHtml | menu-view
helpHtml | helpHtml | menu-view
FS_LV | FONT_SIZE_LEVELS | ui-constants
fsLevel | fontSizeLevel | menu-view
fsHtml | fontSizeHtml | menu-view
menuHtml | menuHtml | menu-view
simDayTxt | dayText | simulator-view
freeHtml | freePlayHeaderHtml | free-play-view
freeEntryHtml | freePlayEntryHtml | free-play-view
freeRadio | radioGroupHtml | free-play-view
freeSpeedHtml | freePlaySpeedHtml | free-play-view
freeOrderHtml | freePlayOrderHtml | free-play-view
freeSetText | freePlaySettingsText | free-play-view
vFreeMenu | renderFreePlayMenu | free-play-view
vFreeEnd | renderFreePlayEnd | free-play-view
# 07_app.js
render | render | app-shell
setTxt | setText | dom
header | updateHeader | app-shell
GP_LABELS | PROGRESS_LABELS | ui-constants
GP_W | PROGRESS_WEIGHTS | ui-constants
gpState | progressState | app-shell
progress | updateProgressBar | app-shell
taskAt | startMainTrial | study-flow
resumeFlow | resumeFlow | study-flow
startTrial | startTrial | study-flow
choose | chooseOption | study-flow
finalize | finalizeChoice | study-flow
nextAfterOutcome | advanceAfterOutcome | study-flow
maybeTour | maybeStartTour | tour-controller
startTour | startTour | tour-controller
applyTour | renderTour | tour-controller
endTour | endTour | tour-controller
modalOpen | isModalOpen | modal
marketTick | marketTick | market-controller
#8 | - | event-bindings
freeOrders | executeFreePlayOrders | market-controller
tabTick | trackTabTime | market-controller
pracEnd | endPractice | market-controller
freeFinish | finishFreePlay | market-controller
simEnd | endSimulation | market-controller
simRec | recordTrade | market-controller
doSimSell | sellStock | market-controller
doSimBuy | buyStock | market-controller
taps | logoTaps | actions-ui
ACT | actions | actions-index
#9 | - | actions-index
saveFb | savePilotFeedback | pilot-feedback
scrubT | scrubTimer | market-controller
scrubG | scrubGesture | market-controller
scrubAt | scrubChartAt | market-controller
scrubEnd | endChartScrub | market-controller
#10 | - | event-bindings
#11 | - | event-bindings
#12 | - | event-bindings
#13 | - | event-bindings
#14 | - | event-bindings
#15 | - | event-bindings
#16 | - | event-bindings
#17 | - | event-bindings
#18 | - | event-bindings
#19 | - | event-bindings
#20 | - | event-bindings
#21 | - | event-bindings
#22 | - | event-bindings
#23 | - | event-bindings
dashAutoTick | dashboardAutoRefresh | admin-dashboard
#24 | - | event-bindings
#25 | - | event-bindings
openModal | openModal | modal
closeModal | closeModal | modal
askConfirm | askConfirm | modal
doWithdraw | withdrawParticipant | session-lifecycle
storeReady | storeReady | session-lifecycle
#26 | - | main
#27 | - | main
`;
