"""Pilot özeti: 10-12 kişilik pilot sonrası hangi sayıya bakacağını ve hangi karara varacağını gösterir.
Bu bir HİPOTEZ TESTİ değildir; müdahale etkisine bakmaz. Pilot verisi ana analize girmez (PILOT_PLANI.md).

Kullanım:
  python ilklot_pilot.py KATILIMCI.csv --olaylar OLAYLAR.csv [--cikti pilot_raporu.md]"""
import argparse
import json
import math
import os
import sys

import numpy as np
import pandas as pd

ESIK = dict(maruz_zayif=0.60, maruz_iyi=0.80, sure_sinir=35, sure_uzun=40, tamamlama=0.80, anlama=0.80, fark_edilme=0.60,
            dikkat=0.85, taban_alt=0.15, taban_ust=0.85, baslangic_anlama=0.80, sure_uzun_pay=0.50)


def tr(x, d=1):
    if x is None or (isinstance(x, float) and (math.isnan(x) or math.isinf(x))):
        return '-'
    return f'{x:.{d}f}'.replace('.', ',')


def yuzde(x):
    return '-' if x is None or (isinstance(x, float) and math.isnan(x)) else f'%{100 * x:.0f}'


def wilson(k, n, z=1.96):
    if n == 0:
        return (np.nan, np.nan)
    p = k / n
    payda = 1 + z * z / n
    merkez = (p + z * z / (2 * n)) / payda
    yari = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / payda
    return (max(0.0, merkez - yari), min(1.0, merkez + yari))


def sayisal(df, kolonlar):
    for c in kolonlar:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors='coerce')
    return df


def sure_hesapla(olaylar, kodlar):
    """Katılımcı başına dakika cinsinden süreler. Bitiş: bilgilendirme ekranı (yoksa oturum sonu)."""
    satirlar = []
    for kod in kodlar:
        x = olaylar[olaylar['code'] == kod].copy()
        if x.empty:
            continue
        x['t'] = pd.to_datetime(x['ts'], utc=True, errors='coerce')
        al = lambda tip, blok=None: ([t for t, d, ty in zip(x['t'], x['data'], x['type']) if ty == tip and (blok is None or json.loads(d or '{}').get('block') == blok)] or [None])[0]
        bas, pre, sim0, sim1, post = al('session_start'), al('task_start', 'pre'), al('sim_start'), al('sim_end'), al('task_start', 'post')
        son = al('debrief_view') or al('session_end')
        dk = lambda a, b: (b - a).total_seconds() / 60 if a is not None and b is not None else np.nan
        satirlar.append(dict(code=kod, toplam=dk(bas, son), hazirlik=dk(bas, pre), bolum1=dk(pre, sim0), simulator=dk(sim0, sim1), bolum3_ve_son=dk(post, son),
                             gizlenme=int((x['type'] == 'hidden').sum()), hata=int((x['type'] == 'client_error').sum()),
                             hizli=bool(any(json.loads(d or '{}').get('quick') for d, ty in zip(x['data'], x['type']) if ty == 'session_start'))))
    return pd.DataFrame(satirlar)


