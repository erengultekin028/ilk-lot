// "Yeni eklenenler" kartı: araştırmacının son sürümlerde eklenen özellikleri kendisinin kontrol edebilmesi için.
// Kart kapatılabilir (tarayıcıda hatırlanır); yeni sürümde yeni bir anahtarla yeniden görünür.

import { APP_VERSION } from '../constants/app-config.js';
import { escapeHtml } from '../utils/format.js';
import { section } from '../widgets/section.js';

// Her öğe: sürüm, başlık, nerede, nasıl kontrol edilir
export const WHATS_NEW = [
  {
    version: 'b36',
    title: 'Çekilen katılımcı için "Yeni katılım başlat"',
    where:
      'Katılımcı uygulaması → "Çalışmadan çekildin" ekranı (menüden çekilince ya da sonradan siteyi açınca)',
    check:
      'Ekranın altında "Baştan başlamak ister misin?" ve "Yeni katılım başlat" düğmesi çıkar; onaylayınca sayfa yenilenir, onam ekranından yeni bir katılım (yeni yuva) başlar. 18 yaş altı nedeniyle kapanan kayıtta düğme çıkmaz. Karar (28.10.2026): pilota kadar açık; ana veri toplamadan önce kapatılacak (karar paketi madde 17), `dagit.py` ön kontrolü açıkken HATA verir.',
  },
  {
    version: 'b35',
    title: 'Erişilebilirlik taraması (axe-core) ve düzeltme',
    where: 'Bilgisayarında: python testler/ekran_testleri.py "axe-core" · belge: docs/ERISILEBILIRLIK.md',
    check:
      'Katılımcı ekranları (telefon ve masaüstü; koyu, açık tema, büyük yazı) ve bu panel WCAG 2.1 A/AA için taranır. Karar ekranındaki ilerleme çubuğu düzeltildi. Açık temada kırmızı rozetin kontrastı 4,13:1 (eşik 4,5:1); uyaran rengi olduğu için SENİN onayını bekliyor, seçenekler belgede.',
  },
  {
    version: 'b35',
    title: 'Gerçek cihaz protokolü ve pilot raporu şablonu (yeni akışa göre)',
    where: 'Depo → docs/GERCEK_CIHAZ_TESTI.md ve docs/PILOT_PLANI.md',
    check:
      'Eski kart/kod akışı kalktı; protokol anonim giriş, yuva, bekleme ekranı, test kaydı ve tam yedeği kapsar (klavye ve ekran okuyucu senaryosu dahil). Pilot planında "önce CSV indir, sonra test olarak işaretle" sırası ve 10 başlıklı rapor şablonu var.',
  },
  {
    version: 'b35',
    title: 'Kaynakça doğrulandı',
    where: 'Depo → docs/KURAMSAL_CERCEVE.md',
    check:
      "10 kaynağın künyesi web'den denetlendi, DOI'ler eklendi; 3 kaynakta DOI/yayıncı hâlâ [DOĞRULA]. Yanlış atfedilen iki kavram düzeltildi. Makalelerin tam metni okunmadı.",
  },
  {
    version: 'b34',
    title: 'Tam yedek (JSON)',
    where: 'Panel → "Tam yedek" bölümü',
    check:
      '"Tam yedeği indir" düğmesine bas; tüm katılımcılar, olaylar ve yuva listesi tek .json dosyası olarak iner. Dosyada sayımlar (katılımcı, olay, liste) yazılıdır. Dosya grup bilgisini içerir, paylaşma.',
  },
  {
    version: 'b34',
    title: 'Karar paketi, kuramsal çerçeve, Gantt ve risk matrisi',
    where: 'Depo → docs/ klasörü',
    check:
      'docs/KARAR_PAKETI.md (kapatılacak kararlar), docs/KURAMSAL_CERCEVE.md (kaynaklar [DOĞRULA] işaretli), docs/GANTT_VE_RISK.md (çizelge ve 13 risk). Güncellenen: VERI_YONETIM_PLANI, KATILIMCI_TOPLAMA_PLANI, IS_ZAMAN_BUTCE_TASLAGI.',
  },
  {
    version: 'b34',
    title: 'Tarayıcı uçtan uca testleri (yeni yapı)',
    where: 'Bilgisayarında: python testler/ekran_testleri.py',
    check:
      "Bekleme ekranı geri sayımı, rehberli tur, çekilme onayı, canlı portföy toplamı, simülatör sekmeleri ve yönetim paneli akışlarını gerçek Firebase'e yazmadan dener.",
  },
  {
    version: 'b33',
    title: 'Çekilmede ikinci onay',
    where: 'Katılımcı uygulaması → ⋯ menüsü → "Çalışmadan çekil"',
    check:
      'Düğmeye basınca ilk onaydan sonra "Emin misin?" penceresi çıkar; ikinci pencerede vazgeçersen kayıt değişmez. Gerçekten çekilen kayıt panelden geri açılamaz; denerken gizli pencere kullan.',
  },
  {
    version: 'b32',
    title: 'Test kayıtlarını işaretleme',
    where: 'Panel → "Test kayıtları" bölümü',
    check:
      'Kayıtları yükle → süzgeç seç (eski sürüm, bekleme ekranı görenler, tamamlanmayan) → seç → "Test kaydı olarak işaretle". Kayıt silinmez; "İşaretli" görünümünden geri alınır.',
  },
];

const SEEN_KEY = 'ilklot:whatsNewSeen';

export function whatsNewKey() {
  return APP_VERSION;
}

export function isWhatsNewDismissed() {
  try {
    return localStorage.getItem(SEEN_KEY) === whatsNewKey();
  } catch (error) {
    return false;
  }
}

export function dismissWhatsNew() {
  try {
    localStorage.setItem(SEEN_KEY, whatsNewKey());
  } catch (error) {}
}

export function renderWhatsNewSection() {
  if (isWhatsNewDismissed()) return '';
  return section(
    'Yeni eklenenler <span class="new-badge">Yeni</span>',
    '<p class="muted small-text" style="margin:0 0 10px">Son sürümlerde eklenenler ve nasıl kontrol edileceği. Bitirince kartı kapatabilirsin; sonraki sürümde yenisi görünür.</p>' +
      WHATS_NEW.map(function (item) {
        return (
          '<div class="whats-new-item"><div class="whats-new-title"><span class="new-badge">' +
          escapeHtml(item.version) +
          '</span> ' +
          escapeHtml(item.title) +
          '</div><div class="muted small-text"><b>Nerede:</b> ' +
          escapeHtml(item.where) +
          '</div><div class="muted small-text"><b>Nasıl kontrol edilir:</b> ' +
          escapeHtml(item.check) +
          '</div></div>'
        );
      }).join('') +
      '<button class="button small-text" style="margin-top:10px" data-a="dismissWhatsNew">Kontrol ettim, kartı kapat</button>'
  );
}
