# Üretimden sonra tek seferlik, betikli düzenlemeler (app-config sadeleştirme). build.sh çağırır.
import re, io
p='../../public/src/constants/app-config.js'
s=open(p,encoding='utf-8').read()
start=s.index('// ── Hızlı test modu ──')
end=s.index('// ═════════════════ DURUM ═════════════════')
s=s[:start]+"""// Pilot geri bildirim formu: yalnızca CONFIG.pilot ile açılır. Gerçek veri toplamada MUTLAKA false (firebase/dagit.py kontrol eder).
export const PILOT_MODE = CONFIG.pilot === true;

"""+s[end:]
s=s.replace("export const QUERY_PARAMS = new URLSearchParams(location.search);\n\n","")
s=re.sub(r"// Kişiye özel link:[^\n]*\nexport const HASH_PARAMS = [^\n]*\n\n","",s)
s=s.replace("  pilot: false,\n","  pilot: false,\n  seed: 'ilklot-gorev-v1', // karar anı uyaranlarının tohumu; pilot başladıktan sonra DEĞİŞTİRME\n")
s=s.replace("// Uygulama sürümü, çalışma ayarları (CONFIG) ve çalışma kipi bayrakları. Tüm modüller buradan okur; pilot başladıktan sonra ölçüt ayarları DEĞİŞTİRİLMEZ.","// Uygulama sürümü ve çalışma ayarları (CONFIG). Tüm modüller buradan okur; pilot başladıktan sonra ölçüt ayarları DEĞİŞTİRİLMEZ.")
s=re.sub(r"\nexport const FORCED_SESSION[^\n]*\n","\n",s)
s=s.replace("CONFIG.seed = 'ilklot-gorev-v1';\n","")
open(p,'w',encoding='utf-8').write(s)
