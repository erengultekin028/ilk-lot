// Katmanlı onam ekranı ve onam metni.

import { CONFIG, CONSENT_VERSION } from '../constants/app-config.js';
import { state } from '../viewmodels/app-state.js';
import { escapeHtml } from '../utils/format.js';
import { simulationMinutesText } from '../models/market-simulation.js';
import { fontSizeHtml } from './menu-view.js';

import { TRIAL_SETS } from '../models/trial-generator.js';

// ───────────────── Katmanlı onam ─────────────────
// Üstte 3 satırlık özet; altta açılır ayrıntılar; indirilebilir metin; onay kutusu. Hipotez ve müdahale burada AÇIKLANMAZ
// (bunun yerine "bazı ayrıntılar çalışmanın sonunda açıklanacak" denir ve bilgilendirmede tam açıklama yapılır).
export function consentField(key, plain) {
  const value = key === 'contact' ? CONFIG.contact : CONFIG.consentInfo[key];
  const unfilled = /^\[DOLDUR|ornek\.edu\.tr/.test(value || '');
  return plain
    ? value
    : unfilled
      ? '<span class="placeholder-highlight">' + escapeHtml(value) + '</span>'
      : escapeHtml(value);
}

// Yazı boyutu seçici (onam ekranı, kod ekranı ve menüde). Tercih bu cihazda saklanır; kayda yalnızca seçim olayı yazılır
function consentSections(plain) {
  const handler = function (key) {
    return consentField(key, plain);
  };
  const nextDay = TRIAL_SETS.X.length + TRIAL_SETS.Y.length;
  const innerSimulationMinutesText = simulationMinutesText();
  return [
    [
      'amac',
      'Araştırmanın amacı',
      [
        'Bu çalışma, üniversite öğrencilerinin yatırım kararlarını, piyasada sert düşüş gibi baskılı durumlarda nasıl verdiğini inceliyor. Bulgular, gençlere yönelik finansal okuryazarlık eğitimlerinin geliştirilmesine katkı sağlamayı amaçlıyor.',
        'Araştırmanın bazı ayrıntıları, davranışını etkileyebileceği için çalışmanın sonunda açıklanacak. O noktada tam bilgi verilecek ve istersen verilerinin kullanılmasını reddedebileceksin.',
      ],
    ],
    [
      'yapacak',
      'Ne yapacaksın?',
      [
        'Kısa bir form (isteğe bağlı), iki kısa test, iki alıştırma, toplam ' +
          nextDay +
          ' kısa karar ve ' +
          innerSimulationMinutesText +
          ' dakikalık bir piyasa simülatörü (öncesinde 30 saniyelik bir alıştırma). Toplam yaklaşık 30 dakika sürer.',
        'Hiçbir aşamada gerçek para kullanılmaz. Hisse adları gerçek BIST şirketlerine ait olabilir; ama fiyatlar, grafikler ve haberler tamamen kurgusaldır ve bu şirketlerin gerçek durumunu yansıtmaz.',
      ],
    ],
    [
      'kayit',
      'Neler kaydedilir?',
      [
        'Verdiğin kararlar ve bunları verme süren, simülatördeki işlemlerin, test ve anket cevapların, uygulamada hangi ekranlarda ne kadar kaldığın, cihaz türü ve ekran boyutu gibi teknik bilgiler.',
        'Adın, e-postan, telefon numaran, öğrenci numaran, konumun, sesin ve görüntün kaydedilmez. Form sorularının hepsi isteğe bağlıdır; yaş sorusu sadece katılım koşulunu (18 yaş ve üzeri) denetlemek içindir.',
        'Uygulamayı barındıran hizmetin teknik kayıtlarında IP adresin gibi bilgiler tutulabilir; bunlar araştırma verisiyle eşleştirilmez.',
      ],
    ],
    [
      'gizlilik',
      'Gizlilik ve KVKK',
      [
        'Verilerin yalnızca sana verilen rastgele bir kodla eşleşir; araştırmacı seni isimle tanımaz.',
        'Veri sorumlusu: ' +
          handler('controller') +
          '. Veriler ' +
          handler('hosting') +
          ' üzerinde saklanır ve yalnızca bu araştırmada kullanılır. Saklama süresi: ' +
          handler('retention') +
          '.',
        'Veriler üçüncü kişilerle paylaşılmaz; sonuçlar yayımlanırsa yalnızca kimliksiz ve toplu olarak yayımlanır. KVKK kapsamında verilerine erişme, düzeltilmesini ve silinmesini isteme haklarını ' +
          handler('contact') +
          ' adresine başvurarak kullanabilirsin.',
      ],
    ],
    [
      'risk',
      'Olası rahatsızlıklar ve yararlar',
      [
        'Simülatörde piyasada sert düşüşler olacak; bu bir miktar gerginlik yaratabilir. Gerçek para olmadığı için maddi bir riskin yok. Rahatsız olursan istediğin an durabilirsin. Çalışma sırasında bazı noktalarda ne kadar gergin hissettiğini soracağız; cevaplamak zorunda değilsin.',
        'Katılmanın sana doğrudan bir yararı yok; bulgular finansal okuryazarlık çalışmalarına katkı sağlayabilir. Çalışmanın sonunda, rahatsız hissedersen başvurabileceğin destek bilgisi de verilecek. Uygulama yatırım tavsiyesi vermez.',
      ],
    ],
    [
      'cekil',
      'Çekilme hakkın',
      [
        'Çalışma sırasında sağ üstteki ⋯ menüsünden "Çalışmadan çekil, verilerimi sil" diyebilirsin. Gerekçe göstermen gerekmez ve bunun bir sonucu olmaz. Çekilirsen bu koda ait veriler analizden çıkarılır ve silinir.',
        'Sonuçlar analiz edilip yayımlandıktan sonra, kimliksiz toplu sonuçlardan senin verini ayıklamak mümkün olmayabilir.',
      ],
    ],
    [
      'iletisim',
      'İletişim ve etik onay',
      [
        'Sorularını ' + handler('contact') + ' adresine iletebilirsin.',
        'Bu çalışma ' +
          handler('ethics') +
          ' onayıyla yürütülür.' +
          (CONFIG.consentInfo.funding ? ' Çalışma ' + handler('funding') + ' kapsamında yürütülür.' : ''),
      ],
    ],
  ];
}

export function consentText() {
  let html =
    'İLK LOT ARAŞTIRMASI\nGönüllü katılım ve bilgilendirme metni (sürüm ' +
    CONSENT_VERSION +
    ')\n' +
    new Date().toLocaleDateString('tr-TR') +
    '\n\nÖZET\n- Yaklaşık 30 dakika; gerçek para yok.\n- Adın, e-postan ya da öğrenci numaran istenmez; verilerin rastgele bir katılım koduyla eşleşir.\n- Gönüllüsün; istediğin an gerekçe göstermeden çekilebilirsin ve verilerin silinir.\n\n';
  consentSections(true).forEach(function (item) {
    html += item[1].toLocaleUpperCase('tr-TR') + '\n' + item[2].join('\n\n') + '\n\n';
  });
  return html + 'Bu metni indirmen, çalışmaya katılmayı kabul ettiğin anlamına gelmez.\n';
}

export function renderConsent() {
  state.consentStartedAt = state.consentStartedAt || Date.now();
  const icon = function (value) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      value +
      '</svg>'
    );
  };
  const sum = function (i, value, data) {
    return (
      '<div class="consent-summary">' +
      icon(i) +
      '<div><b>' +
      value +
      '</b><span>' +
      data +
      '</span></div></div>'
    );
  };
  const nextDay = TRIAL_SETS.X.length + TRIAL_SETS.Y.length;
  return (
    '<div class="stage" style="justify-content:flex-start;padding-top:8px"><h1 style="font-size:28px;margin:4px 0 6px">Katılmadan önce, kısaca</h1><p class="muted" style="margin:0 0 10px">Bu bir üniversite araştırması. Üç şeyi bilmen yeterli:</p><div class="font-size-section">' +
    fontSizeHtml() +
    '</div>' +
    sum(
      '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      'Yaklaşık 30 dakika',
      'Kısa kararlar ve bir piyasa simülatörü. Gerçek para yok.'
    ) +
    sum(
      '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      'Kimliksiz',
      'Adın, e-postan ya da öğrenci numaran istenmez. Verilerin rastgele bir kodla eşleşir.'
    ) +
    sum(
      '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
      'Gönüllüsün',
      'İstediğin an, gerekçe göstermeden çekilebilirsin; verilerin silinir.'
    ) +
    '<div class="muted small-text" style="font-weight:700;margin:16px 0 8px">Ayrıntılar (isteğe bağlı)</div>' +
    consentSections(false)
      .map(function (innerItem) {
        return (
          '<details class="consent-details" data-cs="' +
          innerItem[0] +
          '"><summary>' +
          innerItem[1] +
          '</summary>' +
          innerItem[2]
            .map(function (item) {
              return '<p>' + item + '</p>';
            })
            .join('') +
          '</details>'
        );
      })
      .join('') +
    '<button class="link" style="padding:10px 0;color:var(--act);text-align:left" data-a="downloadConsentText">Onam metnini indir (.txt)</button>' +
    '<label class="consent-check"><input type="checkbox" data-in="consentOk"' +
    (state.consentChecked ? ' checked' : '') +
    '><span>Yukarıdaki bilgileri okudum ve anladım. Bu çalışmaya gönüllü olarak katılmak istiyorum.</span></label>' +
    (state.enrollError
      ? '<div class="is-error" role="alert" id="enroll-error">' + escapeHtml(state.enrollError) + '</div>'
      : '') +
    '<div class="stage-actions" style="margin-top:14px"><button class="button is-primary" id="consent-button" data-a="acceptConsent"' +
    (state.busy || !state.consentChecked ? ' disabled' : '') +
    '>' +
    (state.busy ? 'Açılıyor…' : 'Katılmayı kabul ediyorum') +
    '</button></div></div>'
  );
}