def ana(args):
    k = pd.read_csv(args.katilimci, encoding='utf-8-sig', dtype=str, keep_default_na=False)
    gerekli = ['code', 'grp', 'completed', 'decisions', 'panic_rate_pre', 'test_mode']
    eksik = [c for c in gerekli if c not in k.columns]
    if eksik:
        sys.exit(f'HATA: CSV dosyasında beklenen sütunlar yok: {", ".join(eksik)}')
    k = sayisal(k, ['completed', 'decisions', 'panic_rate_pre', 'panic_rate_post', 'test_mode', 'cooldown_shown', 'cooldown_cancel', 'cooldown_proceed',
                    'comprehension_first_try', 'attention_pass', 'help_opens', 'sim_loss_sells', 'pilot_clear'])
    k['grp'] = k['grp'].str.strip().str.upper()
    gercek = k[(k['test_mode'] != 1) & k['grp'].isin(['A', 'B'])].copy()
    if gercek.empty:
        sys.exit('HATA: analiz edilecek gerçek (test modu olmayan) katılımcı yok.')
    tam = gercek[(gercek['completed'] == 1) & (gercek['decisions'] == 12)]
    A, B = gercek[gercek.grp == 'A'], gercek[gercek.grp == 'B']
    tA = tam[tam.grp == 'A']
    uyarilar, kararlar = [], []
    R = ['# İlk Lot: pilot özeti\n']
    R.append(f'Girdi: `{os.path.basename(args.katilimci)}`' + (f' + `{os.path.basename(args.olaylar)}`' if args.olaylar else '') + '\n')
    if (k['test_mode'] == 1).any():
        R.append(f'> {int((k["test_mode"] == 1).sum())} hızlı test modu oturumu dışarıda bırakıldı (süre ve maruz kalma için geçersizdir).\n')
    if len(gercek) < 8:
        uyarilar.append(f'Yalnızca {len(gercek)} gerçek katılımcı var. Yüzdeler çok belirsiz; aralıklara bak, kesin karar verme.')
    R.append('## 1. Katılım\n')
    R.append('| | Toplam | A | B |\n|---|---|---|---|\n' + f'| Başlayan | {len(gercek)} | {len(A)} | {len(B)} |\n| Tamamlayan (12 karar) | {len(tam)} | {len(tam[tam.grp == "A"])} | {len(tam[tam.grp == "B"])} |\n')
    tamlama = len(tam) / len(gercek)
    lo, hi = wilson(len(tam), len(gercek))
    R.append(f'Tamamlama: **{yuzde(tamlama)}** (%95 GA {yuzde(lo)} - {yuzde(hi)}).\n')
    kararlar.append(('Tamamlama', yuzde(tamlama), f'< %{int(100 * ESIK["tamamlama"])}', tamlama < ESIK['tamamlama'], 'Yarıda bırakma nedenlerini görüşmelerle araştır; uzunluk/zorluk/teknik hata.'))

    R.append('## 2. Müdahale dozu (A grubu)\n')
    if 'cooldown_shown' in tA.columns and len(tA):
        gor = int((tA.cooldown_shown >= 1).sum())
        orn = gor / len(tA)
        lo, hi = wilson(gor, len(tA))
        R.append(f'Simülatörde bekleme ekranını gören A katılımcısı: **{gor}/{len(tA)} = {yuzde(orn)}** (%95 GA {yuzde(lo)} - {yuzde(hi)}). Güç hesabı bunu %70 varsaydı.\n')
        R.append(f'- Ekran sayısı (ortalama): {tr(tA.cooldown_shown.mean())}; vazgeçilen: {int(tA.cooldown_cancel.fillna(0).sum()) if 'cooldown_cancel' in tA.columns else 0}, onaylanan: {int(tA.cooldown_proceed.fillna(0).sum()) if 'cooldown_proceed' in tA.columns else 0}\n')
        kararlar.append(('Bekleme ekranını görme (A)', yuzde(orn), f'< %{int(100 * ESIK["maruz_zayif"])}: tasarımı güçlendir; %{int(100 * ESIK["maruz_zayif"])}-{int(100 * ESIK["maruz_iyi"])}: sınırda', orn < ESIK['maruz_iyi'], 'Gören sayısı düşükse A grubunun çoğu müdahaleyi almıyor demektir; güç düşer. ON_KAYIT_TASLAGI.md, Seçenek A.'))
        if 'manip_saw_wait' in tA.columns:
            g = tA[tA.cooldown_shown >= 1]
            if len(g):
                evet = float((g.manip_saw_wait == 'Evet').mean())
                R.append(f'- Ekranı görenlerin "gördüm" diyen payı: {yuzde(evet)} ({int((g.manip_saw_wait == "Evet").sum())}/{len(g)})\n')
                kararlar.append(('Müdahaleyi fark etme', yuzde(evet), f'< %{int(100 * ESIK["fark_edilme"])}', evet < ESIK['fark_edilme'], 'Bekleme ekranı belirgin değil ya da soru anlaşılmıyor.'))
        orn_alt = lo
    else:
        orn, orn_alt = np.nan, np.nan
        R.append('A grubunda tamamlayan katılımcı yok; doz hesaplanamadı.\n')

    R.append('## 3. Süre\n')
    sure = pd.DataFrame()
    if args.olaylar:
        ol = pd.read_csv(args.olaylar, encoding='utf-8-sig', dtype=str, keep_default_na=False)
        sure = sure_hesapla(ol, list(tam.code))
        sure = sure[~sure.hizli] if len(sure) else sure
    if len(sure) and sure.toplam.notna().any():
        t = sure.toplam.dropna()
        R.append(f'Tamamlayanlar (n = {len(t)}): medyan **{tr(t.median())} dk**, çeyrekler arası {tr(t.quantile(.25))} - {tr(t.quantile(.75))}, en uzun {tr(t.max())} dk.\n')
        R.append('| Bölüm | Medyan (dk) |\n|---|---|\n' + '\n'.join(f'| {ad} | {tr(sure[c].median())} |' for ad, c in (('Hazırlık (form, ön test, tanıtım, alıştırma)', 'hazirlik'), ('1. bölüm', 'bolum1'), ('Simülatör', 'simulator'), ('3. bölüm ve son adımlar', 'bolum3_ve_son'))) + '\n')
        R.append(f'Sekmeyi gizleme (ortalama): {tr(sure.gizlenme.mean())}; tarayıcı hatası olan oturum: {int((sure.hata > 0).sum())}.\n')
        kararlar.append(('Medyan süre (dk)', tr(t.median()), f'> {ESIK["sure_uzun"]}: kısalt; {ESIK["sure_sinir"]}-{ESIK["sure_uzun"]}: sınırda', t.median() > ESIK['sure_sinir'], 'Simülatör süresi ya da tanıtım adımlarını kısaltmayı düşün.'))
        if (sure.hata > 0).any():
            uyarilar.append(f'{int((sure.hata > 0).sum())} oturumda tarayıcı hatası kaydı var. Olay dosyasında `client_error` satırlarına bak.')
    else:
        R.append('Süre hesaplanamadı: olay dosyası (`--olaylar`) verilmedi ya da zaman damgası eksik.\n')

    R.append('## 4. Anlaşılırlık, dikkat ve geri bildirim\n')
    if 'comprehension_first_try' in tam.columns and tam.comprehension_first_try.notna().any():
        c = tam.comprehension_first_try.dropna()
        iyi = float((c >= 2).mean())
        R.append(f'- Anlama kontrolünde ilk denemede ≥ 2 doğru: **{yuzde(iyi)}** ({int((c >= 2).sum())}/{len(c)}); ortalama {tr(c.mean())}/3\n')
        kararlar.append(('Anlama kontrolü (≥ 2 doğru)', yuzde(iyi), f'< %{int(100 * ESIK["anlama"])}', iyi < ESIK['anlama'], 'Tanıtım ve alıştırma metinlerini sadeleştir; hangi sorunun yanlış gittiğine bak (`comprehension_answer` olayları).'))
    if 'attention_pass' in tam.columns and tam.attention_pass.notna().any():
        d = float(tam.attention_pass.mean())
        R.append(f'- Dikkat kontrolünü geçen: {yuzde(d)}\n')
        kararlar.append(('Dikkat kontrolü geçme', yuzde(d), f'< %{int(100 * ESIK["dikkat"])}', d < ESIK['dikkat'], 'Çok düşükse talimat ya da test uzunluğu sorunlu olabilir.'))
    if 'help_opens' in tam.columns and tam.help_opens.notna().any():
        R.append(f'- Sözlüğü (?) en az bir kez açan: {yuzde(float((tam.help_opens > 0).mean()))}; ortalama {tr(tam.help_opens.mean())} kez. Çok açılıyorsa terimler zor demektir.\n')

    # Pilot geri bildirim formu (yalnızca CFG.pilot:true yayınında dolar; gerçek veri toplamada bu sütunlar boştur)
    if {'pilot_clear', 'pilot_duration', 'pilot_unease'} <= set(gercek.columns):
        cev = gercek[gercek['pilot_clear'].notna() | (gercek['pilot_duration'] != '') | (gercek['pilot_unease'] != '')]
        R.append('### Pilot geri bildirimi (uygulama içi 3 soru)\n')
        if cev.empty:
            R.append('Yanıt yok: form yalnızca `CFG.pilot:true` yayınında çıkar, ya da katılımcılar atladı.\n')
        else:
            R.append(f'Yanıtlayan: {len(cev)}/{len(gercek)} (sorular isteğe bağlı; atlayan sayılmaz).\n')
            ac = cev['pilot_clear'].dropna()
            if len(ac):
                iyi = float((ac >= 4).mean())
                R.append(f'- İlk dakikada anlama (1-5), n = {len(ac)}: ortalama {tr(ac.mean())}; 4-5 diyen **{yuzde(iyi)}** ({int((ac >= 4).sum())}/{len(ac)})\n')
                kararlar.append(('Başta anlama (geri bildirim, 4-5)', yuzde(iyi), f'< %{int(100 * ESIK["baslangic_anlama"])}', iyi < ESIK['baslangic_anlama'], 'Tanıtım ve alıştırma metinlerini sadeleştir; anlama kontrolüyle birlikte oku.'))
            sd = cev[cev['pilot_duration'] != '']['pilot_duration']
            if len(sd):
                uz = float(sd.isin(['Uzun', 'Çok uzun']).mean())
                R.append('- Süre algısı, n = ' + str(len(sd)) + ': ' + ', '.join(f'{ad} {int((sd == ad).sum())}' for ad in ('Çok kısa', 'Uygun', 'Uzun', 'Çok uzun')) + f'; "uzun" ya da "çok uzun": **{yuzde(uz)}**\n')
                kararlar.append(('Süreyi uzun bulan (geri bildirim)', yuzde(uz), f'> %{int(100 * ESIK["sure_uzun_pay"])}', uz > ESIK['sure_uzun_pay'], 'Ölçülen süreyle birlikte oku; simülatör ya da tanıtım adımlarını kısaltmayı düşün.'))
            ur = cev[cev['pilot_unease'] != '']['pilot_unease']
            if len(ur):
                ev = int((ur == 'Evet').sum())
                R.append('- Rahatsızlık / gerginlik, n = ' + str(len(ur)) + ': ' + ', '.join(f'{ad} {int((ur == ad).sum())}' for ad in ('Hayır', 'Biraz', 'Evet')) + '\n')
                kararlar.append(('Rahatsız olduğunu söyleyen (Evet)', f'{ev}/{len(ur)}', 'herhangi biri', ev > 0, 'Hangi anda olduğunu görüşmede sor; etik kurula ve danışmana bildirilecek bir bulgu olarak değerlendir. Neyin değişeceği sana ait bir karar.'))
        R.append('')

    R.append('## 5. Taban davranış\n')
    pre = tam.panic_rate_pre.dropna()
    taban_logit = None
    if len(pre):
        dag = pre.round(2).value_counts().sort_index()
        R.append(f'1. bölüm panik satış oranı (tamamlayanlar, n = {len(pre)}): ortalama **{tr(pre.mean(), 2)}**, SS {tr(pre.std(), 2)}. Dağılım: ' + ', '.join(f'{tr(i, 2)}: {int(v)}' for i, v in dag.items()) + '\n')
        R.append(f'Hiç satmayan ya da hep satan: {int(((pre == 0) | (pre == 1)).sum())}/{len(pre)}. Güç hesabı ortalama %50 varsaydı.\n')
        kararlar.append(('Taban panik satış oranı', tr(pre.mean(), 2), f'< {ESIK["taban_alt"]} ya da > {ESIK["taban_ust"]}', pre.mean() < ESIK['taban_alt'] or pre.mean() > ESIK['taban_ust'], 'Tavan/taban etkisi: uyaranların zorluğunu (zarar ve düşüş büyüklüğü) gözden geçir.'))
        p = float(np.clip(pre.mean(), 0.05, 0.95))
        taban_logit = math.log(p / (1 - p))

    R.append('## 6. Karar tablosu\n')
    R.append('| Ölçüt | Değer | Eşik | Durum | Ne yapılır |\n|---|---|---|---|---|\n' + '\n'.join(f'| {a} | {b} | {c} | {"**İNCELE**" if d else "tamam"} | {e if d else ""} |' for a, b, c, d, e in kararlar) + '\n')
    for u in uyarilar:
        R.append(f'> UYARI: {u}\n')

    R.append('## 7. Güç hesabını güncelle\n')
    if not math.isnan(orn):
        komut = f'python ilklot_guc.py --maruz {tr(max(orn, 0.05), 2).replace(",", ".")}' + (f' --taban {tr(taban_logit, 2).replace(",", ".")}' if taban_logit is not None else '') + ' --tekrar 1000'
        alt = f'python ilklot_guc.py --maruz {tr(max(orn_alt, 0.05), 2).replace(",", ".")}' + (f' --taban {tr(taban_logit, 2).replace(",", ".")}' if taban_logit is not None else '') + ' --tekrar 1000'
        R.append('Ölçülen değerlerle:\n\n```\n' + komut + '\n```\n\nGüven aralığının alt sınırıyla (kötümser senaryo):\n\n```\n' + alt + '\n```\n')
        R.append('Pilot küçük olduğu için maruz kalma oranı belirsizdir; kararı tek bir sayıya değil iki senaryoya birden bakarak ver. Kişiler arası değişkenlik (sigma) bu örneklemden güvenilir tahmin edilemez, varsayılanı koru.\n')
    metin = '\n'.join(R)
    if args.cikti:
        open(args.cikti, 'w', encoding='utf-8').write(metin)
        print(f'Pilot raporu yazıldı: {args.cikti}')
    print(metin)


def main():
    ap = argparse.ArgumentParser(description='İlk Lot pilot özeti')
    ap.add_argument('katilimci')
    ap.add_argument('--olaylar')
    ap.add_argument('--cikti')
    ana(ap.parse_args())


if __name__ == '__main__':
    main()
